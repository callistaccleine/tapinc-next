"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import VirtualPreview from "@/components/virtualcard_preview/VirtualPreview";

export default function UserVirtualPage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("design_profile")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !data) {
          console.error("Unable to load design profile:", error);
          setErrorMessage("Profile not found or unavailable.");
        } else {
          setProfile(data);
          setErrorMessage(null);
        }
      } catch (fetchError) {
        console.error("Unexpected error loading profile:", fetchError);
        setErrorMessage("Something went wrong loading this profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "'SF Pro Display', -apple-system, BlinkMacSystemFont, Helvetica, sans-serif",
          color: "#0f172a",
        }}
      >
        Loading…
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "40px",
          fontFamily:
            "'SF Pro Display', -apple-system, BlinkMacSystemFont, Helvetica, sans-serif",
          color: "#0f172a",
        }}
      >
        {errorMessage}
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "2rem",
        background: "#f5f7fb",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <VirtualPreview
        data={{
          name: `${profile.firstname} ${profile.surname}`.trim(),
          title: profile.title,
          company: profile.company,
          phone: profile.phone,
          email: profile.email,
          bio: profile.bio,
          address: profile.address,
          socials: profile.socials
            ? Object.entries(profile.socials).map(([platform, url]) => ({
                platform,
                url: typeof url === "string" ? url : String(url),
              }))
            : [],
          links:
            typeof profile.links === "string"
              ? JSON.parse(profile.links)
              : profile.links || [],
          headerBanner: profile.header_banner,
          profilePic: profile.profile_pic,
          template: profile.template || "",
        }}
      />
    </div>
  );
}
