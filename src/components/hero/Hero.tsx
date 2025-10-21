"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import styles from "../../styles/Hero.module.css";
import { supabase } from "@/lib/supabaseClient";
import { FaInstagram, FaTiktok, FaLinkedinIn} from "react-icons/fa";

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

  const handleScrollDown = () => {
    const nextSection = document.getElementById("next-section");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className={styles.hero}>
      <div className={styles.glow}></div>
  
      <motion.div
        className={styles.heroContent}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className={styles.heroTitle}>
          One Tap, Lasting Link
        </h1>
  
        <motion.p
          className={styles.heroSubtitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          Tap into the future of personal branding. Instantly share your profile,
          portfolio, or business with a single tap — anytime, anywhere.
        </motion.p>
  
        <motion.div
          className={styles.heroButtons}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
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

      {/* Social media sidebar */}
      <div className={styles.socialSidebar}>
        <a href="https://www.instagram.com/tapink_official" target="_blank" rel="noopener noreferrer">
          <FaInstagram />
        </a>
        <a href="https://www.tiktok.com/@tapink_official" target="_blank" rel="noopener noreferrer">
          <FaTiktok />
        </a>
        {/* <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
          <FaLinkedinIn />
        </a> */}
      </div>

      {/* Scroll Down Indicator */}
      <motion.div
        className={styles.scrollDown}
        onClick={handleScrollDown}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4.5, duration: 1 }}
      >
        <motion.svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <path
            d="M12 5v14m0 0l-7-7m7 7l7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.div>
    </section>
  );
}