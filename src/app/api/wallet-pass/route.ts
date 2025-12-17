export const runtime = "nodejs";

import { NextResponse } from "next/server";

type WalletPayload = {
  name: string;
  company: string;
  title: string;
  barcodeMessage: string;
  serialNumber: string;
  logoUrl?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as WalletPayload | null;

  // Validate env vars required for real pass generation
  const certPath = process.env.PASSKIT_CERT_P12_PATH;
  const certPassword = process.env.PASSKIT_CERT_PASSWORD;
  const wwdrPath = process.env.PASSKIT_WWDR_CERT_PATH;
  const teamIdentifier = process.env.PASSKIT_TEAM_IDENTIFIER;
  const passTypeIdentifier = process.env.PASSKIT_PASS_TYPE_IDENTIFIER;
  const orgName = process.env.PASSKIT_ORGANIZATION_NAME;

  if (
    !certPath ||
    !certPassword ||
    !wwdrPath ||
    !teamIdentifier ||
    !passTypeIdentifier ||
    !orgName
  ) {
    return NextResponse.json(
      {
        error:
          "Wallet signing certs are not configured. Set PASSKIT_CERT_P12_PATH, PASSKIT_CERT_PASSWORD, PASSKIT_WWDR_CERT_PATH, PASSKIT_TEAM_IDENTIFIER, PASSKIT_PASS_TYPE_IDENTIFIER, PASSKIT_ORGANIZATION_NAME.",
      },
      { status: 501 }
    );
  }

  // Try to import passkit-generator only when configured
  const dynamicImport = new Function("specifier", "return import(specifier);") as (
    specifier: string
  ) => Promise<any>;
  let passkit: any = null;
  try {
    passkit = await dynamicImport("passkit-generator");
  } catch (err) {
    console.error("passkit-generator not installed", err);
    return NextResponse.json(
      { error: "Install passkit-generator to generate .pkpass files." },
      { status: 501 }
    );
  }

  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { name, company, title, barcodeMessage, serialNumber, logoUrl } = body;

  try {
    const { PKPass } = passkit;

    const pass = await PKPass.from({
      model: "eventTicket", // generic style; you can switch to "generic" if preferred
      certificates: {
        wwdr: wwdrPath,
        signerCert: certPath,
        signerKey: certPath,
        signerKeyPassphrase: certPassword,
      },
      teamIdentifier,
      passTypeIdentifier,
      organizationName: orgName,
      serialNumber,
      description: "TapInk Apple Wallet",
      foregroundColor: "rgb(255,255,255)",
      backgroundColor: "rgb(0,0,0)",
      barcode: {
        message: barcodeMessage,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
      },
      logoText: company,
      generic: {
        primaryFields: [{ key: "name", label: "NAME", value: name }],
        secondaryFields: [{ key: "company", label: "COMPANY", value: company }],
        auxiliaryFields: [{ key: "title", label: "TITLE", value: title }],
      },
    });

    if (logoUrl) {
      try {
        await pass.addBuffer("logo.png", await fetch(logoUrl).then((r) => r.arrayBuffer()));
      } catch (e) {
        console.warn("Failed to attach logo", e);
      }
    }

    const stream = pass.getAsStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": 'attachment; filename="tapink-wallet.pkpass"',
      },
    });
  } catch (err) {
    console.error("Wallet generation failed", err);
    return NextResponse.json({ error: "Failed to generate wallet pass." }, { status: 500 });
  }
}
