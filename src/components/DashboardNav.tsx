"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/DashboardNav.module.css";

interface SupabaseUser {
  email?: string;
  user_metadata?: {
    email?: string;
    preferred_username?: string;
    fullName?: string;
    display_name?: string;
  };
}

export default function DashboardNav({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const chipRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<number | null>(null);
  const idleSignOutRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  // ✅ Load session
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error("getSession error:", error);
      setUser(data?.session?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // ✅ Redirect if not signed in (moved into useEffect)
  useEffect(() => {
    if (user === null) {
      router.replace("/auth");
    }
  }, [user, router]);

  // ✅ Idle sign-out after 1 hour of inactivity
  useEffect(() => {
    const IDLE_LIMIT_MS = 60 * 60 * 1000;
    if (!user) return;

    const clearIdleTimer = () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    };

    const handleIdleTimeout = async () => {
      if (idleSignOutRef.current) return;
      idleSignOutRef.current = true;
      clearIdleTimer();
      await supabase.auth.signOut();
      router.replace("/auth?timeout=1");
    };

    const resetIdleTimer = () => {
      if (idleSignOutRef.current) return;
      clearIdleTimer();
      idleTimerRef.current = window.setTimeout(handleIdleTimeout, IDLE_LIMIT_MS);
    };

    const events: (keyof WindowEventMap)[] = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetIdleTimer, { passive: true }));
    resetIdleTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetIdleTimer));
      clearIdleTimer();
      idleSignOutRef.current = false;
    };
  }, [user, router]);

  // ✅ Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!chipRef.current) return;
      if (!chipRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ✅ Close on Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // ✅ Logout
  const handleLogout = async () => {
    setMenuOpen(false);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      return;
    }
    router.replace("/");
  };

  if (user === undefined) {
    return <div className={styles.pageLoading}>Loading…</div>;
  }

  if (user === null) {
    // Show nothing while redirecting
    return null;
  }

  const email =
    user.email ||
    user.user_metadata?.email ||
    user.user_metadata?.preferred_username ||
    "-";
  const fullName =
    user.user_metadata?.fullName || user.user_metadata?.display_name;

  return (
    <>
      <header className={styles.siteHeader}>
        <div className={styles.headerActions}></div>

        {/* ✅ User chip */}
        <div className={styles.userChip} ref={chipRef}>
          <button
            type="button"
            className={styles.avatarProfile}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
                fill="currentColor"
              />
            </svg>
          </button>

          <div className={styles.userText}>
            {fullName && <span className={styles.userName}>{fullName}</span>}
            <button
              type="button"
              className={styles.userEmailBtn}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {email}
            </button>
          </div>

          {/* ✅ Dropdown */}
          <div
            className={`${styles.userMenu} ${menuOpen ? styles.open : ""}`}
            role="menu"
          >
            <button
              className={styles.menuItem}
              type="button"
              onClick={() => {
                setMenuOpen(false);
                router.push("/");
              }}
            >
              <span>Home</span>
            </button>

            <button
              className={styles.menuItem}
              type="button"
              onClick={() => {
                setMenuOpen(false);
                router.push("/settings");
              }}
            >
              <span>Settings</span>
            </button>

            <div className={styles.menuSep} />

            <button
              className={`${styles.menuItem} ${styles.logout}`}
              type="button"
              onClick={handleLogout}
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ✅ Main content */}
      <main className={styles.pageContent}>{children}</main>
    </>
  );
}
