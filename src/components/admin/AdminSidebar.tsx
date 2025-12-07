"use client";

import { useState } from "react";
import styles from "@/styles/admin/AdminSidebar.module.css";

type TabConfig<T extends string> = {
  key: T;
  label: string;
};

interface Props<T extends string> {
  activeTab: T;
  setActiveTab: (tab: T) => void;
  primaryTabs: TabConfig<T>[];
  moreTabs: TabConfig<T>[];
  email: string | null;
  onLogout: () => void;
}

export default function AdminSidebar<T extends string>({
  activeTab,
  setActiveTab,
  primaryTabs,
  moreTabs,
  email,
  onLogout,
}: Props<T>) {
  const [showMore, setShowMore] = useState(false);

  return (
    <aside className={styles.sidebar}>
      <h3>Admin Panel</h3>
      <div className={styles.sessionCard}>
        <div className={styles.sessionLabel}>Logged in as</div>
        <div className={styles.sessionEmail}>{email ?? "—"}</div>
        <button className={styles.logoutBtn} onClick={onLogout}>
          Logout
        </button>
      </div>

      <ul className={styles.navList}>
        {primaryTabs.map(({ key, label }) => (
          <li
            key={key}
            className={`${styles.navItem} ${activeTab === key ? styles.active : ""}`}
            onClick={() => setActiveTab(key)}
          >
            <span className={styles.navLabel}>{label}</span>
          </li>
        ))}

        <li
          className={`${styles.navItem} ${styles.moreToggle}`}
          onClick={() => setShowMore((prev) => !prev)}
        >
          <span className={styles.navLabel}>More</span>
          <span className={styles.navChevron}>{showMore ? "−" : "+"}</span>
        </li>

        {showMore && (
          <ul className={styles.subList}>
            {moreTabs.map(({ key, label }) => (
              <li
                key={key}
                className={`${styles.navItem} ${activeTab === key ? styles.active : ""}`}
                onClick={() => setActiveTab(key)}
              >
                <span className={styles.navLabel}>{label}</span>
              </li>
            ))}
          </ul>
        )}
      </ul>
    </aside>
  );
}
