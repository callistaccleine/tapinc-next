"use client";

import Image from "next/image";
import styles from "@/styles/LoadingSpinner.module.css";

type LoadingSpinnerProps = {
  label?: string;
  fullscreen?: boolean;
};

export default function LoadingSpinner({ label = "Loading...", fullscreen = true }: LoadingSpinnerProps) {
  return (
    <div
      className={`${styles.spinnerWrapper} ${
        fullscreen ? styles.fullscreen : ""
      }`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.spinnerCircle}>
        <Image src="/images/Tapink-logo.png" alt="TapINK" width={48} height={48} />
      </div>
      {label && <p className={styles.spinnerLabel}>{label}</p>}
    </div>
  );
}
