import nodemailer from "nodemailer";
import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log('Contact form API called');
    
    const body = await req.json();
    const { name, email, message } = body;
    
    console.log('Received contact form data:', { name, email, messageLength: message?.length });

    if (!name || !email || !message) {
      console.log('Missing required fields');
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    // Save to database first
    console.log('Saving to database...');
    const { data, error: dbError } = await supabase
      .from("contact_submissions")
      .insert([{ 
        name, 
        email, 
        message, 
        status: "Pending",
        created_at: new Date().toISOString()
      }])
      .select("id")
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('Saved to database with ID:', data?.id);

    // Only send email if we have email credentials configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        console.log('Sending email...');
        const transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER, 
          replyTo: email, 
          to: "tapinc.io.au@gmail.com",
          subject: `Customer Support ID ${data?.id} from ${name}`,
          html: `
            <h3>New Contact Form Submission - ID: ${data?.id}</h3>
            <p><strong>Submission ID:</strong> ${data?.id}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          `,
          text: `Submission ID: ${data?.id}\nName: ${name}\nEmail: ${email}\nMessage: ${message}`,
        });

        console.log('Email sent successfully');
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    } else {
      console.log('Email credentials not configured, skipping email send');
    }

    return NextResponse.json({ 
      success: true, 
      id: data?.id,
      message: "Thank you for your message! We'll get back to you soon." 
    });

  } catch (error: any) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process submission.", 
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}