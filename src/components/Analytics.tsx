import React, { useEffect, useState } from 'react';
import styles from "@/styles/Analytics.module.css";
import AnalyticsCard from "@/components/AnalyticsCard";
import ActivityTable from "@/components/ActivityTable";
import { supabase } from "@/lib/supabaseClient";

interface Metrics {
  profileViews: number;
  newConnections: number;
}

const Analytics: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    profileViews: 0,
    newConnections: 0,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Count profile views
        const { count: profileViews, error: viewsError } = await supabase
          .from('analytics')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'view');

        if (viewsError) throw viewsError;

        // Count new connections (saved contacts)
        const { count: newConnections, error: savesError } = await supabase
          .from('analytics')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'save');

        if (savesError) throw savesError;

        setMetrics({
          profileViews: profileViews ?? 0,
          newConnections: newConnections ?? 0,
        });
      } catch (err: any) {
        console.error("Error fetching analytics:", err.message);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.analyticsCards}>
        <AnalyticsCard
          label="Profile views"
          value={metrics.profileViews}
          growth="0%"   
          color="blue"
        />
        <AnalyticsCard
          label="New connections"
          value={metrics.newConnections}
          growth="0%"
          color="green"
        />
      </div>

      <ActivityTable />
    </div>
  );
};

export default Analytics;
