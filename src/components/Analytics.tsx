import React, { useEffect, useState } from "react";
import styles from "@/styles/Analytics.module.css";
import AnalyticsCard from "@/components/AnalyticsCard";
import ActivityTable from "@/components/ActivityTable";
import { supabase } from "@/lib/supabaseClient";

interface Metrics {
  profileViews: number;
  newConnections: number;
}

type ProfileRow = { id: string };
type AnalyticsRow = { profiles_id: string; profile_views: number | null; new_connections: number | null };

const normalizeCategory = (value?: string | null) => (value ?? "").trim().toLowerCase();
const UNLOCK_THRESHOLD = 15;

const Analytics: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    profileViews: 0,
    newConnections: 0,
  });
  const [isLocked, setIsLocked] = useState(false);
  const [connectionsRemaining, setConnectionsRemaining] = useState(UNLOCK_THRESHOLD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          setMetrics({ profileViews: 0, newConnections: 0 });
          setIsLocked(true);
          setConnectionsRemaining(UNLOCK_THRESHOLD);
          return;
        }

        let planCategory: string | null = null;
        const { data: subscription, error: subscriptionError } = await supabase
          .from("subscriptions")
          .select("plan_id, status, plans(name, category)")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (subscriptionError) throw subscriptionError;

        if (subscription?.plans) {
          const planData = Array.isArray(subscription.plans)
            ? subscription.plans[0]
            : subscription.plans;
          planCategory = planData?.category ?? null;
        }

        if (!planCategory) {
          const { data: freePlan } = await supabase
            .from("plans")
            .select("category")
            .eq("category", "free")
            .maybeSingle();
          planCategory = freePlan?.category ?? "free";
        }

        const { data: profileRows, error: profilesError } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id);

        if (profilesError) throw profilesError;

        const profileIds = (profileRows as ProfileRow[] | null)?.map((row) => row.id) ?? [];

        let aggregated = { profileViews: 0, newConnections: 0 };

        if (profileIds.length) {
          const { data: analyticsRows, error: analyticsError } = await supabase
            .from("analytics")
            .select("profiles_id, profile_views, new_connections")
            .in("profiles_id", profileIds);

          if (analyticsError) throw analyticsError;

          aggregated =
            (analyticsRows as AnalyticsRow[] | null)?.reduce(
              (acc, row) => ({
                profileViews: acc.profileViews + (row.profile_views ?? 0),
                newConnections: acc.newConnections + (row.new_connections ?? 0),
              }),
              { profileViews: 0, newConnections: 0 }
            ) ?? aggregated;
        }

        setMetrics(aggregated);

        const normalizedCategory = normalizeCategory(planCategory);
        const locked = normalizedCategory === "free" && aggregated.newConnections < UNLOCK_THRESHOLD;
        setIsLocked(locked);
        setConnectionsRemaining(
          locked ? Math.max(0, UNLOCK_THRESHOLD - aggregated.newConnections) : 0
        );
      } catch (err: any) {
        console.error("Error fetching analytics:", err.message || err);
        setMetrics({ profileViews: 0, newConnections: 0 });
        setIsLocked(true);
        setConnectionsRemaining(UNLOCK_THRESHOLD);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className={styles.analyticsContainer}>
        <div className={styles.loading}>Loading analytics…</div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className={styles.analyticsContainer}>
        <div className={styles.analyticsLock}>
          <h3>Analytics locked</h3>
          <p>
            Analytics unlock on the free plan after 15 new connections.
            <br />
            Progress: {Math.min(UNLOCK_THRESHOLD, metrics.newConnections)} / {UNLOCK_THRESHOLD}
          </p>
          {connectionsRemaining > 0 && (
            <p className={styles.analyticsLockSub}>
              {connectionsRemaining} more new connection
              {connectionsRemaining === 1 ? "" : "s"} to unlock insights.
            </p>
          )}
          <a href="/pricing" className={styles.upgradeBtn}>
            Upgrade plan
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.analyticsCards}>
        <AnalyticsCard
          label="Profile views"
          value={metrics.profileViews}
          growth="%"
          color="blue"
        />
        <AnalyticsCard
          label="New connections"
          value={metrics.newConnections}
          growth="%"
          color="green"
        />
      </div>

      <ActivityTable />
    </div>
  );
};

export default Analytics;
