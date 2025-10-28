"use client";

import { motion } from "framer-motion";
import styles from "../styles/AboutUs.module.css";

export default function AboutUs() {
  const sections = [
    {
      id: 1,
      title: "Redefining Connections",
      label: "ABOUT US",
      text: `TapInk is a digital-first company redefining how people connect in professional and social settings. By replacing traditional paper business cards with sleek NFC-enabled physical cards and dynamic virtual profiles, TapInk makes sharing and saving contact information seamless, secure and sustainable.`,
    },
    {
      id: 2,
      title: "Empowering Networking",
      label: "OUR MISSION",
      text: `Our mission is to empower professionals, entrepreneurs and eventgoers to create instant, meaningful connections — delivering a smarter, more elegant way to network in a world that values both efficiency and authenticity.`,
    },
    {
      id: 3,
      title: "Every Tap Counts",
      label: "OUR PHILOSOPHY",
      text: `With TapInk, you don’t just share. You keep connections flowing with every tap. Whether it’s networking, social sharing, events or product engagement, every interaction becomes a lasting digital experience.`,
    },
    {
      id: 4,
      title: "Innovation Without Limits",
      label: "WHAT MAKES US DIFFERENT",
      text: `While other companies limit you to a single use or static design, TapInk lets you do more with just one card. You can create and manage multiple profiles for work, personal use or events — all within the same TapInk card. Switch between them anytime to match how and where you connect. TapInk goes beyond digital convenience — it’s built for professionals, creators and businesses that value meaningful, lasting connections without waste, reprints or limits.`,
    },
  ];

  return (
    <section className={styles.aboutUsSection}>
      <motion.h2
        className={styles.sectionTitle}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        Discover the values that make TapInk unique
      </motion.h2>

      <div className={styles.timeline}>
        {sections.map((item, index) => (
          <motion.div
            key={item.id}
            className={styles.timelineItem}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: index * 0.15 }}
          >
            {/* Left side */}
            <div className={styles.timelineLeft}>
              <span className={styles.featureLabel}>{item.label}</span>
              <h3 className={styles.featureTitle}>{item.title}</h3>
            </div>

            {/* Center line */}
            <div className={styles.timelineCenter}>
              <motion.div
                className={`${styles.timelineDot} ${
                  index === 0 ? styles.activeDot : ""
                }`}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              />
              {index < sections.length - 1 && (
                <motion.div
                  className={styles.timelineLine}
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  style={{ originY: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                />
              )}
            </div>

            {/* Right side */}
            <div className={styles.timelineRight}>
              <p>{item.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
