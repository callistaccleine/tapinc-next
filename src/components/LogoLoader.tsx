"use client";

import Image from "next/image";
import styles from "@/styles/LogoLoader.module.css";

type LogoLoaderProps = {
  label?: string;
};

export default function LogoLoader({ label = "Loading..." }: LogoLoaderProps) {
  return (
    <div className={styles.loader}>
      <div className={styles.logoWrap}>
        <Image src="/Tapink-logo.png" alt="TapINK logo" width={64} height={64} priority />
      </div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
