"use client";

import styles from "@/styles/admin/AdminSidebar.module.css";

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: { key: string; label: string }[];
}

export default function AdminSidebar({ activeTab, setActiveTab, tabs }: Props) {
  return (
    <aside className={styles.sidebar}>
      <h3>Admin Panel</h3>
      <ul className={styles.navList}>
        {tabs.map(({ key, label }) => (
          <li
            key={key}
            className={`${styles.navItem} ${activeTab === key ? styles.active : ""}`}
            onClick={() => setActiveTab(key)}
          >
            <span className={styles.navLabel}>{label}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
