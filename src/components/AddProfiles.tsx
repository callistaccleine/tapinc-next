"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/AddProfiles.module.css";
import { supabase } from "@/lib/supabaseClient";

type UserPlan = {
  id: string | number;
  name: string | null;
  category: string | null;
};

const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  individual: 1,
  teams: 25,
  enterprise: 100,
  event: 100,
  events: 100,
};

const normalizeCategory = (category?: string | null) =>
  (category || "").trim().toLowerCase();

const AddProfiles = () => {
  const [loading, setLoading] = useState(false);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
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
        setUserPlan(subscription.plans ? subscription.plans[0] as UserPlan : null);
      } else {
        // Default to free plan if none active
        const { data: freePlan } = await supabase
          .from("plans")
          .select("*")
          .eq("category", "free")
          .single();
        setUserPlan(freePlan as UserPlan);
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

  const planCategory = normalizeCategory(userPlan?.category);
  const planLimit = planCategory ? PLAN_LIMITS[planCategory] : undefined;
  const limitReached =
    typeof planLimit === "number" && existingProfilesCount >= planLimit;

  const limitMessage =
    typeof planLimit === "number"
      ? `${userPlan?.name ?? "This plan"} allows up to ${planLimit} profile${
          planLimit === 1 ? "" : "s"
        }. Upgrade your plan to add more.`
      : "You've reached the profile limit for your plan. Upgrade to add more.";

  const handleAddProfile = async () => {
    setLoading(true);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      alert("You must be logged in to add profiles");
      setLoading(false);
      return;
    }

    if (limitReached) {
      alert(limitMessage);
      setLoading(false);
      return;
    }

    const shouldSetDefault = existingProfilesCount === 0;
    const profileStatus = shouldSetDefault ? "active" : "inactive";

    // Create new profile
    const { error } = await supabase.from("profiles").insert([{
      user_id: user.id,
      plan_id: userPlan?.id,
      title: `Profile ${existingProfilesCount + 1}`,
      subtitle: "New Profile",
      physical_activated: false,
      virtual_activated: false,
      status: profileStatus,
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
                {typeof planLimit === "number" && ` / ${planLimit}`}
              </span>
            </>
          )}
        </p>
      </div>

      {/* Profile creation section */}
      {limitReached ? (
        <div className={styles.upgradePrompt}>
          <p>{limitMessage}</p>
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
