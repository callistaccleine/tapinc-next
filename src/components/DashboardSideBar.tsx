"use client";

import Image from "next/image";
import styles from "@/styles/DashboardSideBar.module.css";

type TabKey = "profiles" | "analytics" | "orders";

interface DashboardNavProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  isOpen: boolean;
  onDismiss: () => void;
}

const menuItems: { key: TabKey; label: string; icon: string }[] = [
  { key: "profiles", label: "Profiles", icon: "home" },
  // { key: "contacts", label: "Contacts", icon: "contacts" },
  { key: "analytics", label: "Analytics", icon: "analytics" },
  { key: "orders", label: "Orders", icon: "orders" },
];

export default function DashboardSideBar({
  activeTab,
  setActiveTab,
  isOpen,
  onDismiss,
}: DashboardNavProps) {
  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
      <div className={styles.sidebarInner}>
        <div className={styles.brand}>
          <div className={styles.brandInfo}>
            <div className={styles.brandLogo}>
              <Image
                src="/images/Tapink-logo.png"
                alt="Tapink logo"
                width={36}
                height={36}
              />
            </div>
            <span className={styles.brandName}>Tapink</span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="Close navigation"
            onClick={onDismiss}
          >
            X
          </button>
        </div>

        <ul className={styles.navList}>
          {menuItems.map(({ key, label }) => (
            <li
              key={key}
              className={`${styles.navItem} ${activeTab === key ? styles.active : ""}`}
              onClick={() => {
                setActiveTab(key);
                onDismiss();
              }}
            >
              <span className={styles.navLabel}>{label}</span>
              <span className={styles.navChevron}>›</span>
            </li>
          ))}
        </ul>

        <div className={styles.divider} />
      </div>
    </aside>
  );
}
