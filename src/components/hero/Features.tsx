"use client";

import { useEffect, useRef, useState } from "react";
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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeId, setActiveId] = useState<number>(1);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const containerHeight = container.offsetHeight;
      const windowHeight = window.innerHeight;

      // Calculate scroll progress through the container (0 to 1)
      const scrollStart = rect.top;
      const progress = Math.max(0, Math.min(1, -scrollStart / (containerHeight - windowHeight)));
      setScrollProgress(progress);

      // Calculate which feature should be active based on scroll
      const featureProgress = progress * features.length;
      const newIndex = Math.min(Math.floor(featureProgress), features.length - 1);
      const newActiveId = features[newIndex].id;
      
      setActiveId(newActiveId);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, [features.length]);

  return (
    <section ref={containerRef} className={styles.featuresSection}>
      <div className={styles.stickyWrapper}>
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

        <div className={styles.featuresContainer}>
          {features.map((f, index) => {
            // Calculate smooth transitions based on scroll position
            const sectionSize = 1 / features.length;
            const sectionStart = index * sectionSize;
            const sectionEnd = (index + 1) * sectionSize;
            
            const isActive = activeId === f.id;
            
            // Calculate scale and brightness for smooth animation
            let scale = 0.96;
            let brightness = 0.7;
            
            if (scrollProgress >= sectionStart && scrollProgress <= sectionEnd) {
              const localProgress = (scrollProgress - sectionStart) / sectionSize;
              if (localProgress < 0.5) {
                // Growing phase
                scale = 0.96 + (0.04 * (localProgress * 2));
                brightness = 0.7 + (0.3 * (localProgress * 2));
              } else {
                // Shrinking phase
                scale = 1 - (0.04 * ((localProgress - 0.5) * 2));
                brightness = 1 - (0.3 * ((localProgress - 0.5) * 2));
              }
            } else if (index < features.findIndex(feat => feat.id === activeId)) {
              scale = 0.96;
              brightness = 0.7;
            }

            return (
              <div
                key={f.id}
                className={`${styles.featureCard} ${
                  isActive ? styles.active : ""
                }`}
                style={{
                  transform: `scale(${scale})`,
                  filter: `brightness(${brightness})`,
                }}
                onClick={() => setActiveId(f.id)}
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
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}