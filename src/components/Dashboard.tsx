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
  const [isChatOpen, setChatOpen] = useState(false);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem("tapink_dashboard_chat_seen_v1");
    if (!seen) {
      setChatOpen(true);
      localStorage.setItem("tapink_dashboard_chat_seen_v1", "true");
    }
  }, []);

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
      {/* Fun FAQ Chatbox */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 1200,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "10px",
        }}
      >
        {isChatOpen && (
          <div
            style={{
              width: 340,
              maxWidth: "92vw",
              background: "radial-gradient(circle at 15% 20%, rgba(255,138,55,0.14), transparent 35%), #0b1220",
              color: "#e5e7eb",
              borderRadius: 18,
              boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
              padding: "16px 16px 12px",
              border: "1px solid #1f2937",
              backdropFilter: "blur(8px)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#ff8b37,#ff6a00)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    color: "#0b1220",
                    boxShadow: "0 10px 24px rgba(255,106,0,0.35)",
                  }}
                >
                  🤖
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>TapINK Pal</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Fast answers, with a wink.</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: 18,
                  cursor: "pointer",
                }}
                aria-label="Close chat"
              >
                ×
              </button>
            </div>
            <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
              {[
                { q: "How do I share my card?", a: "Open your profile, tap Share Profile, and let friends scan the QR or copy the link." },
                { q: "Where do I edit my card design?", a: "Hop into Edit Profile → Physical card design to swap colours, logos, and layouts." },
                { q: "Can I add more profiles?", a: "Absolutely. Tap + Add profiles in the Profiles tab to spin up a new one." },
                { q: "Why can't I see analytics?", a: "We show analytics after your card has a few views/scans. Share it once or twice!" },
                { q: "Need a human?", a: "Email hello@tapink.com.au and we’ll jump in right away." },
              ].map((item) => {
                const active = activePrompt === item.q;
                return (
                  <div key={item.q} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setActivePrompt(active ? null : item.q)}
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        borderRadius: 14,
                        border: "1px solid " + (active ? "#fb923c" : "#1f2937"),
                        background: active
                          ? "linear-gradient(135deg,#fb923c,#f97316)"
                          : "linear-gradient(145deg,#0f172a,#0b1220)",
                        color: active ? "#0f172a" : "#e5e7eb",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: active ? "0 12px 26px rgba(249,115,22,0.25)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 15, flex: 1 }}>{item.q}</span>
                        <span aria-hidden style={{ opacity: 0.8 }}>{active ? "▼" : "▶"}</span>
                      </div>
                    </button>
                    {active && (
                      <div
                        style={{
                          marginLeft: 6,
                          marginRight: 6,
                          display: "grid",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.05)",
                          color: "#e5e7eb",
                          fontSize: 13,
                          lineHeight: 1.5,
                        }}
                      >
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#ff8b37,#ff6a00)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#0b1220" }}>
                            🤖
                          </div>
                          <div style={{ background: "rgba(15,23,42,0.6)", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 8px 18px rgba(0,0,0,0.25)" }}>
                            <div style={{ fontWeight: 700, color: "#ffb26f", marginBottom: 4 }}>Bot</div>
                            <div>{item.a}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#94a3b8", fontSize: 12 }}>
                          <span>💡</span>
                          <span>These replies are canned FAQs — if you need more, email hello@tapink.com.au.</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
              <span>✨</span>
              <span>Friendly FAQ vibes — humans are a click away if you need them.</span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setChatOpen((v) => !v)}
          style={{
            width: 58,
            height: 58,
            borderRadius: "50%",
            border: "none",
            background: isChatOpen
              ? "linear-gradient(135deg, #111827, #0b1220)"
              : "linear-gradient(135deg, #ff8b37, #ff6a00)",
            color: isChatOpen ? "#ff9a4d" : "#ffffff",
            boxShadow: isChatOpen
              ? "0 8px 18px rgba(0,0,0,0.35)"
              : "0 12px 28px rgba(255,106,0,0.35)",
            cursor: "pointer",
            fontSize: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
          aria-label="Open Tapink FAQ chat"
        >
          {isChatOpen ? "✖" : "💬"}
        </button>
      </div>
    </div>
  );
}
