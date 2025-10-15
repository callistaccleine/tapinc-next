"use client";

import { useEffect, useRef } from "react";
import styles from "../../styles/Features.module.css";
import Image from "next/image";

export default function Features() {
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const handleScroll = () => {
      const cards = Array.from(slider.children) as HTMLElement[];
      const center = slider.scrollLeft + slider.offsetWidth / 2;

      cards.forEach((card) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(center - cardCenter);
        if (distance < card.offsetWidth / 2) {
          card.classList.add(styles.active);
        } else {
          card.classList.remove(styles.active);
        }
      });
    };

    slider.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => slider.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    { id: 1, title: "Digital Payment", image: "/images/features/feature1.jpg" },
    { id: 2, title: "Management Tools", image: "/images/features/feature2.jpg" },
    { id: 3, title: "Smart Analytics", image: "/images/features/feature3.jpg" },
    { id: 4, title: "Premium Access", image: "/images/features/feature4.jpg" },
  ];

  return (
    <section className={styles.featuresSection}>
      <h2 className={styles.featuresTitle}>Our Features</h2>

      <div className={styles.featuresSlider} ref={sliderRef}>
        {features.map((f) => (
          <div key={f.id} className={styles.featureCard}>
            <Image
              src={f.image}
              alt={f.title}
              className={styles.featureImage}
              width={400}
              height={400}
            />
            <div className={styles.featureOverlay}>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureText}>
                Tools that makes sharing seamless, secure and sustainable
              </p>
            </div>
            <div className={styles.featureArrow}>→</div>
          </div>
        ))}
      </div>
    </section>
  );
}
