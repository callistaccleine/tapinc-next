"use client";

import { useState, useEffect } from "react";
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
}

export default function Dashboard() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState("newest");
  const [activeTab, setActiveTab] = useState<TabKey>("profiles");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className={styles.dashboard}>
      {/* ✅ Sidebar */}
      <DashboardSideBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ✅ Main content */}
      <main className={styles.mainContent}>
      {activeTab === "profiles" && (
        <>
            <div className={styles.dashboardHeader}>
            <h2>My Profiles</h2>
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

            {loading ? (
            <p>Loading profiles…</p>
            ) : profiles.length === 0 ? (
            <div className={styles.noResults}>
                <h3>No profiles found</h3>
                <p>You don't have any profiles yet.</p>
            </div>
            ) : (
            <div className={styles.tableWrapper}>
                <table className={styles.profileTable}>
                <thead>
                    <tr>
                    <th>Name & Profile ID</th>
                    <th>Contact Info</th>
                    <th>Product</th>
                    <th>Edit</th>
                    <th>View</th>
                    </tr>
                </thead>
                <tbody>
                    {profiles.map((p) => (
                    <tr key={p.id}>
                        {/* Name + avatar */}
                        <td>
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
                            <div className={styles.profileId}>ID: {p.id.slice(0, 6)}…</div>
                            </div>
                        </div>
                        </td>

                        {/* Contact Info */}
                        <td>
                        <div className={styles.subtext}>{p.email || "No email"}</div>
                        </td>

                        {/* Product */}
                        <td>
                        <div>{p.title || "—"}</div>
                        </td>

                        {/* Edit */}
                        <td>
                        <button
                          className={styles.iconBtn}
                          onClick={() => router.push("/design")}
                        >
                          Edit
                        </button>
                        </td>

                        {/* View */}
                        <td>
                        <button className={styles.iconBtn}>
                            👁️
                        </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
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
