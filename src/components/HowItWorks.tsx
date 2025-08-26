"use client";

import { useState } from "react";
import styles from "../styles/HowItWork.module.css";

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState("Design");

  const renderVideo = () => {
    switch (activeTab) {
      case "Share":
        return <div className={styles.videoContainer}>Share Video</div>;
      case "Design":
        return <div className={styles.videoContainer}>Design Video</div>;
      case "Analyse":
        return <div className={styles.videoContainer}>Analyse Video</div>;
      default:
        return null;
    }
  };

  return (
    <section className={styles.howItWorks}>
      <div className={styles.tabs}>
        {["Share", "Design", "Analyse"].map((tab) => (
          <span
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.active : ""}`}
            onMouseEnter={() => setActiveTab(tab)}
          >
            {tab}
          </span>
        ))}
      </div>
      {renderVideo()}
    </section>
  );
}
