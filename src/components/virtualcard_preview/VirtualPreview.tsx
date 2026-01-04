"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Template1 from "./Template1";
import Template2 from "./Template2";
import Template3 from "./Template3";
import styles from "../../styles/VirtualPreview.module.css";
import { CardData } from "@/types/CardData";

type VirtualPreviewProps = {
  data: CardData;
  showSplash?: boolean;
  profileId?: string | number;
  trackAnalytics?: boolean;
};

type AnalyticsEvent = "profile_view" | "new_connection";

export default function VirtualPreview({
  data,
  showSplash = true,
  profileId,
  trackAnalytics = false,
}: VirtualPreviewProps) {
  const [showSplashScreen, setShowSplashScreen] = useState(showSplash);
  const SPLASH_DURATION = 3000;
  const normalizedProfileId = profileId ? String(profileId) : undefined;
  const canTrackAnalytics = Boolean(trackAnalytics && normalizedProfileId);
  const hasLoggedView = useRef(false);

  useEffect(() => {
    hasLoggedView.current = false;
  }, [normalizedProfileId]);

  const trackEvent = useCallback(
    async (event: AnalyticsEvent) => {
      if (!canTrackAnalytics || !normalizedProfileId) return;

      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileId: normalizedProfileId,
            event,
          }),
        });
      } catch (error) {
        console.error("Failed to record analytics event", error);
      }
    },
    [canTrackAnalytics, normalizedProfileId]
  );

  useEffect(() => {
    if (!canTrackAnalytics || hasLoggedView.current) return;

    hasLoggedView.current = true;
    trackEvent("profile_view");
  }, [canTrackAnalytics, trackEvent]);

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

  const handleSaveContactAnalytics = useCallback(() => {
    return trackEvent("new_connection");
  }, [trackEvent]);

  const renderTemplate = () => {
    switch (data.template) {
      case "template1_blank.svg":
        return (
          <Template1
            data={data}
            onSaveContact={canTrackAnalytics ? handleSaveContactAnalytics : undefined}
          />
        );
      case "template2_blank.svg":
        return (
          <Template2
            data={data}
            onSaveContact={canTrackAnalytics ? handleSaveContactAnalytics : undefined}
          />
        );
      case "template3_blank.svg":
        return (
          <Template3
            data={data}
            onSaveContact={canTrackAnalytics ? handleSaveContactAnalytics : undefined}
          />
        );
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
        <span className={styles.logo}>TapINK</span>
        <span className={styles.tagline}>Loading your digital card…</span>
        <span className={styles.loader} />
      </div>
    );
  }

  return renderTemplate();
}
