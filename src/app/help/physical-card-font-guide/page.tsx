"use client";

import styles from "./styles.module.css";

const FONT_SAMPLES = [
  { size: 24, label: "Font Detail @ 24 pt" },
  { size: 20, label: "Font Detail @ 20 pt" },
  { size: 16, label: "Font Detail @ 16 pt" },
  { size: 12, label: "Font Detail @ 12 pt" },
  { size: 10, label: "Font Detail @ 10 pt" },
  { size: 8, label: "Font Detail @ 8 pt" },
  { size: 6, label: "Font Detail @ 6 pt" },
];

export default function PhysicalCardFontGuidePage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.header}>
          <a className={styles.backLink} href="/dashboard">
            ← Back
          </a>
          <h1>Physical Card Font Guide</h1>
          <p>Use these point sizes as reference when adjusting typography in the designer.</p>
        </div>

        <div className={styles.samples}>
          <div className={`${styles.preview} ${styles.dark}`}>
            {FONT_SAMPLES.map((sample) => (
              <p key={`dark-${sample.size}`} style={{ fontSize: sample.size }}>
                {sample.label}
              </p>
            ))}
          </div>
          <div className={`${styles.preview} ${styles.light}`}>
            {FONT_SAMPLES.map((sample) => (
              <p key={`light-${sample.size}`} style={{ fontSize: sample.size }}>
                {sample.label}
              </p>
            ))}
          </div>
        </div>

        <div className={styles.note}>
          <p>
            These previews are based on a 86mm × 54mm card canvas. When exported at 300–600 DPI, the
            sizing will match the physical print output.
          </p>
        </div>
      </section>
    </main>
  );
}
