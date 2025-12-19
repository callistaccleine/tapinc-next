export const runtime = "nodejs";

import { NextResponse } from "next/server";
import path from "path";

type WalletPayload = {
  name: string;
  company: string;
  title: string;
  barcodeMessage: string;
  serialNumber: string;
  logoUrl?: string;
  stripImageUrl?: string;
  colors?: {
    background?: string;
    label?: string;
    text?: string;
  };
};

const TEMPLATE_PATH = path.join(process.cwd(), "passkit", "template.pass");

const hexToRgb = (hex: string, fallback: string) => {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return fallback;
  const [, r, g, b] = match;
  return `rgb(${parseInt(r, 16)},${parseInt(g, 16)},${parseInt(b, 16)})`;
};

const fetchBuffer = async (url?: string) => {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } catch (e) {
    console.warn("Fetch buffer failed", e);
    return null;
  }
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

  const {
    name,
    company,
    title,
    barcodeMessage,
    serialNumber,
    logoUrl,
    stripImageUrl,
    colors,
  } = body;

  const backgroundColor = hexToRgb(colors?.background ?? "#0c0d11", "rgb(12,13,17)");
  const labelColor = hexToRgb(colors?.label ?? "#d1b89b", "rgb(209,184,155)");
  const textColor = hexToRgb(colors?.text ?? "#f8fafc", "rgb(248,250,252)");

  try {
    const { PKPass } = passkit;

    const pass = await PKPass.from(
      {
        model: TEMPLATE_PATH,
        certificates: {
          wwdr: wwdrPath,
          signerCert: certPath,
          signerKey: certPath,
          signerKeyPassphrase: certPassword,
        },
      },
      {
        teamIdentifier,
        passTypeIdentifier,
        organizationName: orgName,
        serialNumber,
        description: "TapInk Apple Wallet",
        logoText: company,
        barcode: {
          message: barcodeMessage,
          format: "PKBarcodeFormatQR",
          messageEncoding: "iso-8859-1",
          altText: company,
        },
        backgroundColor,
        foregroundColor: textColor,
        labelColor,
        generic: {
          primaryFields: [{ key: "name", label: "NAME", value: name }],
          secondaryFields: [{ key: "company", label: "COMPANY", value: company }],
          auxiliaryFields: [{ key: "title", label: "TITLE", value: title }],
        },
      }
    );

    const [logoBuffer, stripBuffer] = await Promise.all([
      fetchBuffer(logoUrl),
      fetchBuffer(stripImageUrl),
    ]);

    if (logoBuffer) {
      await pass.addBuffer("logo.png", logoBuffer);
    }
    if (stripBuffer) {
      await pass.addBuffer("strip.png", stripBuffer);
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
    const message = err instanceof Error ? err.message : "Failed to generate wallet pass.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
