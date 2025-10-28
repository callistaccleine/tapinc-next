"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import styles from "../../styles/CompanyList.module.css";

type CompanyLogo = {
  image: string;
  name: string;
  width?: number;
  height?: number;
};

const companies: CompanyLogo[] = [
  { image: "/images/companies/o3_Logo.png", name: "O3 Collective" },
  { image: "/images/companies/kalti_logo.png", name: "Kalti" },
  {
    image: "/images/companies/westminster.png",
    name: "Westminster",
    width: 170,
    height: 70,
  },
  { image: "/images/companies/moneyquest.png", name: "Money Quest Lonsdale" },
  { image: "/images/companies/jett_logo.webp", name: "Jett" },
];

export default function CompanyList() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollSpeed = 0.8;
    let rafId: number;

    const scroll = () => {
      container.scrollLeft += scrollSpeed;
      if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 1) {
        container.scrollLeft = 0;
      }
      rafId = requestAnimationFrame(scroll);
    };

    rafId = requestAnimationFrame(scroll);

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
        {companies.concat(companies).map((company, index) => (
          <div key={index} className={styles.logoCard}>
            <Image
              src={company.image}
              alt={company.name}
              width={company.width ?? 140}
              height={company.height ?? 60}
              className={styles.companyLogo}
              priority
              style={{
                width: company.width ?? 140,
                height: company.height ?? 60,
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
