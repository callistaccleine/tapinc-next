"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProfileCardOption from "./ProfileCardOption";
import styles from "@/styles/AddProfiles.module.css";
import businessCard from "@/../public/images/cards/businessCard.png";
import { supabase } from "@/lib/supabaseClient"; 

const AddProfiles = () => {
  const [loading, setLoading] = useState(false);
  const [userPlan, setUserPlan] = useState<any>(null);
  const [existingProfilesCount, setExistingProfilesCount] = useState(0);
  const router = useRouter();

  // Fetch user's current plan and profile count on mount
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;

      // Get user's subscription to find their plan
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan_id, plans(*)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (subscription) {
        setUserPlan(subscription.plans);
      } else {
        // Default to free plan if no active subscription
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

    // Check free plan limits - only 1 profile allowed
    if (userPlan?.category === "free" && existingProfilesCount >= 1) {
      alert("Free plan allows only one profile. Upgrade your plan to add more profiles.");
      setLoading(false);
      return;
    }

    // Check other plan limits
    // You can add logic here for other plans (teams, enterprise, etc.)
    // For example: teams plan might allow 5 profiles, etc.

    // Create a new profile (comes with both physical and virtual cards)
    const { error } = await supabase.from("profiles").insert([{
      user_id: user.id,
      plan_id: userPlan?.id,
      title: `Profile ${existingProfilesCount + 1}`,
      subtitle: "New Profile",
      image_url: "/images/cards/businessCard.png",
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
      <div className={styles.addProfilesHeader}>
      <button 
          onClick={() => router.push("/dashboard")}
          style={{
            background: '#f5f5f7',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            marginBottom: '24px',
            fontSize: '18px'
          }}
        >
          ←
        </button>
        <h2>Add New Profile</h2>
        <p className={styles.subtext}>
          Each profile includes both Physical NFC Card and Digital Profile
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

      <div className={styles.profileIncludes}>
        <div className={styles.includeItem}>
          <img src={businessCard.src} alt="Physical Card" />
          <div>
            <h3>Physical NFC Card</h3>
            <p>Tap to share your profile</p>
          </div>
        </div>
        <div className={styles.plusIcon}>+</div>
        <div className={styles.includeItem}>
          <img src={businessCard.src} alt="Virtual Card" />
          <div>
            <h3>Digital Profile</h3>
            <p>Share via link or QR code</p>
          </div>
        </div>
      </div>

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