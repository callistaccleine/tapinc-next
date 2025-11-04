"use client";

import { useEffect, useState } from "react";
import Template1 from "./Template1";
import Template2 from "./Template2";
import Template3 from "./Template3";
import styles from "../../styles/VirtualPreview.module.css";
import { CardData } from "@/types/CardData";

type VirtualPreviewProps = {
  data: CardData;
  showSplash?: boolean;
};

export default function VirtualPreview({ data, showSplash = true }: VirtualPreviewProps) {
  const [showSplashScreen, setShowSplashScreen] = useState(showSplash);
  const SPLASH_DURATION = 3000;

  useEffect(() => {
    if (!showSplash) {
      setShowSplashScreen(false);
      return;
    }

    setShowSplashScreen(true);
    const timer = window.setTimeout(() => setShowSplashScreen(false), SPLASH_DURATION);
    return () => window.clearTimeout(timer);
  }, [data.template, showSplash]);

  useEffect(() => {
    if (!showSplashScreen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showSplashScreen]);

  const renderTemplate = () => {
    switch (data.template) {
      case "template1_blank.svg":
        return <Template1 data={data} />;
      case "template2_blank.svg":
        return <Template2 data={data} />;
      case "template3_blank.svg":
        return <Template3 data={data} />;
      default:
        return (
          <div className={styles.emptyState}>
            <p>No template selected yet.</p>
          </div>
        );
    }
  };

  if (showSplashScreen) {
    return (
      <div className={styles.splash} role="status" aria-live="polite">
        <span className={styles.logo}>TapInk</span>
        <span className={styles.tagline}>Loading your digital card…</span>
        <span className={styles.loader} />
      </div>
    );
  }

  return renderTemplate();
}
