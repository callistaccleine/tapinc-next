"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Analytics from "./Analytics";
import Contacts from "./Contacts";
import Orders from "./Orders";
import styles from "@/styles/Dashboard.module.css";
import DashboardSideBar from "@/components/DashboardSideBar";
import { supabase } from "@/lib/supabaseClient";

type TabKey = "profiles" | "contacts" | "analytics" | "orders";

interface Profile {
  id: string;
  firstname: string | null;
  surname: string | null;
  email: string | null;
  company: string | null;
  title: string | null;
  bio: string | null;
  profile_pic: string | null;
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("profiles");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // ✅ Load profiles from Supabase
  useEffect(() => {
    const loadProfiles = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error(userError);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id); // make sure your profiles table has user_id

      if (error) {
        console.error("Error loading profiles:", error);
      } else {
        setProfiles(data || []);
      }
      setLoading(false);
    };

    loadProfiles();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 1025px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      if ("matches" in event && event.matches) {
        setSidebarOpen(false);
      }
    };

    handleChange(mediaQuery);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }

    return () => undefined;
  }, []);

  // ✅ Apply search and sort
  const filteredProfiles = profiles
  .filter((p) => {
    const fullName = `${p.firstname ?? ""} ${p.surname ?? ""}`.toLowerCase();
    const email = (p.email ?? "").toLowerCase();
    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase())
    );
  })
  .sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "name-az":
        return (a.firstname ?? "").localeCompare(b.firstname ?? "");
      case "name-za":
        return (b.firstname ?? "").localeCompare(a.firstname ?? "");
      default: // newest
        return b.id.localeCompare(a.id); // or use created_at desc
    }
  });

  const handleCloseSidebar = () => setSidebarOpen(false);
  const handleOpenSidebar = () => setSidebarOpen(true);

  const renderHeader = (title: string, action?: ReactNode) => (
    <div className={styles.dashboardHeader}>
      <div className={styles.headerTitleGroup}>
        <button
          type="button"
          className={styles.mobileNavToggle}
          aria-label="Open navigation"
          onClick={handleOpenSidebar}
        >
          <span className={styles.hamburger} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
        <h2>{title}</h2>
      </div>
      {action ?? null}
    </div>
  );

  return (
    <div className={styles.dashboard}>
      {/* ✅ Sidebar */}
      <DashboardSideBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onDismiss={handleCloseSidebar}
      />

      <button
        type="button"
        className={`${styles.mobileOverlay} ${isSidebarOpen ? styles.showOverlay : ""}`}
        aria-label="Close navigation"
        aria-hidden={!isSidebarOpen}
        tabIndex={isSidebarOpen ? 0 : -1}
        onClick={handleCloseSidebar}
      />

      {/* ✅ Main content */}
      <main className={styles.mainContent}>
      {activeTab === "profiles" && (
        <>
            {renderHeader(
              "My Profiles",
              <button
                className={styles.btnPrimary}
                onClick={() => router.push("/add-profiles")}
              >
                + Add profiles
              </button>
            )}

            <div className={styles.searchRow}>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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

            {loading ? (
            <p>Loading profiles…</p>
            ) : profiles.length === 0 ? (
            <div className={styles.noResults}>
                <h3>No profiles found</h3>
                <p>You don't have any profiles yet.</p>
            </div>
            ) : (
            <div className={styles.tableWrapper}>
              <div className={styles.tableWrapperInner}>
                <table className={styles.profileTable}>
                <thead>
                    <tr>
                    <th>Profile ID</th>
                    {/* <th>Contact Info</th> */}
                    <th>Product</th>
                    <th>Edit Profile</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProfiles.map((p) => (
                    <tr key={p.id}>
                        {/* Name + avatar */}
                        <td data-label="Profile ID">
                        <div className={styles.profileCell}>
                            <div className={styles.avatarWrapper}>
                            {p.profile_pic ? (
                                <img
                                src={p.profile_pic}
                                alt={p.firstname || "Profile"}
                                className={styles.avatar}
                                />
                            ) : (
                                <div className={styles.avatarPlaceholder}>👤</div>
                            )}
                            </div>
                            <div>
                            <div className={styles.profileName}>
                                {p.firstname} {p.surname}
                            </div>
                            <div className={styles.profileId}>ID: {p.id}</div>
                            </div>
                        </div>
                        </td>

                        {/* Product */}
                        <td data-label="Product">
                        <div>{p.title || "—"}</div>
                        </td>

                        {/* Edit */}
                        <td data-label="Edit">
                        <button
                          className={styles.iconBtn}
                          onClick={() => router.push(`/design/${p.id}`)}
                        >
                          ✎
                        </button>
                        </td>

                        {/* View */}
                        {/* <td>
                        <button className={styles.iconBtn}>
                            👁️
                        </button>
                        </td> */}
                    </tr>
                    ))}
                </tbody>
                </table>
              </div>
            </div>
            )}
        </>
        )}

        {activeTab === "analytics" && (
          <>
            {renderHeader("Analytics Overview")}
            <Analytics />
          </>
        )}

        {activeTab === "contacts" && (
          <>
            {renderHeader("Contacts Overview")}
            <Contacts />
          </>
        )}

        {activeTab === "orders" && (
          <>
            {renderHeader("Orders Overview")}
            <Orders />
          </>
        )}
      </main>
    </div>
  );
}
