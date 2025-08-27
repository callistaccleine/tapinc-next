"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Analytics from "./Analytics";
import Contacts from "./Contacts";
import Orders from "./Orders";
import styles from "@/styles/Dashboard.module.css";
import DashboardSideBar from "@/components/DashboardSideBar";


type TabKey = "profiles" | "contacts" | "analytics" | "orders";

export default function Dashboard() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState("newest");
  const [activeTab, setActiveTab] = useState<TabKey>("profiles");

  return (
    <div className={styles.dashboard}>
      {/* ✅ Use Sidebar Component */}
      <DashboardSideBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main content */}
      <main className={styles.mainContent}>
        {activeTab === "profiles" && (
          <>
            <div className={styles.dashboardHeader}>
              <h2>My Account</h2>
              <button
                className={styles.btnPrimary}
                onClick={() => router.push("/add-profiles")}
              >
                + Add profiles
              </button>
            </div>

            <div className={styles.searchRow}>
              <input type="text" placeholder="Search" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Sort by: Newest first</option>
                <option value="oldest">Sort by: Oldest first</option>
                <option value="name-az">Sort by: Name A-Z</option>
                <option value="name-za">Sort by: Name Z-A</option>
              </select>
            </div>

            <div className={styles.noResults}>
              <h3>No results</h3>
              <p>
                There are no card profiles in this category or matching your search query.
              </p>
            </div>
          </>
        )}

        {activeTab === "analytics" && (
          <>
            <div className={styles.dashboardHeader}>
              <h2>Analytics Overview</h2>
            </div>
            <Analytics />
          </>
        )}

        {activeTab === "contacts" && (
          <>
            <div className={styles.dashboardHeader}>
              <h2>Contacts Overview</h2>
            </div>
            <Contacts />
          </>
        )}

        {activeTab === "orders" && (
          <>
            <div className={styles.dashboardHeader}>
              <h2>Orders Overview</h2>
            </div>
            <Orders />
          </>
        )}
      </main>
    </div>
  );
}
