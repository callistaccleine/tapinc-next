"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/Signup.module.css";

export default function Signup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`, // where Supabase redirects after confirmation
        data: {
          display_name: fullName,
          fullName,
          phone: phoneNumber,
        },
      },
    });

    if (error) {
      setMessage(error.message || "Sign up failed.");
      setIsLoading(false);
      return;
    }

    // ✅ Show confirmation modal instead of redirecting
    setShowConfirmation(true);
    setIsLoading(false);
  };

  return (
    <div className={styles.signupSplit}>
      {/* Left: form */}
      <section className={styles.signupLeft}>
        <div className={styles.signupCard}>
          <h1 className={styles.signupTitle}>Create your account</h1>

          <form onSubmit={handleSignup} className={styles.signupForm}>
            <label className={styles.signupLabel}>Name*</label>
            <input
              className={`${styles.signupInput} ${styles.pill}`}
              type="text"
              placeholder="Enter your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <label className={styles.signupLabel}>Email*</label>
            <input
              className={`${styles.signupInput} ${styles.pill}`}
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label className={styles.signupLabel}>Phone</label>
            <input
              className={`${styles.signupInput} ${styles.pill}`}
              type="tel"
              placeholder="Enter your phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />

            {/* ✅ Password with toggle */}
            <label className={styles.signupLabel}>Password*</label>
            <div className={styles.passwordWrapper}>
              <input
                className={`${styles.signupInput} ${styles.pill}`}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.showPasswordBtn}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <label className={styles.agreeRow}>
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span>
                I agree to all <a>Terms</a>, <a>Privacy Policy</a> and Fees
              </span>
            </label>

            <button
              type="submit"
              className={styles.btnDark}
              disabled={isLoading || !agree}
            >
              {isLoading ? "Creating…" : "Sign Up"}
            </button>
          </form>

          <div className={styles.signupFoot}>
            Already have an account?{" "}
            <button
              type="button"
              className={styles.link}
              onClick={() => router.push("/auth")}
            >
              Log in
            </button>
          </div>

          {message && <p className={styles.signupMessage}>{message}</p>}
        </div>
      </section>

      {/* Right: visual panel */}
      <aside className={styles.signupRight}>
        <div className={styles.signupArt}>
          <div className={styles.signupArtImg} role="img" aria-label="Decorative" />
          <div className={styles.signupArtCaption}>
            <h3>Discovering the way to share your details</h3>
            <p>Fill in something</p>
            <div className={styles.signupChips}>
              <span className={styles.chip}>something</span>
              <span className={styles.chip}>something</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ✅ Confirmation Modal */}
      {showConfirmation && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Check your email ✉️</h2>
            <p>
              We’ve sent a confirmation link to <strong>{email}</strong>.
              <br />
              Please verify your account before logging in.
            </p>
            <button
              className={styles.btnDark}
              onClick={() => {
                setShowConfirmation(false);
                router.replace("/auth");
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
