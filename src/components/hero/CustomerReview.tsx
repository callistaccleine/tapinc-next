"use client";

import { useState } from "react";
import styles from "../../styles/CustomerReview.module.css";
import Image from "next/image";
import { motion } from "framer-motion";

interface Review {
  name: string;
  title: string;
  avatar: string;
  quote: string;
  rating: number;
}

const reviews: Review[] = [
  {
    name: "Sophie Nguyen",
    title: "Startup Founder",
    avatar: "/images/avatars/sophie.jpg",
    quote:
      "TapInk made connecting with clients effortless. My digital card looks stunning and professional.",
    rating: 5,
  },
  {
    name: "Daniel Lee",
    title: "Product Designer",
    avatar: "/images/avatars/daniel.jpg",
    quote:
      "Every tap feels magical. The design dashboard is clean, fast, and intuitive. My profile feels alive.",
    rating: 5,
  },
  {
    name: "Ava Thompson",
    title: "Freelance Photographer",
    avatar: "/images/avatars/ava.jpg",
    quote:
      "I handed my TapInk card at an event, and people literally said 'wow'. It's the future of personal branding.",
    rating: 5,
  },
];

export default function CustomerReview() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
      scale: 0.95
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
    <section className={styles.reviewSection}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        className={styles.headerContainer}
      >
        <motion.p 
          className={styles.overline}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Testimonials
        </motion.p>
        <h2 className={styles.sectionTitle}>
          Loved by innovators.
        </h2>
        <motion.p 
          className={styles.subtitle}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          See what creators and professionals are saying about TapInk.
        </motion.p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className={styles.reviewGrid}
      >
        {reviews.map((review, index) => (
          <motion.div
            key={index}
            variants={cardVariants}
            whileHover={{ 
              y: -8,
              transition: { duration: 0.3, ease: "easeOut" }
            }}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            className={`${styles.reviewCard} ${
              activeIndex === index ? styles.active : ""
            }`}
          >
            <div className={styles.quoteIcon}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M10 24C10 19.5817 13.5817 16 18 16V12C11.3726 12 6 17.3726 6 24C6 30.6274 11.3726 36 18 36C24.6274 36 30 30.6274 30 24H26C26 28.4183 22.4183 32 18 32C13.5817 32 10 28.4183 10 24Z" fill="currentColor" opacity="0.12"/>
                <path d="M24 24C24 19.5817 27.5817 16 32 16V12C25.3726 12 20 17.3726 20 24C20 30.6274 25.3726 36 32 36C38.6274 36 44 30.6274 44 24H40C40 28.4183 36.4183 32 32 32C27.5817 32 24 28.4183 24 24Z" fill="currentColor" opacity="0.12"/>
              </svg>
            </div>

            <p className={styles.reviewQuote}>{review.quote}</p>

            <div className={styles.rating}>
              {Array.from({ length: review.rating }).map((_, i) => (
                <motion.span 
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 + (i * 0.05), duration: 0.3 }}
                >
                  ★
                </motion.span>
              ))}
            </div>

            <div className={styles.reviewerFooter}>
              <Image
                src={review.avatar}
                alt={review.name}
                width={48}
                height={48}
                className={styles.avatar}
              />
              <div className={styles.reviewerInfo}>
                <h4 className={styles.reviewerName}>{review.name}</h4>
                <p className={styles.reviewerTitle}>{review.title}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className={styles.footerBadge}
      >
        <div className={styles.statsContainer}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>10K+</span>
            <span className={styles.statLabel}>Active Users</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>4.9</span>
            <span className={styles.statLabel}>Average Rating</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>50+</span>
            <span className={styles.statLabel}>Countries</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}