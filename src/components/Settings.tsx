"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/Settings.module.css";

type AccountInfo = {
  name: string;
  email: string;
};

export default function Settings() {
  const router = useRouter();
  const [account, setAccount] = useState<AccountInfo>({ name: "", email: "" });
  const [plan, setPlan] = useState<{ name: string }>({ name: "Free plan" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setLoading(false);
          return;
        }

        const metadataName =
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          "";

        let resolvedName = metadataName;

        if (!resolvedName) {
          const { data: userRow, error: userRowError } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();

          if (userRowError && userRowError.code !== "PGRST116") {
            console.error("Error loading user full name:", userRowError);
          }

          if (userRow?.full_name) {
            resolvedName = userRow.full_name as string;
          }
        }

        if (!resolvedName && user.email) {
          resolvedName = user.email.split("@")[0] ?? "";
        }

        setAccount({
          name: resolvedName || "TapInk Member",
          email: user.email ?? "",
        });

        const { data: subscription, error: subscriptionError } = await supabase
          .from("subscriptions")
          .select("status, plans(name)")
          .eq("user_id", user.id)
          .maybeSingle();

        if (subscriptionError && subscriptionError.code !== "PGRST116") {
          console.error("Error loading plan info:", subscriptionError);
        }

        if (subscription?.plans) {
          const planInfo = Array.isArray(subscription.plans)
            ? subscription.plans[0]
            : subscription.plans;
          setPlan({
            name: planInfo?.name ?? "Active plan",
          });
        } else {
          setPlan({ name: "Free plan" });
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className={styles.settingsContainer}>
        <div className={styles.loading}>Loading settings…</div>
      </div>
    );
  }

  return (
    <div className={styles.settingsContainer}>
      <button
        type="button"
        className={styles.backButton}
        onClick={() => router.push("/dashboard")}
      >
        ← Back to dashboard
      </button>

      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3>Account Settings</h3>
          <span>Manage your TapInk account details.</span>
        </header>
        <div className={styles.fieldGroup}>
          <label htmlFor="account-name">
            Name
          </label>
          <input id="account-name" type="text" value={account.name} readOnly />
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="account-email">
            Email <span> (email cannot be changed)</span>
          </label>
          <input id="account-email" type="email" value={account.email} readOnly />
        </div>
      </section>

      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3>Plan</h3>
          <span>Your current subscription.</span>
        </header>
        <div className={styles.planRow}>
          <div>
            <p className={styles.planName}>{plan.name}</p>
          </div>
          <button
            type="button"
            className={styles.manageButton}
            onClick={() => router.push("/pricing")}
          >
            Manage Plan
          </button>
        </div>
      </section>

    </div>
  );
}
