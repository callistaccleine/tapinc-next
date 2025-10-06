"use client";

import styles from "@/styles/admin/AdminSidebar.module.css";

interface Props {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export default function AdminSidebar({ activeTab, setActiveTab }: Props) {
  const tabs = ["users", "profiles", "design_profiles", "orders"];

  return (
    <aside className={styles.sidebar}>
      <h3>Admin Panel</h3>
      <ul>
        {tabs.map((tab) => {
          const label =
            tab
              .replace("_", " ")
              .charAt(0)
              .toUpperCase() + tab.replace("_", " ").slice(1);
          return (
            <li
              key={tab}
              className={activeTab === tab ? styles.active : ""}
              onClick={() => setActiveTab(tab)}
            >
              {label}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
