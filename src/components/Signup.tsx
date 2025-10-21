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

  const phoneNumberRules = {
    validPrefix: /^(\+61|0)/.test(phoneNumber),
    validLength: (phoneNumber.startsWith('+61') && phoneNumber.length == 12) || 
    (phoneNumber.startsWith('0') && phoneNumber.length == 10), 
    validCharacters: /^\+?[0-9]+$/.test(phoneNumber),
    validSecondDigit: phoneNumber.startsWith('+61') 
    ? /^\+61[2-478]/.test(phoneNumber)
    : /^0[2-478]/.test(phoneNumber),
  };

  const isPhoneNumberValid =
  phoneNumberRules.validPrefix &&
  phoneNumberRules.validLength &&
  phoneNumberRules.validCharacters &&
  phoneNumberRules.validSecondDigit;

const normalizePhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/[\s\-()]/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '+61' + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('+61')) {
    cleaned = '+61' + cleaned;
  }
  
  return cleaned;
};

const checkExistingEmail = async (email: string) => {
  try {
    // Check auth.users table via RPC function
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('check_email_exists', { 
        email_address: email.toLowerCase()
      });

    if (rpcError) {
      console.error('Email check error:', rpcError);
      return false;
    }

    return rpcData === true;
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
};

const checkExistingPhoneNumber = async (phone: string) => {
  try {
    const normalizedPhone = normalizePhoneNumber(phone);
    
    const alternatePhone = normalizedPhone.startsWith('+61')
      ? '0' + normalizedPhone.substring(3)
      : normalizedPhone;

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('phone')
      .or(`phone.eq.${normalizedPhone},phone.eq.${alternatePhone}`)
      .maybeSingle();
  
    if (profileError) {
      console.error('Profile check error:', profileError);
    }

    if (profileData) {
      return true; 
    }

    const { data: rpcData, error: rpcError } = await supabase
      .rpc('check_phone_exists_normalized', { 
        phone_number: normalizedPhone,
        alternate_phone: alternatePhone 
      });

    if (rpcError) {
      console.error('RPC check error:', rpcError);
    }

    if (rpcData) {
      return true; 
    }

    return false;
  } catch (error) {
    console.error('Error checking phone number:', error);
    return false;
  }
};

const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setMessage("");

  if (!isPasswordValid) {
    setMessage("Password does not meet all security requirements.");
    setIsLoading(false);
    return;
  }

  if (!isPhoneNumberValid) {
    setMessage("Phone number does not meet Australian phone number requirements.");
    setIsLoading(false);
    return;
  }

  if (!agree) {
    setMessage("You must agree to the Terms and Privacy Policy.");
    setIsLoading(false);
    return;
  }

  // Check if email already exists
  const emailExists = await checkExistingEmail(email);
  if (emailExists) {
    setMessage("This email is already registered. Please log in instead.");
    setIsLoading(false);
    return;
  }

  // Check if phone number already exists
  const phoneExists = await checkExistingPhoneNumber(phoneNumber);
  if (phoneExists) {
    setMessage("This phone number is already registered. Please use a different number.");
    setIsLoading(false);
    return;
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth`,
      data: {
        display_name: fullName,
        fullName,
        phone: normalizePhoneNumber(phoneNumber),
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes('user already registered') || 
        error.message.toLowerCase().includes('already exists')) {
      setMessage("This email is already registered. Please log in instead.");
    } else {
      setMessage(error.message || "Sign up failed.");
    }
    setIsLoading(false);
    return;
  }

  // Show confirmation modal on success
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

            <label className={styles.signupLabel}>Phone*</label>
            <input
              className={`${styles.signupInput} ${styles.pill}`}
              type="tel"
              placeholder="Enter your phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />

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

            {/* Password strength checklist */}
            {password && (
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
              disabled={isLoading || !agree || !password || !email || !phoneNumber || !fullName}
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
              We've sent a confirmation link to <strong>{email}</strong>.
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
