"use client";

import { useRef, useEffect } from "react";
import FeatureCard from "../FeatureCard";
import styles from "../../styles/CompanyList.module.css";

const companies = [
  { image: "/images/companies/o3_Logo.png" },
  { image: "/images/companies/kalti_logo.png"},
  { image: "/images/companies/Westminster_logo.png"},
];

export default function CompanyList() {
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
    <section className={styles.companyListSection}>
      <div className={styles.companySlider} ref={containerRef}>
      {companies.map((companies) => (
          <span
            key={companies.image}
          >
            {companies.image}
          </span>
        ))}
      </div>
    </section>
  );
}
