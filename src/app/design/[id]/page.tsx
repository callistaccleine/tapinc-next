"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DesignDashboard from "@/components/DesignDashboard";

export default function DesignPage() {
  const { id } = useParams(); // 👈 get profile ID from URL
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) console.error("Error fetching profile:", error);
      else setProfile(data);
    };

    if (id) fetchProfile();
  }, [id]);

  if (!profile) return <p>Loading...</p>;

  return <DesignDashboard profile={profile} />;
}
