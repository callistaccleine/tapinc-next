"use server";

import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const jsonResponse = (data: any, status = 200) =>
  new NextResponse(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const dataUrlToBuffer = (dataUrl: string, label: string) => {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error(`Invalid data URL supplied for ${label}`);
  return Buffer.from(match[2], "base64");
};

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { designProfileId, frontImage, backImage, resolution, widthPx, heightPx, designSettings } = payload;

    if (!designProfileId || !frontImage || !backImage || !widthPx || !heightPx) {
      return jsonResponse({ error: "Missing required fields" }, 400);
    }

    const dpi = Number(resolution);
    if (!dpi || Number.isNaN(dpi)) {
      return jsonResponse({ error: "Invalid resolution" }, 400);
    }

    const frontBuffer = dataUrlToBuffer(frontImage, "frontImage");
    const backBuffer = dataUrlToBuffer(backImage, "backImage");

    const pdfDoc = await PDFDocument.create();
    const widthPoints = (widthPx / dpi) * 72;
    const heightPoints = (heightPx / dpi) * 72;

    const frontEmbedded = await pdfDoc.embedPng(frontBuffer);
    const backEmbedded = await pdfDoc.embedPng(backBuffer);

    const frontPage = pdfDoc.addPage([widthPoints, heightPoints]);
    frontPage.drawImage(frontEmbedded, { x: 0, y: 0, width: widthPoints, height: heightPoints });

    const backPage = pdfDoc.addPage([widthPoints, heightPoints]);
    backPage.drawImage(backEmbedded, { x: 0, y: 0, width: widthPoints, height: heightPoints });

    const pdfBytes = await pdfDoc.save();

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
          designSettings,
          generatedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    let profileId = null;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { data } = await admin
          .from("design_profile")
          .select("profile_id")
          .eq("id", designProfileId)
          .maybeSingle();

        profileId = data?.profile_id ?? null;
      } catch (err) {
        console.error("Supabase profile lookup failed:", err);
      }
    }

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: "tapinc.io.au@gmail.com",
          subject: `Physical card design — ${designProfileId}`,
          html: `
            <p>A new physical card design export is ready.</p>
            <p><strong>Design Profile ID:</strong> ${designProfileId}</p>
            <p><strong>Profile ID:</strong> ${profileId}</p>
          `,
          attachments: [
            {
              filename: `${designProfileId}.pdf`,
              content: Buffer.from(pdfBytes),
              contentType: "application/pdf",
            },
          ],
        });
      } catch (emailError) {
        console.error("Email delivery failed:", emailError);
      }
    }

    return jsonResponse({ success: true });
  } catch (error: any) {
    console.error("Export failed:", error);
    return jsonResponse({ error: error.message ?? "Unknown error" }, 500);
  }
}
