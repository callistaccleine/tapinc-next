"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import styles from "../styles/Navbar.module.css";

export default function Navbar() {
  const [user, setUser] = useState<any>(undefined); // undefined=loading, null=logged out, object=logged in
  const [menuOpen, setMenuOpen] = useState(false);
  const chipRef = useRef<HTMLLIElement>(null);
  const router = useRouter();

  // Check session on load
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

  // ✅ Close menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!chipRef.current) return;
      if (!chipRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    return <div className={styles.navbar}>Loading...</div>;
  }

  return (
    <nav className={styles.navbar}>
      {/* ✅ Logo */}
      <div
        className={styles.navbarLogo}
        onClick={() => router.push("/")}
        style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
      >
        <Image src="/images/Tapinc-logo.png" alt="TapINC Logo" className={styles.logoImg} width={64} height={64} />
        <span className={styles.logoText}>TapINC</span>
      </div>

      {/* ✅ Nav Links */}
      <ul className={styles.navbarLinks}>
        <li><Link href="/">Home</Link></li>
        <li><Link href="/products">Products</Link></li>
        <li><Link href="/pricing">Pricing</Link></li>

        {user ? (
          // ✅ Logged in
          <li className={styles.userChip} ref={chipRef}>
            <button
              type="button"
              className={styles.avatarProfile}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
                  fill="currentColor"
                />
              </svg>
            </button>

            {menuOpen && (
              <div className={styles.userMenu} role="menu">
                <button
                  className={styles.menuItem}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/dashboard");
                  }}
                >
                  Dashboard
                </button>

                <div className={styles.menuSep} />

                <button
                  className={`${styles.menuItem} ${styles.logout}`}
                  type="button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </li>
        ) : (
          // ✅ Logged out
        <li>
            <Link href="/signup" className={styles.navbarCta}>
                Register
            </Link>
        </li>
        )}
      </ul>
    </nav>
  );
}
