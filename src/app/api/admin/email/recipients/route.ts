import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) {
      console.error("Failed to load auth emails", error);
      return NextResponse.json({ error: "Failed to load recipients" }, { status: 500 });
    }

    const emails = (data?.users || [])
      .map((user) => (user.email || "").trim())
      .filter(Boolean);
    const uniqueEmails = Array.from(new Set(emails));
    return NextResponse.json({ emails: uniqueEmails, count: uniqueEmails.length });
  } catch (err: any) {
    console.error("Recipients fetch failed", err);
    return NextResponse.json({ error: err?.message || "Failed to load recipients" }, { status: 500 });
  }
}
