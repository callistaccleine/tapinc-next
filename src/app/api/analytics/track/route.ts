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

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("analytics")
      .select("profile_views, new_connections")
      .eq("profile_id", profileId)
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
        .eq("profile_id", profileId);

      if (updateError) {
        console.error("Failed to update analytics:", updateError);
        return NextResponse.json(
          { error: "Failed to track analytics" },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabaseAdmin.from("analytics").insert({
        profile_id: profileId,
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
