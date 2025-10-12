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
    avatar: "/avatars/sophie.png",
    quote:
      "TapINC made connecting with clients effortless. My digital card looks stunning and professional — just like something Apple would make.",
    rating: 5,
  },
  {
    name: "Daniel Lee",
    title: "Product Designer",
    avatar: "/avatars/daniel.png",
    quote:
      "Every tap feels magical. The design dashboard is clean, fast, and intuitive. My profile feels alive.",
    rating: 5,
  },
  {
    name: "Ava Thompson",
    title: "Freelance Photographer",
    avatar: "/avatars/ava.png",
    quote:
      "I handed my TapINC card at an event, and people literally said 'wow'. It’s the future of personal branding.",
    rating: 5,
  },
];

export default function CustomerReview() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className={styles.reviewSection}>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.sectionTitle}
      >
        What People Think About Us
      </motion.h2>

      <div className={styles.reviewGrid}>
        {reviews.map((review, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            className={`${styles.reviewCard} ${
              activeIndex === index ? styles.active : ""
            }`}
          >
            <div className={styles.reviewerHeader}>
              <Image
                src={review.avatar}
                alt={review.name}
                width={60}
                height={60}
                className={styles.avatar}
              />
              <div>
                <h4 className={styles.reviewerName}>{review.name}</h4>
                <p className={styles.reviewerTitle}>{review.title}</p>
              </div>
            </div>

            <p className={styles.reviewQuote}>“{review.quote}”</p>

            <div className={styles.rating}>
              {Array.from({ length: review.rating }).map((_, i) => (
                <span key={i}>★</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={styles.footerText}
      >
        Loved by creators, professionals, and innovators — worldwide 
      </motion.div>
    </section>
  );
}
