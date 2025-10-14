"use client";

import { useState } from "react";
import styles from "../../styles/HowItWork.module.css";

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState("Design");

  const tabs = [
    {
      name: "Share",
      icon: "🔗",
      description: "Instantly share your profile with a single tap"
    },
    {
      name: "Design",
      icon: "🎨",
      description: "Customize your card to match your brand"
    },
    {
      name: "Analyse",
      icon: "📊",
      description: "Track engagement and grow your network"
    }
  ];

  const renderContent = () => {
    const content = tabs.find(tab => tab.name === activeTab);
    return (
      <div className={styles.videoContainer} key={activeTab}>
        <div className={styles.contentIcon}>{content?.icon}</div>
        <h3 className={styles.contentTitle}>{activeTab}</h3>
        <p className={styles.contentDescription}>{content?.description}</p>
      </div>
    );
  };

  return (
    <section className={styles.howItWorks}>
      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <p className={styles.sectionDescription}>
          Three simple steps to revolutionize the way you connect
        </p>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <span
            key={tab.name}
            className={`${styles.tab} ${activeTab === tab.name ? styles.active : ""}`}
            onMouseEnter={() => setActiveTab(tab.name)}
          >
            {tab.name}
          </span>
        ))}
      </div>

      {/* Content */}
      {renderContent()}
    </section>
  );
}