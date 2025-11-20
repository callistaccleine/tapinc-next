"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Analytics from "./Analytics";
import Orders from "./Orders";
import styles from "@/styles/Dashboard.module.css";
import DashboardSideBar from "@/components/DashboardSideBar";
import { supabase } from "@/lib/supabaseClient";

type TabKey = "profiles" | "analytics" | "orders";

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
  status?: string | null;
}

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const getTabFromParam = (value: string | null): TabKey => {
    switch ((value ?? "").toLowerCase()) {
      case "analytics":
        return "analytics";
      case "orders":
        return "orders";
      default:
        return "profiles";
    }
  };

  const [activeTab, setActiveTabState] = useState<TabKey>(() =>
    getTabFromParam(searchParams.get("tab"))
  );
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [defaultProfileId, setDefaultProfileId] = useState<string | null>(null);
  const normalizeStatus = (value?: string | null) => (value ?? "").trim().toLowerCase();

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
        const rows = data || [];
        setProfiles(rows);
        const defaultProfile = rows.find(
          (profile) => normalizeStatus(profile.status) === "active"
        );
        setDefaultProfileId(defaultProfile?.id ?? null);
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

  const hasMultipleProfiles = profiles.length > 1;
  const needsDefaultSelection = hasMultipleProfiles && !defaultProfileId;

  useEffect(() => {
    const tabFromParams = getTabFromParam(searchParams.get("tab"));
    setActiveTabState(tabFromParams);
  }, [searchParams]);

  const setActiveTab = (tab: TabKey) => {
    setActiveTabState(tab);
  };

  const handleCloseSidebar = () => setSidebarOpen(false);
  const handleOpenSidebar = () => setSidebarOpen(true);

  const handleUpdateProfileStatus = async (profileId: string, makeActive: boolean) => {
    if (updatingStatusId === profileId) return;

    setUpdatingStatusId(profileId);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw userError || new Error("Not authenticated");
      }

      if (makeActive) {
        const { error: setError } = await supabase
          .from("profiles")
          .update({ status: "active" })
          .eq("user_id", user.id)
          .eq("id", profileId);

        if (setError) {
          throw setError;
        }

        const { error: resetError } = await supabase
          .from("profiles")
          .update({ status: "inactive" })
          .eq("user_id", user.id)
          .neq("id", profileId);

        if (resetError) {
          throw resetError;
        }

        setProfiles((prev) =>
          prev.map((profile) => ({
            ...profile,
            status: profile.id === profileId ? "active" : "inactive",
          }))
        );
        setDefaultProfileId(profileId);
      } else {
        const { error: deactivateError } = await supabase
          .from("profiles")
          .update({ status: "inactive" })
          .eq("user_id", user.id)
          .eq("id", profileId);

        if (deactivateError) {
          throw deactivateError;
        }

        setProfiles((prev) =>
          prev.map((profile) =>
            profile.id === profileId ? { ...profile, status: "inactive" } : profile
          )
        );
        if (defaultProfileId === profileId) {
          setDefaultProfileId(null);
        }
      }
    } catch (err: any) {
      console.error("Failed to update profile status:", err);
      alert("Unable to update profile status. Please try again.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

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

            {needsDefaultSelection && (
              <div className={styles.defaultNotice}>
                Set a default profile so tap-and-share always points to the right experience.
              </div>
            )}

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
                    <th>Status</th>
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

                        <td data-label="Default">
                        {normalizeStatus(p.status) === "active" ? (
                          <div className={styles.defaultControl}>
                            <span className={styles.defaultBadge}>Default</span>
                            <button
                              type="button"
                              className={`${styles.defaultButton} ${styles.defaultButtonGhost}`}
                              disabled={Boolean(updatingStatusId)}
                              onClick={() => handleUpdateProfileStatus(p.id, false)}
                            >
                              {updatingStatusId === p.id ? "Updating…" : "Deactivate"}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={styles.defaultButton}
                            disabled={Boolean(updatingStatusId)}
                            onClick={() => handleUpdateProfileStatus(p.id, true)}
                          >
                            {updatingStatusId === p.id ? "Updating…" : "Set as default"}
                          </button>
                        )}
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
