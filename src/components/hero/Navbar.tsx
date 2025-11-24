"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/context/CartContext";
import styles from "../../styles/Navbar.module.css";

export default function Navbar() {
  const [user, setUser] = useState<any>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const chipRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { count } = useCart();

  const isDarkBackground = pathname === "/";
  const logoSrc = isDarkBackground
    ? "/images/TAPINK_ICON_WHITE.png"
    : "/images/Tapink-logo.png";

  // ✅ Check session on load
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

  // ✅ Close user dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!chipRef.current) return;
      if (!chipRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
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
    <nav
      className={`${styles.navbar} ${
        isDarkBackground ? styles.navbarLight : styles.navbarDark
      }`}
    >
      {/* ✅ Logo */}
      <div
        className={styles.navbarLogo}
        onClick={() => router.push("/")}
        style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
      >
        <Image
          src={logoSrc}
          alt="TapInk"
          className={styles.logoImg}
          width={70}
          height={70}
        />
      </div>

      {/* ✅ Nav Links (slide in/out on mobile) */}
      <ul
        className={`${styles.navbarLinks} ${menuOpen ? styles.open : ""}`}
        onClick={() => setMenuOpen(false)} // close menu when clicking a link
      >
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/products">Products</Link>
        </li>
        <li>
          <Link href="/pricing">Pricing</Link>
        </li>
        <li>
          <Link href="/about-us">About Us</Link>
        </li>
        <li>
          <Link href="/support">Support</Link>
        </li>
      </ul>

      {/* ✅ Right Section (CTA + User Dropdown + Menu Button) */}
      <div className={styles.navbarRight}>
        <Link
          href="/cart"
          className={`${styles.cartIconButton} ${
            isDarkBackground ? styles.cartIconLight : styles.cartIconDark
          }`}
          aria-label="Cart"
        >
          <ShoppingCart size={18} />
          {count > 0 && <span className={styles.cartBadge}>{count}</span>}
        </Link>
        {user ? (
          <div className={styles.userChip} ref={chipRef}>
            <button
              type="button"
              className={styles.avatarProfile}
              onClick={() => setUserMenuOpen((v) => !v)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
                  fill="currentColor"
                />
              </svg>
            </button>

            {userMenuOpen && (
              <div className={styles.userMenu} role="menu">
                <button
                  className={styles.menuItem}
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
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
          </div>
        ) : (
          <Link href="/signup" className={styles.navbarCta}>
            Register
          </Link>
        )}

        {/* ✅ Menu Toggle */}
        <button
          className={`${styles.menuToggle} ${menuOpen ? styles.open : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

      </div>
    </nav>
  );
}
