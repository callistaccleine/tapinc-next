import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { phone, userId } = await request.json();
    if (!phone || typeof phone !== "string" || !userId) {
      return NextResponse.json({ error: "Phone and userId are required" }, { status: 400 });
    }

    // Attach phone to the existing user so OTP can be sent without creating a new auth user.
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { phone });
    if (updateError) {
      console.error("Update phone error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { error } = await supabaseAdmin.auth.signInWithOtp({
      phone,
      options: {
        channel: "sms",
        shouldCreateUser: false,
      },
    });

    if (error) {
      console.error("Send OTP error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected send code error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
