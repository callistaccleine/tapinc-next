"use client";

import styles from "@/styles/DashboardSideBar.module.css";

type TabKey = "profiles" | "contacts" | "analytics" | "orders";

interface DashboardNavProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

const menuItems: { key: TabKey; label: string; icon: string }[] = [
  { key: "profiles", label: "Profiles", icon: "home" },
  { key: "contacts", label: "Contacts", icon: "contacts" },
  { key: "analytics", label: "Analytics", icon: "analytics" },
  { key: "orders", label: "Orders", icon: "orders" },
];

export default function DashboardSideBar({ activeTab, setActiveTab }: DashboardNavProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandLogo}></div>
        <span className={styles.brandName}>Tapink</span>
      </div>

      <ul className={styles.navList}>
        {menuItems.map(({ key, label }) => (
          <li
            key={key}
            className={`${styles.navItem} ${activeTab === key ? styles.active : ""}`}
            onClick={() => setActiveTab(key)}
          >
            <span className={styles.navLabel}>{label}</span>
            <span className={styles.navChevron}>›</span>
          </li>
        ))}
      </ul>

      <div className={styles.divider} />
    </aside>
  );
}
