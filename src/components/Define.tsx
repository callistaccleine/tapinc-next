"use client";

import styles from "../styles/Define.module.css";

export default function Define() {
  return (
    <section className={styles.aboutUsSection}>
      {/* Tagline */}
      <div className={styles.tagline}>Why TapInk?</div>

      {/* Headline */}
      <h2 className={styles.mainHeading}>
        TapInk isn't just another NFC card. It's a smarter and more flexible way to connect.
      </h2>

      {/* Subtext */}
      <p className={styles.subtext}>
        While other companies limit you to a single use or static design, TapInk lets you do more with just one card.
        You can create and manage multiple profiles for work, personal use, or events — all within the same TapInk card.
        Switch between them anytime to match how and where you connect.
      </p>

      {/* Divider */}
      <div className={styles.divider}></div>

      {/* NFC Info Section */}
      <div className={styles.nfcSection}>
        <h3>The NFC Card That Does More</h3>
        <p>
          NFC (Near Field Communication) is a wireless technology that allows information to be exchanged instantly with a simple tap.
          TapInk uses NFC to make sharing instant, effortless, and universal. Just tap your TapInk card, keyholder, or event card on a
          compatible smartphone — your profile, website, contact details, or product information appear immediately.
        </p>
      </div>

      {/* Stats / Highlights Section */}
      <div className={styles.statsContainer}>
        <button className={`${styles.statBox} ${styles.statBoxPrimary}`} type="button">
          <div className={styles.statIcon}>✨</div>
          <span className={styles.statLabel}>Dynamic Profiles</span>
          <h4>1+</h4>
          <p>Interchangeable profiles in one custom card</p>
          <div className={styles.statMeta}>
            Curate personal, business, and event modes in seconds.
          </div>
          {/* <span className={styles.statCta}>Explore profiles</span> */}
        </button>
        <button className={`${styles.statBox} ${styles.statBoxPrimary}`} type="button">
          <div className={styles.statIcon}>📱</div>
          <span className={styles.statLabel}>Universal Access</span>
          <h4>100%</h4>
          <p>Compatible with modern smartphones</p>
          <div className={styles.statMeta}>
            iOS, Android, or tablet - app or setup required.
          </div>
          {/* <span className={styles.statCta}>See compatibility</span> */}
        </button>
        <button className={`${styles.statBox} ${styles.statBoxPrimary}`} type="button">
          <div className={styles.statIcon}>⚡</div>
          <span className={styles.statLabel}>Instant Sharing</span>
          <h4>1 Tap</h4>
          <p>Connect in under two seconds—never miss a moment.</p>
          <div className={styles.statMeta}>
            Track engagements in real time and follow up instantly.
          </div>
          {/* <span className={styles.statCta}>Watch it in action</span> */}
        </button>
      </div>
    </section>
  );
}
