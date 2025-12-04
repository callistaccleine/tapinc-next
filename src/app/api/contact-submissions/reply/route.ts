import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

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

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      cc: "tapinc.io.au@gmail.com",
      replyTo: "tapinc.io.au@gmail.com",
      subject: `Re: Your TapInk enquiry (#${id})`,
      html: `
        <p>Hi ${name || "there"},</p>
        <p>${replyMessage.replace(/\n/g, "<br>")}</p>
        <hr>
        <p style="color:#6b7280;font-size:14px;">Original message (${category || "General"}):</p>
        <blockquote style="color:#374151;">${(originalMessage || "").replace(/\n/g, "<br>")}</blockquote>
        <p style="color:#6b7280;font-size:12px;">Submission ID: ${id}</p>
      `,
      text: `Hi ${name || "there"},\n\n${replyMessage}\n\n-----\nOriginal message (${category || "General"}):\n${originalMessage || ""}\n\nSubmission ID: ${id}`,
    });

    // update status in Supabase (best effort)
    await supabase
      .from("contact_submissions")
      .update({
        status: "Replied",
        admin_reply: replyMessage,
        replied_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Reply send error:", err);
    return NextResponse.json({ error: err?.message || "Failed to send reply" }, { status: 500 });
  }
}
