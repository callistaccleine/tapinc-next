import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import nodemailer from "nodemailer";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Force the Node runtime to allow larger processing workloads (PDF + ZIP).
export const runtime = "nodejs";

const CARD_MM_WIDTH = 86;
const CARD_MM_HEIGHT = 54;

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

const fetchBuffer = async (url: string, label: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${label} from URL.`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const resolveImageBuffer = async (value: string, label: string) => {
  if (value.startsWith("data:")) {
    return dataUrlToBuffer(value, label);
  }
  return fetchBuffer(value, label);
};

const buildPdfBytes = async (
  frontBuffer: Buffer,
  backBuffer: Buffer,
  dpi: number,
  widthPx: number,
  heightPx: number
) => {
  const pdfDoc = await PDFDocument.create();
  const widthPoints = (widthPx / dpi) * 72;
  const heightPoints = (heightPx / dpi) * 72;

  const frontEmbedded = await pdfDoc.embedPng(frontBuffer);
  const backEmbedded = await pdfDoc.embedPng(backBuffer);

  const frontPage = pdfDoc.addPage([widthPoints, heightPoints]);
  frontPage.drawImage(frontEmbedded, { x: 0, y: 0, width: widthPoints, height: heightPoints });

  const backPage = pdfDoc.addPage([widthPoints, heightPoints]);
  backPage.drawImage(backEmbedded, { x: 0, y: 0, width: widthPoints, height: heightPoints });

  return pdfDoc.save();
};

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const {
      designProfileId,
      frontImage,
      backImage,
      frontImageUrl,
      backImageUrl,
      reviewFrontImage,
      reviewBackImage,
      reviewFrontImageUrl,
      reviewBackImageUrl,
      createdBy,
      createdByEmail,
      resolution,
      widthPx,
      heightPx,
      designSettings,
    } = payload;
    const frontSource = frontImageUrl || frontImage;
    const backSource = backImageUrl || backImage;
    const reviewFrontSource = reviewFrontImageUrl || reviewFrontImage;
    const reviewBackSource = reviewBackImageUrl || reviewBackImage;

    if (!designProfileId || !frontSource || !backSource || !widthPx || !heightPx) {
      return jsonResponse({ error: "Missing required fields" }, 400);
    }

    const dpi = Number(resolution);
    if (!dpi || Number.isNaN(dpi)) {
      return jsonResponse({ error: "Invalid resolution" }, 400);
    }

    const frontBuffer = await resolveImageBuffer(frontSource, "frontImage");
    const backBuffer = await resolveImageBuffer(backSource, "backImage");

    const pdfBytes = await buildPdfBytes(frontBuffer, backBuffer, dpi, widthPx, heightPx);
    const reviewFrontBuffer = reviewFrontSource
      ? await resolveImageBuffer(reviewFrontSource, "reviewFrontImage")
      : null;
    const reviewBackBuffer = reviewBackSource
      ? await resolveImageBuffer(reviewBackSource, "reviewBackImage")
      : null;
    const reviewPdfBytes =
      reviewFrontBuffer && reviewBackBuffer
        ? await buildPdfBytes(reviewFrontBuffer, reviewBackBuffer, dpi, widthPx, heightPx)
        : pdfBytes;

    const generatedAt = new Date();
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
          generatedAt: generatedAt.toISOString(),
        },
        null,
        2
      )
    );

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    let adminClient: SupabaseClient | null = null;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    }

    let profileId: string | null = null;
    if (adminClient) {
      try {
        const { data } = await adminClient
          .from("design_profile")
          .select("profile_id")
          .eq("id", designProfileId)
          .maybeSingle();

        profileId = data?.profile_id ?? null;
      } catch (err) {
        console.error("Supabase profile lookup failed:", err);
      }
    }

    let requesterEmail: string | null = createdByEmail ?? null;
    if (adminClient && createdBy) {
      try {
        const { data, error } = await adminClient.auth.admin.getUserById(createdBy);
        if (!error && data?.user?.email) {
          requesterEmail = data.user.email;
        }
      } catch (err) {
        console.error("Supabase user lookup failed:", err);
      }
    }

    let workOrderNumber: string | number | null = null;
    if (adminClient) {
      try {
        const insertPayload = {
          design_profile_id: designProfileId,
          profile_id: profileId,
          resolution_dpi: dpi,
          width_px: widthPx,
          height_px: heightPx,
          status: "submitted",
          created_by: createdBy ?? profileId ?? null,
        };

        const { data: workOrderRecord, error: workOrderError } = await adminClient
          .from("work_orders")
          .insert(insertPayload)
          .select("id")
          .single();

        if (workOrderError) {
          console.error("Work order insert failed:", workOrderError);
        } else if (workOrderRecord?.id !== undefined && workOrderRecord.id !== null) {
          workOrderNumber = workOrderRecord.id;
        }
      } catch (err) {
        console.error("Unexpected work order logging error:", err);
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

        const workOrderHeading = workOrderNumber
          ? `New Physical Card Work Order #${workOrderNumber}`
          : "New Physical Card Work Order";

        const detailRows = [
          ...(workOrderNumber ? [{ label: "Work order #", value: workOrderNumber }] : []),
          { label: "Design Profile", value: designProfileId },
          { label: "Profile ID", value: profileId ?? "Not linked" },
          { label: "Resolution", value: `${dpi} DPI` },
          {
            label: "Canvas Size",
            value: `${CARD_MM_WIDTH.toFixed(0)}mm × ${CARD_MM_HEIGHT.toFixed(0)}mm (${widthPx}px × ${heightPx}px)`,
          },
          { label: "Generated", value: generatedAt.toLocaleString("en-AU", { timeZone: "Australia/Sydney" }) },
        ];

        const detailRowsHtml = detailRows
          .map(
            (row) => `
              <tr>
                <td style="padding:6px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;">${row.label}</td>
                <td style="padding:6px 12px;border:1px solid #e5e7eb;">${row.value}</td>
              </tr>`
          )
          .join("");

        const supportEmail = "hello@tapink.com.au";
        const internalInstructionsHtml = `
          <ol style="padding-left:20px;color:#374151;">
            <li>Review the attached PDF proof for front/back alignment.</li>
            <li>Download the ZIP for production-ready PNGs and metadata.</li>
            <li>Reply-all if revisions are required; otherwise proceed with printing.</li>
          </ol>
        `;

        const internalSubject = workOrderNumber
          ? `Physical card design work order #${workOrderNumber} — ${designProfileId}`
          : `Physical card design work order — ${designProfileId}`;

        const internalHtml = `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">
            <h2 style="margin-bottom:4px;">${workOrderHeading}</h2>
            <p style="margin:0 0 16px;color:#4b5563;">A fresh design export is ready for production.</p>
            <table style="border-collapse:collapse;border:1px solid #e5e7eb;margin-bottom:16px;min-width:320px;">
              ${detailRowsHtml}
            </table>
            <h3 style="margin:0 0 8px;">Next steps</h3>
            ${internalInstructionsHtml}
            <p style="margin:16px 0 0;color:#4b5563;">Need help? Email <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
          </div>
        `;

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: "sales@tapink.com.au",
          subject: internalSubject,
          html: internalHtml,
          attachments: [
            {
              filename: `${designProfileId}.pdf`,
              content: Buffer.from(pdfBytes),
              contentType: "application/pdf",
            },
            {
              filename: `tapink-work-order-${designProfileId}.zip`,
              content: zipBuffer,
              contentType: "application/zip",
            },
          ],
        });

        if (requesterEmail) {
          const userSubject = workOrderNumber
            ? `Your physical card export is ready for review — #${workOrderNumber}`
            : `Your physical card export is ready for review`;
          const userHeading = "Your physical card export is ready";
          const userInstructionsHtml = `
            <ol style="padding-left:20px;color:#374151;">
              <li>Review the attached PDF proof for layout, colours, and text.</li>
              <li>Reply to this email if you'd like any changes.</li>
            </ol>
          `;

          const userHtml = `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">
              <h2 style="margin-bottom:4px;">${userHeading}</h2>
              <p style="margin:0 0 16px;color:#4b5563;">
                Thanks for exporting your design. This proof is for review only &mdash; TapINK handles production.
              </p>
              <table style="border-collapse:collapse;border:1px solid #e5e7eb;margin-bottom:16px;min-width:320px;">
                ${detailRowsHtml}
              </table>
              <h3 style="margin:0 0 8px;">Review checklist</h3>
              ${userInstructionsHtml}
              <p style="margin:16px 0 0;color:#4b5563;">Questions? Email <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
            </div>
          `;

          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: requesterEmail,
            subject: userSubject,
            html: userHtml,
            attachments: [
              {
                filename: `${designProfileId}.pdf`,
                content: Buffer.from(reviewPdfBytes),
                contentType: "application/pdf",
              },
            ],
          });
        }
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
