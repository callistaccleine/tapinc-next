"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import styles from "../styles/AboutUs.module.css";

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
};

const companyLogos = [
  { image: "/images/companies/o3_Logo.png", name: "O3 Collective" },
  { image: "/images/companies/kalti_logo.png", name: "Kalti" },
  {
    image: "/images/companies/westminster.png",
    name: "Westminster",
  },
  { image: "/images/companies/moneyquest.png", name: "Money Quest Lonsdale" },
  { image: "/images/companies/jett_logo.webp", name: "Jett" },
] as const;

export default function AboutUs() {
  const statements = [
    {
      title: "Our Mission",
      description:
        "Our mission is to empower professionals, entrepreneurs and eventgoers to create instant, meaningful connections, delivering a smarter, more elegant way to network in a world that values both efficiency and authenticity.",
    },
    {
      title: "Every Tap Counts",
      description:
        "With TapINK, you don't just share. You keep connections flowing with every tap. Whether it's networking, social sharing, events or product engagement, every interaction becomes a lasting digital experience.",
    },
  ];

  return (
    <section className={styles.aboutUsSection}>
      <div className={styles.inner}>
        <motion.div
          className={styles.hero}
          {...fadeInUp}
          transition={{ duration: 0.7 }}
        >
          <span className={styles.heroBadge}>ABOUT TAPINK</span>
          <h1 className={styles.heroTitle}>
            Connections designed for the modern world.
          </h1>
          <p className={styles.heroSubtitle}>
            TapINK is a digital-first company redefining how people connect in
            professional and social settings. By replacing traditional paper
            business cards with sleek NFC-enabled physical cards and dynamic
            virtual profiles, TapINK makes sharing and saving contact
            information seamless, secure and sustainable.
          </p>
          <div className={styles.heroHighlights}>
            {[
              "Instant NFC introductions",
              "Profiles that adapt on demand",
              "Thoughtful, lasting follow-ups",
            ].map((highlight) => (
              <motion.span
                key={highlight}
                className={styles.heroHighlight}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                {highlight}
              </motion.span>
            ))}
          </div>
        </motion.div>

        <motion.div
          className={styles.partners}
          {...fadeInUp}
          transition={{ duration: 0.7, delay: 0.08 }}
        >
          <div className={styles.partnersHeader}>
            <span>Trusted by teams who lead with design</span>
            <h2>Brands tapping into TapINK</h2>
          </div>
          <div className={styles.partnersGrid}>
            {companyLogos.map((company, index) => (
              <motion.div
                key={company.name}
                className={styles.partnerCard}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25, delay: index * 0.02 }}
              >
                <div className={styles.partnerLogoWrapper}>
                  <Image
                    src={company.image}
                    alt={company.name}
                    fill
                    sizes="(max-width: 768px) 160px, 200px"
                    className={styles.partnerLogo}
                    priority={index < 2}
                  />
                </div>
                <span className={styles.partnerName}>{company.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className={styles.statements}
          {...fadeInUp}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          {statements.map((statement, index) => (
            <motion.article
              key={statement.title}
              className={styles.statementCard}
              {...fadeInUp}
              transition={{ duration: 0.6, delay: index * 0.12 }}
              whileHover={{ y: -6 }}
            >
              <span className={styles.statementAccent} />
              <h2 className={styles.statementTitle}>{statement.title}</h2>
              <p className={styles.statementDescription}>
                {statement.description}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
