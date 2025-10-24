"use client";

import { useState } from "react";
import styles from "@/styles/AboutUs.module.css";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function AboutUs() {
  const sections = [
    {
      id: 1,
      image: "/images/features/feature1.jpg",
      text: `TapInk is a digital-first company redefining how people connect in professional and social settings. By replacing traditional paper business cards with sleek NFC-enabled physical cards and dynamic virtual profiles, TapInk makes sharing and saving contact information seamless, secure and sustainable.`,
    },
    {
      id: 2,
      image: "/images/features/feature2.jpg",
      text: `Our mission is to empower professionals, entrepreneurs and eventgoers to create instant, meaningful connections — delivering a smarter, more elegant way to network in a world that values both efficiency and authenticity.`,
    },
    {
      id: 3,
      image: "/images/features/feature2.jpg",
      text: `While other companies limit you to a single use or static design, TapInk lets you do more
      with just one card. You can create and manage multiple profiles for work, personal use
      or events — all within the same TapInk card. Switch between them anytime to match how
      and where you connect.`,
    },
    {
      id: 4,
      image: "/images/features/feature3.jpg",
      text: `TapInk goes beyond digital convenience. It's built for professionals, creators and
      businesses that value meaningful, lasting connections without waste, reprints or limits.`,
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className={styles.aboutSection}>
      {/* Image Area */}
      <div className={styles.imageArea}>
        <AnimatePresence mode="wait">
          <motion.div
            key={sections[activeIndex].id}
            className={styles.imageWrapper}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Image
              src={sections[activeIndex].image}
              alt={`TapInk section ${activeIndex + 1}`}
              fill
              className={styles.aboutImage}
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Text Area */}
      <div className={styles.textArea}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className={styles.overline}>About Us</p>
          <h2 className={styles.aboutTitle}>Redefining connections.</h2>
        </motion.div>

        <div className={styles.textContainer}>
          <AnimatePresence mode="wait">
            <motion.div
              key={sections[activeIndex].id}
              className={styles.textBlock}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
            >
              <p>{sections[activeIndex].text}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Clickable Dots */}
        <div className={styles.progressIndicator}>
          {sections.map((_, i) => (
            <button
              key={i}
              className={`${styles.progressDot} ${
                i === activeIndex ? styles.activeDot : ""
              }`}
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to section ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
