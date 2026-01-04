"use client";

import Image from "next/image";
import { BarChart3, ShoppingBag, User } from "lucide-react";
import styles from "@/styles/DashboardSideBar.module.css";

type TabKey = "profiles" | "analytics" | "orders";

interface DashboardNavProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  isOpen: boolean;
  onDismiss: () => void;
}

const menuItems: { key: TabKey; label: string; Icon: typeof User }[] = [
  { key: "profiles", label: "Profile", Icon: User },
  { key: "analytics", label: "Analytics", Icon: BarChart3 },
  { key: "orders", label: "Orders", Icon: ShoppingBag },
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
                alt="TapINK logo"
                width={36}
                height={36}
              />
            </div>
            <span className={styles.brandName}>TapINK</span>
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
          {menuItems.map(({ key, label, Icon }) => (
            <li
              key={key}
              className={`${styles.navItem} ${activeTab === key ? styles.active : ""}`}
              onClick={() => {
                setActiveTab(key);
                onDismiss();
              }}
            >
              <span className={styles.navIcon} aria-hidden="true">
                <Icon size={18} strokeWidth={2} />
              </span>
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
