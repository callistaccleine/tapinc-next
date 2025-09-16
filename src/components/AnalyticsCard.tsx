import React from 'react';
import styles from "@/styles/Analytics.module.css";

interface AnalyticsCardProps {
  label: string;
  value: string | number;
  growth: string;
  color: string;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ label, value, growth, color }) => {
  return (
    <div className={styles.analyticsCard}>
      <p>{label}</p>
      <h3>{value} <span className={`growthTag ${color}`}>{growth}</span></h3>
    </div>
  );
};

export default AnalyticsCard;
