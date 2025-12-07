import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, to, name, category, replyMessage, originalMessage } = body;

    if (!id || !to || !replyMessage) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json(
        { error: "Email credentials not configured." },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const cleanReply = (replyMessage || "").trim();
    const signature = "Best regards,\nThe TapInk Team";
    const replyWithSignature = `${cleanReply}\n\n${signature}`;
    const replyWithSignatureHtml = replyWithSignature.replace(/\n/g, "<br>");

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      cc: "tapinc.io.au@gmail.com",
      replyTo: "tapinc.io.au@gmail.com",
      subject: `Re: Your TapInk enquiry (#${id})`,
      html: `
        <p>Hi ${name || "there"},</p>
        <p>${replyWithSignatureHtml}</p>
        <hr>
        <p style="color:#6b7280;font-size:14px;">Original message (${category || "General"}):</p>
        <blockquote style="color:#374151;">${(originalMessage || "").replace(/\n/g, "<br>")}</blockquote>
        <p style="color:#6b7280;font-size:12px;">Submission ID: ${id}</p>
      `,
      text: `Hi ${name || "there"},\n\n${replyWithSignature}\n\n-----\nOriginal message (${category || "General"}):\n${originalMessage || ""}\n\nSubmission ID: ${id}`,
    });

    // Fetch existing replies to append history
    const { data: existingRow, error: fetchExistingError } = await supabaseAdmin
      .from("contact_submissions")
      .select("admin_reply")
      .eq("id", id)
      .single();
    if (fetchExistingError) throw fetchExistingError;

    type ReplyEntry = { sender: "admin"; body: string; sent_at: string };
    let existingReplies: ReplyEntry[] = [];
    if (existingRow?.admin_reply) {
      try {
        const parsed = JSON.parse(existingRow.admin_reply);
        if (Array.isArray(parsed)) {
          existingReplies = parsed as ReplyEntry[];
        } else if (typeof parsed === "string") {
          existingReplies = [{ sender: "admin", body: parsed, sent_at: new Date().toISOString() }];
        }
      } catch {
        existingReplies = [
          { sender: "admin", body: existingRow.admin_reply as string, sent_at: new Date().toISOString() },
        ];
      }
    }

    const replyEntry: ReplyEntry = {
      sender: "admin",
      body: replyWithSignature,
      sent_at: new Date().toISOString(),
    };

    const replyHistory = [...existingReplies, replyEntry];

    const { data: updatedRow, error: updateError } = await supabaseAdmin
      .from("contact_submissions")
      .update({
        status: "Replied",
        admin_reply: JSON.stringify(replyHistory),
        replied_at: replyEntry.sent_at,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updatedRow) {
      throw updateError || new Error("Failed to update submission status");
    }

    return NextResponse.json({ success: true, submission: updatedRow });
  } catch (err: any) {
    console.error("Reply send error:", err);
    return NextResponse.json({ error: err?.message || "Failed to send reply" }, { status: 500 });
  }
}
