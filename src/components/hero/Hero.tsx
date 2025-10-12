"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import styles from "../../styles/Hero.module.css";
import { supabase } from "@/lib/supabaseClient";

export default function Hero() {
  const router = useRouter();

  const handleCreateCard = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/auth");
    }
  };

  return (
    <section className={styles.hero}>
      {/* Decorative glowing background */}
      <div className={styles.glow}></div>

      <motion.div
        className={styles.heroContent}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1
          className={styles.heroTitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Your Identity, One Tap Away
        </motion.h1>

        <motion.p
          className={styles.heroSubtitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Tap into the future of personal branding. Instantly share your profile,
          portfolio, or business with a single tap — anytime, anywhere.
        </motion.p>

        <motion.div
          className={styles.heroButtons}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <motion.button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleCreateCard}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            Create My Card
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
}
