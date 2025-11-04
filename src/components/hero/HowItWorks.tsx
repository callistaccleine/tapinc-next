"use client";

import { useState } from "react";
import styles from "../../styles/HowItWork.module.css";
import { motion, AnimatePresence } from "framer-motion";

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState("Share");

  const tabs = [
    {
      name: "Share",
      icon: "🔗",
      title: "Share instantly",
      description: "Tap your TapInk card to any smartphone. No app required. Your digital profile appears instantly, making connections effortless.",
      video:
        "https://cizagqdvmcdhqbkxpopx.supabase.co/storage/v1/object/public/videos/tapink-share.mp4",
    },
    {
      name: "Design",
      icon: "🎨",
      title: "Design beautifully",
      description: "Customize your card to match your brand with our intuitive design tools. Choose colors, layouts, and add your unique touch.",
      image: "/images/design-preview.jpg",
    },
    {
      name: "Analyse",
      icon: "📊",
      title: "Analyse deeply",
      description: "Track engagement, understand your audience, and grow your network with powerful analytics. See who viewed your profile and when.",
      image: "/images/analytics-preview.jpg",
    },
  ];

  const currentTab = tabs.find((tab) => tab.name === activeTab);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
  };

  const contentVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.95,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -20,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
  };

  return (
    <section className={styles.howItWorks}>
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        className={styles.sectionHeader}
      >
        <motion.p 
          className={styles.overline}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          How It Works
        </motion.p>
        <h2 className={styles.sectionTitle}>
          Simple. Powerful. Instant.
        </h2>
        <motion.p 
          className={styles.sectionDescription}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Three simple steps to revolutionise the way you connect
        </motion.p>
      </motion.div>

      {/* Main Content Container */}
      <div className={styles.mainContainer}>
        {/* Tabs */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className={styles.tabs}
        >
          {tabs.map((tab, index) => (
            <motion.div
              key={tab.name}
              variants={tabVariants}
              className={`${styles.tab} ${
                activeTab === tab.name ? styles.active : ""
              }`}
              onClick={() => setActiveTab(tab.name)}
              onMouseEnter={() => setActiveTab(tab.name)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={styles.tabNumber}>
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className={styles.tabContent}>
                <span className={styles.tabIcon}>{tab.icon}</span>
                <span className={styles.tabName}>{tab.name}</span>
              </div>
              <div className={styles.tabIndicator}></div>
            </motion.div>
          ))}
        </motion.div>

        {/* Dynamic Content */}
        <div className={styles.contentArea}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={styles.contentWrapper}
            >
              {currentTab?.video ? (
                <div className={styles.mediaContainer}>
                  <video
                    key={currentTab.video}
                    src={currentTab.video}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className={styles.videoPlayer}
                  />
                </div>
              ) : (
                <div className={styles.mediaContainer}>
                  <div className={styles.placeholderContent}>
                    <div className={styles.largeIcon}>{currentTab?.icon}</div>
                  </div>
                </div>
              )}

              <div className={styles.textContent}>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className={styles.contentTitle}
                >
                  {currentTab?.title}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className={styles.contentDescription}
                >
                  {currentTab?.description}
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}