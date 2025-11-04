"use server";

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { Readable } from "node:stream";

type ExportRequestPayload = {
  designProfileId?: string | null;
  frontImage?: string;
  backImage?: string;
  resolution?: string | number;
  widthPx?: number;
  heightPx?: number;
  designSettings?: Record<string, unknown>;
};

const REQUIRED_SCOPES = ["https://www.googleapis.com/auth/drive.file"];

/* ✅ Helper to safely read env vars */
const getEnvOrThrow = (key: string) => {
  const value = process.env[key];
  if (!value) {
    console.error(`❌ Missing required env var: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

/* ✅ Converts base64 image to Buffer */
const dataUrlToBuffer = (dataUrl: string, label: string) => {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error(`Invalid data URL supplied for ${label}`);
  return Buffer.from(match[2], "base64");
};

/* ✅ Initializes Google Drive client with proper newline decoding */
const getDriveClient = async () => {
  const clientEmail = getEnvOrThrow("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKey = getEnvOrThrow("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY").replace(/\\n/g, "\n");

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: REQUIRED_SCOPES,
    });

    await auth.authorize();
    console.log("✅ Google Drive Auth successful as:", clientEmail);

    return google.drive({ version: "v3", auth });
  } catch (err) {
    console.error("❌ Google Drive Auth failed:", err);
    throw new Error("Failed to authenticate with Google Drive");
  }
};

/* ✅ Uploads or updates file */
const uploadOrUpdateFile = async ({
  drive,
  folderId,
  name,
  mimeType,
  buffer,
  description,
}: {
  drive: ReturnType<typeof google.drive>;
  folderId: string;
  name: string;
  mimeType: string;
  buffer: Buffer;
  description?: string;
}) => {
  try {
    const existing = await drive.files.list({
      q: `'${folderId}' in parents and name = '${name}' and trashed = false`,
      pageSize: 1,
      fields: "files(id, name)",
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });

    const media = { mimeType, body: Readable.from(buffer) };

    if (existing.data.files?.length) {
      const fileId = existing.data.files[0].id!;
      await drive.files.update({
        fileId,
        media,
        requestBody: { name, description },
        supportsAllDrives: true,
      });
      console.log(`🔁 Updated file: ${name} (${fileId})`);
      return fileId;
    }

    // ✅ Shared Drive-safe file creation
    const createResponse = await drive.files.create({
      media,
      requestBody: {
        name,
        parents: [folderId],
        description,
      },
      fields: "id",
      supportsAllDrives: true,
    });

    console.log(`📤 Uploaded new file: ${name} (${createResponse.data.id})`);
    return createResponse.data.id;
  } catch (err) {
    console.error(`❌ Upload failed for ${name}:`, err);
    throw new Error(`Failed to upload ${name}`);
  }
};

/* ✅ Main handler */
export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ExportRequestPayload;
    const { designProfileId, frontImage, backImage, resolution, widthPx, heightPx, designSettings } = payload;

    if (!designProfileId || !frontImage || !backImage || typeof widthPx !== "number" || typeof heightPx !== "number") {
      console.error("❌ Missing required fields:", payload);
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const dpi = typeof resolution === "string" ? Number(resolution) : resolution;
    if (!dpi || Number.isNaN(dpi)) return NextResponse.json({ error: "Invalid resolution" }, { status: 400 });

    /* 🧠 Convert PNGs to buffers */
    const frontBuffer = dataUrlToBuffer(frontImage, "frontImage");
    const backBuffer = dataUrlToBuffer(backImage, "backImage");

    /* 🧩 Create PDF */
    const pdfDoc = await PDFDocument.create();
    const widthInPoints = (widthPx / dpi) * 72;
    const heightInPoints = (heightPx / dpi) * 72;

    const frontEmbedded = await pdfDoc.embedPng(frontBuffer);
    const backEmbedded = await pdfDoc.embedPng(backBuffer);

    const frontPage = pdfDoc.addPage([widthInPoints, heightInPoints]);
    frontPage.drawImage(frontEmbedded, { x: 0, y: 0, width: widthInPoints, height: heightInPoints });

    const backPage = pdfDoc.addPage([widthInPoints, heightInPoints]);
    backPage.drawImage(backEmbedded, { x: 0, y: 0, width: widthInPoints, height: heightInPoints });

    const pdfBytes = await pdfDoc.save();

    /* 🗜️ Bundle as ZIP */
    const zip = new JSZip();
    zip.file(`front-${dpi}dpi.png`, frontBuffer);
    zip.file(`back-${dpi}dpi.png`, backBuffer);
    zip.file(
      "metadata.json",
      JSON.stringify(
        {
          resolution: dpi,
          widthPx,
          heightPx,
          generatedAt: new Date().toISOString(),
          designSettings: designSettings ?? null,
        },
        null,
        2
      )
    );
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    /* ☁️ Upload to Google Drive */
    const drive = await getDriveClient();
    const parentFolder = getEnvOrThrow("GOOGLE_DRIVE_CARD_DESIGNS_FOLDER_ID");

    await uploadOrUpdateFile({
      drive,
      folderId: parentFolder,
      name: `${designProfileId}.pdf`,
      mimeType: "application/pdf",
      buffer: Buffer.from(pdfBytes),
      description: `TapInk card design PDF (${dpi} DPI)`,
    });

    await uploadOrUpdateFile({
      drive,
      folderId: parentFolder,
      name: `${designProfileId}.zip`,
      mimeType: "application/zip",
      buffer: zipBuffer,
      description: `TapInk card assets (front/back PNG, ${dpi} DPI)`,
    });

    console.log("✅ Export successful for design:", designProfileId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Failed to export physical card design:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during Google Drive export",
      },
      { status: 500 }
    );
  }
}
