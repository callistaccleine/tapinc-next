"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/styles/AboutUs.module.css";
import Image from "next/image";
import { motion } from "framer-motion";

export default function AboutUs() {
  const sections = [
    {
      id: 1,
      image: "/images/features/feature1.jpg",
      text: `TapInk is a digital-first company redefining how people connect in professional and social settings. By replacing traditional paper business cards with sleek NFC-enabled physical cards and dynamic virtual profiles, TapInk makes sharing and saving contact information seamless, secure and sustainable.`,
    },
    {
      id: 2,
      image: "/images/features/feature2.jpg",
      text: `Our mission is to empower professionals, entrepreneurs and eventgoers to create instant, meaningful connections — delivering a smarter, more elegant way to network in a world that values both efficiency and authenticity.`,
    },
    {
        id: 3,
        image:"/images/features/feature2.jpg",
        text: `While other companies limit you to a single use or static design, TapInk lets you do more
        with just one card. You can create and manage multiple profiles for work, personal use
        or events - all within the same TapInk card. Switch between them anytime to match how
        and where you connect.`
    },
    {
      id: 4,
      image: "/images/features/feature3.jpg",
      text: `TapInk goes beyond digital convenience. It's built for professionals, creators and
businesses that value meaningful, lasting connections without waste, reprints or limits.`
    },
  ];

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const containerHeight = container.offsetHeight;
      const windowHeight = window.innerHeight;

      // Calculate scroll progress through the container
      const scrollStart = rect.top;
      const scrollEnd = rect.bottom - windowHeight;
      
      // Progress from 0 to 1 as user scrolls through the section
      const progress = Math.max(0, Math.min(1, -scrollStart / (containerHeight - windowHeight)));
      setScrollProgress(progress);

      // Calculate which section should be active based on scroll progress
      const sectionProgress = progress * sections.length;
      const newIndex = Math.min(Math.floor(sectionProgress), sections.length - 1);
      
      setActiveIndex(newIndex);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections.length]);

  return (
    <section ref={containerRef} className={styles.aboutSection}>
      {/* Sticky Image Area */}
      <div className={styles.imageArea}>
        {sections.map((s, i) => {
          // Calculate opacity for smooth transitions
          const sectionSize = 1 / sections.length;
          const sectionStart = i * sectionSize;
          const sectionEnd = (i + 1) * sectionSize;
          
          let opacity = 0;
          if (scrollProgress >= sectionStart && scrollProgress <= sectionEnd) {
            // Fade in/out during transition
            const localProgress = (scrollProgress - sectionStart) / sectionSize;
            if (localProgress < 0.3) {
              opacity = localProgress / 0.3; // Fade in
            } else if (localProgress > 0.7) {
              opacity = 1 - ((localProgress - 0.7) / 0.3); // Fade out
            } else {
              opacity = 1; // Fully visible
            }
          }

          return (
            <div
              key={s.id}
              className={styles.imageWrapper}
              style={{ opacity }}
            >
              <Image
                src={s.image}
                alt={`About TapInk ${i + 1}`}
                fill
                className={styles.aboutImage}
                priority={i === 0}
              />
            </div>
          );
        })}
      </div>

      {/* Sticky Text Area */}
      <div className={styles.textArea}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        >
          <p className={styles.overline}>About Us</p>
          <h2 className={styles.aboutTitle}>Redefining connections.</h2>
        </motion.div>

        <div className={styles.textContainer}>
          {sections.map((s, i) => {
            // Calculate opacity for text
            const sectionSize = 1 / sections.length;
            const sectionStart = i * sectionSize;
            const sectionEnd = (i + 1) * sectionSize;
            
            let opacity = 0;
            let transform = 0;
            
            if (scrollProgress >= sectionStart && scrollProgress <= sectionEnd) {
              const localProgress = (scrollProgress - sectionStart) / sectionSize;
              if (localProgress < 0.3) {
                opacity = localProgress / 0.3;
                transform = (1 - localProgress / 0.3) * 20;
              } else if (localProgress > 0.7) {
                opacity = 1 - ((localProgress - 0.7) / 0.3);
                transform = -((localProgress - 0.7) / 0.3) * 20;
              } else {
                opacity = 1;
                transform = 0;
              }
            }

            return (
              <div
                key={s.id}
                className={styles.textBlock}
                style={{
                  opacity,
                  transform: `translateY(${transform}px)`,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                }}
              >
                <p>{s.text}</p>
              </div>
            );
          })}
        </div>

        {/* Progress Indicator */}
        <div className={styles.progressIndicator}>
          {sections.map((_, i) => (
            <div
              key={i}
              className={`${styles.progressDot} ${
                i === activeIndex ? styles.activeDot : ""
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}