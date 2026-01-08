"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/Auth.module.css";

export default function Auth() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "">("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setMessageType("");

    // ✅ Step 1: Log in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message || "Login failed.");
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    const user = data?.user;
    if (!user) {
      setMessage("User not found.");
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    // ✅ Step 2: Fetch the user's role from your public.users table
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching role:", profileError);
      setMessage("Unable to fetch user role. Please try again.");
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    // ✅ Step 3: Redirect based on role
    if (userProfile?.role === "admin") {
      router.replace("/admin");
    } else {
      router.replace("/dashboard");
    }

    setIsLoading(false);
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setMessage("Enter your email to reset your password.");
      setMessageType("error");
      return;
    }

    setIsResetting(true);
    setMessage("");
    setMessageType("");

    const redirectTo = `${window.location.origin}/auth/reset`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setMessage(error.message || "Unable to send reset email.");
      setMessageType("error");
      setIsResetting(false);
      return;
    }

    setMessage("Check your email for a password reset link.");
    setMessageType("success");
    setIsResetting(false);
  };

  return (
    <div className={styles.authSplit}>
      {/* Left: form */}
      <section className={styles.authLeft}>
        <div className={styles.authCard}>
          <h1 className={styles.authTitle}>Welcome back</h1>
          <p className={styles.authSubtitle}>Login to your account</p>

          <form onSubmit={handleLogin} className={styles.authForm}>
            {/* Email field */}
            <label className={styles.authLabel}>Email*</label>
            <input
              className={`${styles.authInput} ${styles.pill}`}
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Password field */}
            <label className={styles.authLabel}>Password*</label>
            <div className={styles.passwordWrapper}>
              <input
                className={`${styles.authInput} ${styles.pill}`}
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
            <div className={styles.forgotRow}>
              <button
                type="button"
                className={styles.forgotLink}
                onClick={handlePasswordReset}
                disabled={isResetting}
              >
                {isResetting ? "Sending reset link..." : "Forgot password?"}
              </button>
            </div>

            <button type="submit" className={styles.btnDark} disabled={isLoading}>
              {isLoading ? "Logging in…" : "Log In"}
            </button>
          </form>

          <div className={styles.authFoot}>
            Don't have an account?{" "}
            <button
              type="button"
              className={styles.link}
              onClick={() => router.push("/signup")}
            >
              Sign up
            </button>
          </div>

          {message && (
            <p
              className={`${styles.authMessage} ${
                messageType === "success"
                  ? styles.authMessageSuccess
                  : styles.authMessageError
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </section>

      {/* Right visual */}
      <aside className={styles.authRight}>
        <div className={styles.authArt}>
          <img
            className={styles.authArtImg}
            src="/images/Tapink-logo.png"
            alt="TapINK"
          />
          <div className={styles.authArtCaption}>
            <h3>Seamlessly access your TapINK dashboard</h3>
            <p>Login to manage your digital cards, monitor engagement, and grow your connections.</p>
            <div className={styles.authChips}>
              <span className={styles.chip}>Quick</span>
              <span className={styles.chip}>Secure</span>
              <span className={styles.chip}>Simple</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
