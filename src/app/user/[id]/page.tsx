"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import VirtualPreview from "@/components/virtualcard_preview/VirtualPreview";

export default function UserVirtualPage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("design_profile")
        .select("*")
        .eq("id", id)
        .single();

      if (error) console.error(error);
      else setProfile(data);
    };

    fetchProfile();
  }, [id]);

  if (!profile) return <p>Profile not found</p>;

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
      <VirtualPreview
      data={{
        name: `${profile.firstname} ${profile.surname}`,
        title: profile.title,
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
        links: typeof profile.links === "string" ? JSON.parse(profile.links) : profile.links,
        profilePic: profile.profile_pic,
        template: profile.template, 
      }}
    />
    </div>
  );
}
