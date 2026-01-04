import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subject, message, recipients = [], sendToAll } = body || {};

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json({ error: "Email credentials not configured" }, { status: 500 });
    }

    let targetRecipients: string[] = Array.isArray(recipients)
      ? recipients.map((e) => String(e).trim()).filter(Boolean)
      : [];

    if (sendToAll) {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .not("email", "is", null);
      if (error) {
        console.error("Failed to load profiles for bulk email", error);
        return NextResponse.json({ error: "Failed to load recipient list" }, { status: 500 });
      }
      const bulkEmails = (data || []).map((row: any) => (row.email || "").trim()).filter(Boolean);
      targetRecipients = Array.from(new Set([...targetRecipients, ...bulkEmails]));
    }

    if (!targetRecipients.length) {
      return NextResponse.json({ error: "No recipients provided" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const htmlBody = message.replace(/\n/g, "<br>");
    const brandFooter = `
      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;">
      <div style="font-family:Arial, sans-serif;color:#374151;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <img src="https://tapink.com.au/images/tapink_logo.png" alt="TapINK" style="height:32px;">
          <span style="font-weight:700;font-size:16px;">TapINK</span>
        </div>
        <p style="margin:0 0 4px;font-size:13px;">NFC Cards & Digital Identities</p>
        <p style="margin:0;font-size:12px;color:#6b7280;">hello@tapink.com.au • tapink.com.au</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: targetRecipients,
      subject,
      html: `<div>${htmlBody}${brandFooter}</div>`,
      text: `${message}\n\n--\nTapINK\nhello@tapink.com.au • tapink.com.au`,
    });

    return NextResponse.json({ success: true, count: targetRecipients.length, info: `Sent to ${targetRecipients.length} recipient(s)` });
  } catch (error: any) {
    console.error("Admin email send failed", error);
    return NextResponse.json({ error: error?.message || "Failed to send email" }, { status: 500 });
  }
}
