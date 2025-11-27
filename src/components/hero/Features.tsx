"use client";

import { useState } from "react";
import styles from "../../styles/Features.module.css";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Features() {
  const features = [
    {
      id: 1,
      title: "Instant Sharing",
      text: "Share your digital profile, contact info, social links or product details with a single tap.",
      image: "/images/features/feature1.jpg",
    },
    {
      id: 2,
      title: "Update Anytime",
      text: "Update your TapInk profile at any time without needing to reprint cards or brochures.",
      image: "/images/features/feature2.jpg",
    },
    {
      id: 3,
      title: "Eco-Friendly",
      text: "Eliminate paper waste and outdated materials. One tap replaces thousands of printed cards.",
      image: "/images/features/feature3.jpg",
    },
    {
      id: 4,
      title: "Smart & Versatile",
      text: "Perfect for personal networking, business promotions, events or product information sharing.",
      image: "/images/features/feature4.jpg",
    },
    {
      id: 5,
      title: "Multiple Profiles",
      text: "Create and switch between multiple profiles such as personal, professional or event-based, all from a single TapInk card.",
      image: "/images/features/feature5.jpg",
    },
  ];

  const [activeId, setActiveId] = useState<number>(1);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };
  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 40,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      },
    },
  };

  return (
    <section className={styles.featuresSection}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        className={styles.headerContainer}
      >
        <p className={styles.overline}>Features</p>
        <h2 className={styles.featuresTitle}>Everything you need.</h2>
      </motion.div>

      <motion.div
        className={styles.featuresContainer}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        {features.map((f, index) => {
          const isActive = activeId === f.id;

          return (
            <motion.div
              key={f.id}
              className={`${styles.featureCard} ${
                isActive ? styles.active : ""
              }`}
              onClick={() => setActiveId(f.id)}
              variants={cardVariants}
              whileHover={{
                y: -8,
                transition: { duration: 0.3, ease: "easeOut" },
              }}
            >
              <Image
                src={f.image}
                alt={f.title}
                fill
                className={styles.featureImage}
                priority={index === 0}
              />

              {/* 🔹 ID Badge */}
              <div
                className={`${styles.featureId} ${
                  isActive ? styles.activeId : ""
                }`}
              >
                {f.id}
              </div>

              <div className={styles.overlay}>
                <div className={styles.featureContent}>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
