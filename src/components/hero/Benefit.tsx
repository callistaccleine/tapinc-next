"use client";

import { useState } from "react";
import styles from "../../styles/Benefit.module.css";
import { motion } from "framer-motion";

interface Benefit {
  title: string;
  image: string;
}

const benefits: Benefit[] = [
  {
    title: "Editable contact exchange form",
    image: "/avatars/ava.png",
  },
  {
    title: "Profile templates",
    image: "/avatars/ava.png",
  },
  {
    title: "Centralised lead management",
    image: "/avatars/ava.png",
  },
];

export default function Benefit() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className={styles.benefitSection}>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.sectionTitle}
      >
        Benefits
      </motion.h2>

      <div className={styles.benefitGrid}>
        {benefits.map((benefit, index) => (
          <motion.div
            key={index}
            className={`${styles.benefitCard} ${
              activeIndex === index ? styles.active : ""
            }`}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div className={styles.benefitContent}>
              <img
                src={benefit.image}
                alt={benefit.title}
                className={styles.benefitImage}
              />
              <h4 className={styles.benefitTitle}>{benefit.title}</h4>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
