import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use the service role key — only accessible on the server
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function GET() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    console.error("Error fetching users:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data.users });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { id, email, full_name, role } = payload;

    if (!id || !email || !full_name || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const upsertPayload = {
      id,
      email,
      full_name,
      role,
      company_website: payload.company_website ?? null,
      company_type: payload.company_type ?? null,
      company_size: payload.company_size ?? null,
      company_country: payload.company_country ?? null,
    };

    const { error } = await supabaseAdmin
      .from("users")
      .upsert(upsertPayload, { onConflict: "id" });

    if (error) {
      console.error("Error upserting users row:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected error creating user profile:", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
