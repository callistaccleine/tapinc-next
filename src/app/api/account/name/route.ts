import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "").trim();
    const { name } = await request.json();

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const cleanedName = String(name).trim();

    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          full_name: cleanedName,
          name: cleanedName,
        },
      }
    );

    if (metadataError) {
      console.error("Failed to update auth metadata:", metadataError);
      return NextResponse.json(
        { error: "Failed to update name" },
        { status: 500 }
      );
    }

    const { error: upsertError } = await supabaseAdmin
      .from("users")
      .upsert({ id: user.id, full_name: cleanedName }, { onConflict: "id" });

    if (upsertError) {
      console.error("Failed to persist full name:", upsertError);
      return NextResponse.json(
        { error: "Failed to update name" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected error updating name:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
