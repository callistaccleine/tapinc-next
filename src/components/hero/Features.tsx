"use client";

import { useState } from "react";
import styles from "../../styles/Features.module.css";
import Image from "next/image";

export default function Features() {
  const [activeId, setActiveId] = useState<number | null>(1);

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
      text: " Perfect for personal networking, business promotions, events or product information sharing.",
      image: "/images/features/feature4.jpg",
    },
    {
      id: 5,
      title: "Multiple Profiles",
      text: " Create and switch between multiple profiles such as personal, professional or event-based, all from a single TapInk card.",
      image: "/images/features/feature4.jpg",
    },
    // {
    //   id: 6,
    //   title: "No App Needed",
    //   text: " Works instantly on any NFC-enabled device, simple, fast and universal.",
    //   image: "/images/features/feature4.jpg",
    // },
  ];

  return (
    <section className={styles.featuresSection}>
      <h2 className={styles.featuresTitle}>Our Features</h2>

      <div className={styles.featuresContainer}>
        {features.map((f) => (
          <div
            key={f.id}
            className={`${styles.featureCard} ${
              activeId === f.id ? styles.active : ""
            }`}
            onClick={() => setActiveId(f.id)}
          >
            <Image
              src={f.image}
              alt={f.title}
              fill
              className={styles.featureImage}
            />

            {/* 🔹 ID Badge */}
            <div
              className={`${styles.featureId} ${
                activeId === f.id ? styles.activeId : ""
              }`}
            >
              {f.id}
            </div>

            <div className={styles.overlay}>
              <div className={styles.featureContent}>
                <h3>{f.title}</h3>
                {activeId === f.id && <p>{f.text}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
