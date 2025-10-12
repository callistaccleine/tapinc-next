"use client";

import { useRef, useEffect } from "react";
import FeatureCard from "../FeatureCard";
import styles from "../../styles/Features.module.css";

const features = [
  { title: "Links", desc: "Description of first product", image: "/images/features/feature1.jpg" },
  { title: "Custom Exchange Form", desc: "Description of second product", image: "/images/features/feature2.jpg" },
  { title: "Analytics", desc: "Description of third product", image: "/images/features/feature3.jpg" },
  { title: "Google Review", desc: "Description of fourth product", image: "/images/features/feature4.jpg" },
  { title: "Integration", desc: "Description of fifth product", image: "/images/features/feature5.jpg" },
  { title: "Save Contact to Device", desc: "Description of sixth product", image: "/images/features/feature6.jpg" },
];

export default function Features() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollSpeed = 0.6; // pixels per frame
    let rafId: number;

    const scroll = () => {
      container.scrollLeft += scrollSpeed;

      // If at the end, jump back smoothly
      if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 1) {
        container.scrollLeft = 0;
      }

      rafId = requestAnimationFrame(scroll);
    };

    rafId = requestAnimationFrame(scroll);

    // Pause on hover
    const pause = () => cancelAnimationFrame(rafId);
    const resume = () => {
      rafId = requestAnimationFrame(scroll);
    };

    container.addEventListener("mouseenter", pause);
    container.addEventListener("mouseleave", resume);

    return () => {
      cancelAnimationFrame(rafId);
      container.removeEventListener("mouseenter", pause);
      container.removeEventListener("mouseleave", resume);
    };
  }, []);

  return (
    <section className={styles.featuresSection}>
      <h2 className={styles.featuresTitle}>Features</h2>
      <div className={styles.featuresSlider} ref={containerRef}>
        {[...features, ...features].map((item, index) => (
          <FeatureCard
            key={index}
            image={item.image}
            title={item.title}
            description={item.desc}
          />
        ))}
      </div>
    </section>
  );
}
