"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/AddProfiles.module.css";
import { supabase } from "@/lib/supabaseClient";

const AddProfiles = () => {
  const [loading, setLoading] = useState(false);
  const [userPlan, setUserPlan] = useState<any>(null);
  const [existingProfilesCount, setExistingProfilesCount] = useState(0);
  const router = useRouter();

  // Fetch user data (plan + profile count)
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;

      // Fetch active subscription plan
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan_id, plans(*)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (subscription?.plans) {
        setUserPlan(subscription.plans);
      } else {
        // Default to free plan if none active
        const { data: freePlan } = await supabase
          .from("plans")
          .select("*")
          .eq("category", "free")
          .single();
        setUserPlan(freePlan);
      }

      // Count existing profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id);

      setExistingProfilesCount(profiles?.length || 0);
    };

    fetchUserData();
  }, []);

  const handleAddProfile = async () => {
    setLoading(true);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      alert("You must be logged in to add profiles");
      setLoading(false);
      return;
    }

    // Plan limits
    if (userPlan?.category === "free" && existingProfilesCount >= 1) {
      alert("Free plan allows only one profile. Upgrade your plan to add more profiles.");
      setLoading(false);
      return;
    }

    if (userPlan?.category === "teams" && existingProfilesCount >= 25) {
      alert("Your Teams plan allows up to 25 profiles. Please upgrade to add more.");
      setLoading(false);
      return;
    }

    // Create new profile
    const { error } = await supabase.from("profiles").insert([{
      user_id: user.id,
      plan_id: userPlan?.id,
      title: `Profile ${existingProfilesCount + 1}`,
      subtitle: "New Profile",
      physical_activated: false,
      virtual_activated: false,
    }]);

    if (error) {
      console.error("Error inserting profile:", error);
      alert("Failed to create profile.");
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className={styles.addProfilesContainer}>
      {/* Back button */}
      <button 
        onClick={() => router.push("/dashboard")}
        className={styles.backButton}
      >
        ← Back
      </button>

      {/* Header */}
      <div className={styles.addProfilesHeader}>
        <h2>Add New Profile</h2>
        <p className={styles.subtext}>
          Each profile includes both a Physical NFC Card and a Digital Profile.
          {userPlan && (
            <>
              <br />
              <span className={styles.planBadge}>
                Current plan: {userPlan.name} • Profiles: {existingProfilesCount}
                {userPlan.category === "free" && " / 1"}
              </span>
            </>
          )}
        </p>
      </div>

      {/* Profile creation section */}
      {userPlan?.category === "free" && existingProfilesCount >= 1 ? (
        <div className={styles.upgradePrompt}>
          <p>You've reached the free plan limit of 1 profile.</p>
          <button
            onClick={() => router.push("/pricing")}
            className={styles.upgradeButton}
          >
            Upgrade Plan
          </button>
        </div>
      ) : userPlan?.category === "teams" && existingProfilesCount >= 25 ? (
        <div className={styles.upgradePrompt}>
          <p>You've reached the Teams plan limit of 25 profiles.</p>
          <button
            onClick={() => router.push("/pricing")}
            className={styles.upgradeButton}
          >
            Upgrade Plan
          </button>
        </div>
      ) : (
        <button
          disabled={loading || !userPlan}
          onClick={handleAddProfile}
          className={`${styles.checkoutButton} ${styles.active}`}
        >
          {loading ? "Creating Profile..." : "Add Profile"}
        </button>
      )}
    </div>
  );
};

export default AddProfiles;
