"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/Auth.module.css";

export default function ResetPassword() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "">("");

  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid =
    passwordRules.length &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.number &&
    passwordRules.special;

  const passwordsMatch = password.length > 0 && password === confirmPassword;

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setCanReset(Boolean(data.session));
      setIsChecking(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setCanReset(true);
        setIsChecking(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!canReset) {
      setMessage("This reset link is invalid or expired. Please request a new one.");
      setMessageType("error");
      return;
    }

    if (!isPasswordValid) {
      setMessage(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      );
      setMessageType("error");
      return;
    }

    if (!passwordsMatch) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message || "Unable to update password.");
      setMessageType("error");
      setIsSaving(false);
      return;
    }

    setMessage("Password updated. You can log in now.");
    setMessageType("success");
    setIsSaving(false);
  };

  const resetUnavailable = !isChecking && !canReset;
  const showPasswordChecklist = password.length > 0;
  const showPasswordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className={styles.authSplit}>
      <section className={styles.authLeft}>
        <div className={styles.authCard}>
          <h1 className={styles.authTitle}>Reset password</h1>
          <p className={styles.authSubtitle}>
            Choose a new password to regain access.
          </p>

          {isChecking ? (
            <p className={styles.authMessage}>Checking reset link…</p>
          ) : (
            <form onSubmit={handleReset} className={styles.authForm}>
              <label className={styles.authLabel}>New password*</label>
              <div className={styles.passwordWrapper}>
                <input
                  className={`${styles.authInput} ${styles.pill}`}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter a new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={resetUnavailable}
                />
                <button
                  type="button"
                  className={styles.showPasswordBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={resetUnavailable}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {showPasswordChecklist && (
                <ul className={styles.passwordChecklist}>
                  <li className={passwordRules.length ? styles.valid : styles.invalid}>
                    {passwordRules.length ? "✓" : "✗"} At least 8 characters
                  </li>
                  <li className={passwordRules.uppercase ? styles.valid : styles.invalid}>
                    {passwordRules.uppercase ? "✓" : "✗"} One uppercase letter
                  </li>
                  <li className={passwordRules.lowercase ? styles.valid : styles.invalid}>
                    {passwordRules.lowercase ? "✓" : "✗"} One lowercase letter
                  </li>
                  <li className={passwordRules.number ? styles.valid : styles.invalid}>
                    {passwordRules.number ? "✓" : "✗"} One number
                  </li>
                  <li className={passwordRules.special ? styles.valid : styles.invalid}>
                    {passwordRules.special ? "✓" : "✗"} One special character
                  </li>
                </ul>
              )}

              <label className={styles.authLabel}>Confirm password*</label>
              <input
                className={`${styles.authInput} ${styles.pill}`}
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={resetUnavailable}
              />
              {showPasswordMismatch && (
                <p className={`${styles.authMessage} ${styles.authMessageError}`}>
                  Passwords do not match.
                </p>
              )}

              <button
                type="submit"
                className={styles.btnDark}
                disabled={
                  isSaving || resetUnavailable || !isPasswordValid || !passwordsMatch
                }
              >
                {isSaving ? "Updating…" : "Update password"}
              </button>
            </form>
          )}

          <div className={styles.authFoot}>
            <button
              type="button"
              className={styles.link}
              onClick={() => router.push("/auth")}
            >
              Back to login
            </button>
          </div>

          {resetUnavailable && !message && (
            <p className={`${styles.authMessage} ${styles.authMessageError}`}>
              This reset link is invalid or expired. Please request a new one.
            </p>
          )}

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

      <aside className={styles.authRight}>
        <div className={styles.authArt}>
          <img
            className={styles.authArtImg}
            src="/images/Tapink-logo.png"
            alt="TapINK"
          />
          <div className={styles.authArtCaption}>
            <h3>Secure access in seconds</h3>
            <p>Set a new password and jump back into your TapINK workspace.</p>
            <div className={styles.authChips}>
              <span className={styles.chip}>Private</span>
              <span className={styles.chip}>Verified</span>
              <span className={styles.chip}>Fast</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
