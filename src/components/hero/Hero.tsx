"use client";

import { useRouter } from "next/navigation";
import styles from "../../styles/Hero.module.css";

export default function Hero() {
  const router = useRouter();

  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>Your Identity, One Tap Away</h1>
        <p className={styles.heroSubtitle}>
          Tap into the future of personal branding. Instantly share your profile, portfolio, or business with a single tap — anytime, anywhere.
        </p>
        <div className={styles.heroButtons}>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => router.push("/pricing")}
          >
            Create My Card
          </button>
        </div>
      </div>
    </section>
  );
}
