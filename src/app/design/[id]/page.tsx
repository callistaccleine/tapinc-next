"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DesignDashboard from "@/components/DesignDashboard";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function DesignPage() {
  const { id } = useParams(); 
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

  if (!profile)
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner />
      </div>
    );

  return <DesignDashboard profile={profile} />;
}
