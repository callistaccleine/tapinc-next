"use client";

import styles from "../styles/Define.module.css";
import { motion } from "framer-motion";

const fadeInProps = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.35 },
  transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

const stats = [
  {
    icon: "✨",
    label: "Dynamic Profiles",
    headline: "1+",
    body: "Interchangeable profiles in one custom card",
    meta: "Curate personal, business, and event modes in seconds.",
  },
  {
    icon: "📱",
    label: "Universal Access",
    headline: "100%",
    body: "Compatible with modern smartphones",
    meta: "iOS, Android, or tablet - app or setup required.",
  },
  {
    icon: "⚡",
    label: "Instant Sharing",
    headline: "1 Tap",
    body: "Connect in under two seconds—never miss a moment.",
    meta: "Track engagements in real time and follow up instantly.",
  },
];

export default function Define() {
  return (
    <section className={styles.aboutUsSection}>
      <motion.div {...fadeInProps} className={styles.tagline}>
        Why TapINK?
      </motion.div>

      <motion.h2 {...fadeInProps} transition={{ ...fadeInProps.transition, delay: 0.1 }} className={styles.mainHeading}>
        TapINK isn't just another NFC card. It's a smarter and more flexible way to connect.
      </motion.h2>

      <motion.p
        {...fadeInProps}
        transition={{ ...fadeInProps.transition, delay: 0.2 }}
        className={styles.subtext}
      >
        While other companies limit you to a single use or static design, TapINK lets you do more with just one card.
        You can create and manage multiple profiles for work, personal use, or events — all within the same TapINK card.
        Switch between them anytime to match how and where you connect.
      </motion.p>

      <motion.div
        {...fadeInProps}
        transition={{ ...fadeInProps.transition, delay: 0.3 }}
        className={styles.divider}
      ></motion.div>

      <motion.div
        {...fadeInProps}
        transition={{ ...fadeInProps.transition, delay: 0.35 }}
        className={styles.nfcSection}
      >
        <h3>The NFC Card That Does More</h3>
        <p>
          NFC (Near Field Communication) is a wireless technology that allows information to be exchanged instantly with a simple tap.
          TapINK uses NFC to make sharing instant, effortless, and universal. Just tap your TapINK card, keyholder, or event card on a
          compatible smartphone — your profile, website, contact details, or product information appear immediately.
        </p>
      </motion.div>

      <motion.div
        className={styles.statsContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.2 },
          },
        }}
      >
        {stats.map((stat) => (
          <motion.button
            key={stat.label}
            type="button"
            className={`${styles.statBox} ${styles.statBoxPrimary}`}
            variants={{
              hidden: { opacity: 0, y: 40, scale: 0.95 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
              },
            }}
            whileHover={{ y: -6, transition: { duration: 0.3, ease: "easeOut" } }}
          >
            <div className={styles.statIcon}>{stat.icon}</div>
            <span className={styles.statLabel}>{stat.label}</span>
            <h4>{stat.headline}</h4>
            <p>{stat.body}</p>
            <div className={styles.statMeta}>{stat.meta}</div>
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}
