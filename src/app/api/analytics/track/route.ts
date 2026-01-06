import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type AnalyticsEvent = "profile_view" | "new_connection";

type TrackPayload = {
  profileId?: string;
  event?: AnalyticsEvent;
};

const isValidEvent = (event: string | undefined): event is AnalyticsEvent =>
  event === "profile_view" || event === "new_connection";

export async function POST(request: Request) {
  try {
    const { profileId, event }: TrackPayload = await request.json();

    if (!profileId || !isValidEvent(event)) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    let resolvedProfileId: string | null = null;
    const { data: profileRow, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", profileId)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to load profile for analytics:", profileError);
      return NextResponse.json(
        { error: "Failed to track analytics" },
        { status: 500 }
      );
    }

    if (profileRow) {
      resolvedProfileId = profileRow.id;
    } else {
      const { data: designRow, error: designError } = await supabaseAdmin
        .from("design_profile")
        .select("profile_id")
        .eq("id", profileId)
        .maybeSingle();

      if (designError) {
        console.error("Failed to resolve design profile for analytics:", designError);
        return NextResponse.json(
          { error: "Failed to track analytics" },
          { status: 500 }
        );
      }

      resolvedProfileId = designRow?.profile_id ?? null;
    }

    if (!resolvedProfileId) {
      console.warn("Analytics skipped: profile not found", { profileId });
      return NextResponse.json({ skipped: true }, { status: 200 });
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("analytics")
      .select("profile_views, new_connections")
      .eq("profiles_id", resolvedProfileId)
      .maybeSingle();

    if (fetchError) {
      console.error("Failed to load analytics record:", fetchError);
      return NextResponse.json(
        { error: "Failed to track analytics" },
        { status: 500 }
      );
    }

    const incrementView = event === "profile_view" ? 1 : 0;
    const incrementConnection = event === "new_connection" ? 1 : 0;

    if (existing) {
      const { error: updateError } = await supabaseAdmin
        .from("analytics")
        .update({
          profile_views: (existing.profile_views ?? 0) + incrementView,
          new_connections: (existing.new_connections ?? 0) + incrementConnection,
        })
        .eq("profiles_id", resolvedProfileId);

      if (updateError) {
        console.error("Failed to update analytics:", updateError);
        return NextResponse.json(
          { error: "Failed to track analytics" },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabaseAdmin.from("analytics").insert({
        profiles_id: resolvedProfileId,
        profile_views: incrementView,
        new_connections: incrementConnection,
      });

      if (insertError) {
        console.error("Failed to insert analytics record:", insertError);
        return NextResponse.json(
          { error: "Failed to track analytics" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected analytics error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
