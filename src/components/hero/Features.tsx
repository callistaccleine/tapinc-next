"use client";

import { useRef } from "react";
import FeatureCard from "../FeatureCard";
import styles from "../../styles/Features.module.css";

const features = [
  {
    title: "Links",
    desc: "Description of first product",
    image: "/images/features/feature1.jpg",
  },
  {
    title: "Custom Exchange Form",
    desc: "Description of second product",
    image: "/images/features/feature2.jpg",
  },
  {
    title: "Analytics",
    desc: "Description of third product",
    image: "/images/features/feature3.jpg",
  },
  {
    title: "Google review",
    desc: "Description of fourth product",
    image: "/images/features/feature4.jpg",
  },
  {
    title: "Integration",
    desc: "Description of fifth product",
    image: "/images/features/feature5.jpg",
  },
  {
    title: "Save contact to device",
    desc: "Description of sixth product",
    image: "/images/features/feature6.jpg",
  },
];

export default function Features() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section className={styles.featuresSection}>
      <h2 className={styles.featuresTitle}>Features</h2>

      <div className={styles.featuresSlider} ref={containerRef}>
        {features.map((item, index) => (
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
