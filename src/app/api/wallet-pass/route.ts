export const runtime = "nodejs";

import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import forge from "node-forge";

type SharpFactory = typeof import("sharp");

let sharpModule: SharpFactory | null = null;

const getSharp = async (): Promise<SharpFactory> => {
  if (sharpModule) {
    return sharpModule;
  }

  const mod = (await import("sharp")) as unknown as {
    default?: SharpFactory;
  };
  sharpModule = mod.default ?? (mod as unknown as SharpFactory);
  return sharpModule;
};

type WalletPayload = {
  name: string;
  company: string;
  title: string;
  barcodeMessage: string;
  logoUrl?: string;
  stripImageUrl?: string;
  profilePicUrl?: string;
  colors?: {
    background?: string;
    label?: string;
    text?: string;
  };
};

const TEMPLATE_PATH = path.join(process.cwd(), "passkit", "template.pass");
const DEFAULT_ICON_PATH = path.join(process.cwd(), "public", "images", "TAPINK_ICON_WHITE.png");

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

const readLocalBuffer = async (filePath: string) => {
  try {
    return await fs.readFile(filePath);
  } catch (err) {
    console.warn("Failed to read local asset", filePath, err);
    return null;
  }
};

const resizeLogo = async (buffer: Buffer, size: number) => {
  const sharp = await getSharp();
  return sharp(buffer)
    .rotate()
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
};

const renderCircularImage = async (buffer: Buffer, size: number) => {
  const sharp = await getSharp();
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/>
    </svg>`
  );
  return sharp(buffer)
    .rotate()
    .resize(size, size, { fit: "cover" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
};

const isPem = (value: string) => value.includes("-----BEGIN");

const readCertificateSource = async (value: string, label: string) => {
  if (isPem(value)) {
    return Buffer.from(value, "utf-8");
  }

  try {
    return await fs.readFile(value);
  } catch (err) {
    throw new Error(`${label} not found at ${value}`);
  }
};

const normalizePemCertificate = (buffer: Buffer, label: string) => {
  const asText = buffer.toString("utf-8");
  if (isPem(asText)) {
    return buffer;
  }

  try {
    const der = forge.util.createBuffer(buffer.toString("binary"));
    const asn1 = forge.asn1.fromDer(der);
    const cert = forge.pki.certificateFromAsn1(asn1);
    const pem = forge.pki.certificateToPem(cert);
    return Buffer.from(pem, "utf-8");
  } catch (err) {
    throw new Error(`${label} is not a valid PEM or DER certificate`);
  }
};

const ensurePemKey = (buffer: Buffer, label: string) => {
  const asText = buffer.toString("utf-8");
  if (!isPem(asText)) {
    throw new Error(`${label} must be PEM formatted (-----BEGIN ... KEY-----).`);
  }
  return buffer;
};

const extractP12Certificates = (buffer: Buffer, passphrase: string, label: string) => {
  try {
    const der = forge.util.createBuffer(buffer.toString("binary"));
    const asn1 = forge.asn1.fromDer(der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, passphrase);
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];
    const keyBags =
      p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag] ||
      p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag];

    const certBag = certBags?.[0]?.cert;
    const keyBag = keyBags?.[0]?.key;

    if (!certBag || !keyBag) {
      throw new Error("PKCS#12 missing certificate or private key.");
    }

    return {
      signerCert: Buffer.from(forge.pki.certificateToPem(certBag), "utf-8"),
      signerKey: Buffer.from(forge.pki.privateKeyToPem(keyBag), "utf-8"),
    };
  } catch (err) {
    throw new Error(`${label} could not be parsed. Check the passphrase and file format.`);
  }
};

export async function GET(req: Request) {
  console.warn("Wallet pass route called with unsupported method", {
    method: req.method,
    url: req.url,
  });
  return NextResponse.json(
    { error: "Method not allowed. Use POST.", method: req.method, allowed: ["POST"] },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || "*";

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    },
  });
}


export async function POST(req: Request) {
  console.log("=== POST /api/wallet-pass called ===");
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);
 
  // Log environment variables (without exposing sensitive data)
  console.log("Environment check:", {
    hasCertPath: !!process.env.PASSKIT_CERT_P12_PATH,
    hasCertPassword: !!process.env.PASSKIT_CERT_PASSWORD,
    hasWWDR: !!process.env.PASSKIT_WWDR_CERT_PATH,
    hasTeamId: !!process.env.PASSKIT_TEAM_IDENTIFIER,
    hasPassTypeId: !!process.env.PASSKIT_PASS_TYPE_IDENTIFIER,
    hasOrgName: !!process.env.PASSKIT_ORGANIZATION_NAME,
    hasSignerCert: !!process.env.PASSKIT_SIGNER_CERT_PATH,
    hasSignerKey: !!process.env.PASSKIT_SIGNER_KEY_PATH,
  });
 
  let body: WalletPayload | null = null;
  let parseError: unknown = null;
  try {
    body = (await req.json()) as WalletPayload;
 
    const certPath = process.env.PASSKIT_CERT_P12_PATH;
    const certPassword = process.env.PASSKIT_CERT_PASSWORD;
    const wwdrPath = process.env.PASSKIT_WWDR_CERT_PATH;
    const teamIdentifier = process.env.PASSKIT_TEAM_IDENTIFIER;
    const passTypeIdentifier = process.env.PASSKIT_PASS_TYPE_IDENTIFIER;
    const orgName = process.env.PASSKIT_ORGANIZATION_NAME;
 
    const signerCertPath =
      process.env.PASSKIT_SIGNER_CERT_PATH || process.env.PASSKIT_CERT_PEM;
    const signerKeyPath =
      process.env.PASSKIT_SIGNER_KEY_PATH || process.env.PASSKIT_KEY_PEM;
    const signerKeyPassphrase =
      process.env.PASSKIT_SIGNER_KEY_PASSWORD ||
      process.env.PASSKIT_CERT_PASSWORD;
 
    const hasP12Config = Boolean(certPath && certPassword);
    const hasPemConfig = Boolean(signerCertPath && signerKeyPath);
 
    if (
      !wwdrPath ||
      !teamIdentifier ||
      !passTypeIdentifier ||
      !orgName ||
      (!hasP12Config && !hasPemConfig)
    ) {
      return NextResponse.json(
        {
          error:
            "Wallet signing certs are not configured. Set PASSKIT_CERT_P12_PATH + PASSKIT_CERT_PASSWORD or PASSKIT_SIGNER_CERT_PATH + PASSKIT_SIGNER_KEY_PATH (or PASSKIT_CERT_PEM + PASSKIT_KEY_PEM), along with PASSKIT_WWDR_CERT_PATH, PASSKIT_TEAM_IDENTIFIER, PASSKIT_PASS_TYPE_IDENTIFIER, PASSKIT_ORGANIZATION_NAME.",
        },
        { status: 501 }
      );
    }
 
    const dynamicImport = new Function(
      "specifier",
      "return import(specifier);"
    ) as (specifier: string) => Promise<any>;
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
      console.warn("Wallet pass invalid payload", {
        method: req.method,
        url: req.url,
        error: parseError instanceof Error ? parseError.message : parseError,
      });
      return NextResponse.json(
        {
          error: "Invalid payload",
          details: parseError ? "Invalid JSON body" : "Empty body",
        },
        { status: 400 }
      );
    }
 
  const {
    name,
    company,
    title,
    barcodeMessage,
    logoUrl,
    stripImageUrl,
    profilePicUrl,
    colors,
  } = body;
 
    const backgroundColor = hexToRgb(
      colors?.background ?? "#0c0d11",
      "rgb(12,13,17)"
    );
    const labelColor = hexToRgb(colors?.label ?? "#ff7a1c", "rgb(255,122,28)");
    const textColor = hexToRgb(colors?.text ?? "#f8fafc", "rgb(248,250,252)");
 
    try {
      const { PKPass } = passkit;
 
      const wwdrSource = await readCertificateSource(
        wwdrPath,
        "WWDR certificate"
      );
      const wwdrPem = normalizePemCertificate(wwdrSource, "WWDR certificate");
 
      let signerCert: Buffer;
      let signerKey: Buffer;
      let signerPassphrase: string | undefined = signerKeyPassphrase;
 
      if (hasP12Config && certPath && certPassword) {
        const p12Source = await readCertificateSource(
          certPath,
          "PKCS#12 certificate"
        );
        const extracted = extractP12Certificates(
          p12Source,
          certPassword,
          "PKCS#12 certificate"
        );
        signerCert = extracted.signerCert;
        signerKey = extracted.signerKey;
        signerPassphrase = undefined;
      } else if (signerCertPath && signerKeyPath) {
        const signerCertSource = await readCertificateSource(
          signerCertPath,
          "Signer certificate"
        );
        const signerKeySource = await readCertificateSource(
          signerKeyPath,
          "Signer key"
        );
        signerCert = normalizePemCertificate(
          signerCertSource,
          "Signer certificate"
        );
        signerKey = ensurePemKey(signerKeySource, "Signer key");
      } else {
        throw new Error("Signing certificates are not configured.");
      }
 
      const certificates = {
        wwdr: wwdrPem,
        signerCert,
        signerKey,
        signerKeyPassphrase: signerPassphrase,
      };
 
      const pass = await PKPass.from(
        {
          model: TEMPLATE_PATH,
          certificates,
        },
        {
          teamIdentifier,
          passTypeIdentifier,
          organizationName: orgName,
          description: "TapINK Apple Wallet",
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
            secondaryFields: [{ key: "title", label: "TITLE", value: title }],
            auxiliaryFields: [
              { key: "company", label: "COMPANY", value: company },
            ],
          },
        }
      );
 
      pass.primaryFields.push({ key: "name", label: "NAME", value: name });
      pass.secondaryFields.push({ key: "title", label: "TITLE", value: title });
      pass.auxiliaryFields.push({
        key: "company",
        label: "COMPANY",
        value: company,
      });
      pass.setBarcodes({
        message: barcodeMessage,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: " ",
      });
 
      const [logoBuffer, stripBuffer, profilePicBuffer, defaultIconBuffer] = await Promise.all([
        fetchBuffer(logoUrl),
        fetchBuffer(stripImageUrl),
        fetchBuffer(profilePicUrl),
        readLocalBuffer(DEFAULT_ICON_PATH),
      ]);
 
      const iconBuffer = logoBuffer ?? defaultIconBuffer;
      if (iconBuffer) {
        await pass.addBuffer("icon.png", iconBuffer);
        await pass.addBuffer("icon@2x.png", iconBuffer);
      }
      const logoSource = logoBuffer ?? defaultIconBuffer;
      if (logoSource) {
        const [logo1x, logo2x] = await Promise.all([
          resizeLogo(logoSource, 40),
          resizeLogo(logoSource, 80),
        ]);
        await pass.addBuffer("logo.png", logo1x);
        await pass.addBuffer("logo@2x.png", logo2x);
      }
      if (stripBuffer) {
        await pass.addBuffer("strip.png", stripBuffer);
        await pass.addBuffer("strip@2x.png", stripBuffer);
      }
      if (profilePicBuffer) {
        const [thumb1x, thumb2x] = await Promise.all([
          renderCircularImage(profilePicBuffer, 80),
          renderCircularImage(profilePicBuffer, 160),
        ]);
        await pass.addBuffer("thumbnail.png", thumb1x);
        await pass.addBuffer("thumbnail@2x.png", thumb2x);
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
          "Access-Control-Allow-Origin": req.headers.get("origin") || "*",
          "Vary": "Origin",
        },
      });
    } catch (err) {
      console.error("Wallet generation failed", err);
      const message =
        err instanceof Error ? err.message : "Failed to generate wallet pass.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (err) {
    console.log("Error processing wallet pass request", err);
    parseError = err;
    const message =
      err instanceof Error ? err?.message : "Failed to process POST request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
