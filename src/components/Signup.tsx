"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/Signup.module.css";
import Link from "next/link";

const FREE_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "protonmail.com",
];

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
  const [accountType, setAccountType] = useState<"individual" | "company" | null>(
    null
  );
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [companyCountry, setCompanyCountry] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const companyTypeOptions = [
    "Startup",
    "Agency",
    "Consultancy",
    "Enterprise",
    "Small Business",
    "Nonprofit",
    "Technology",
    "Other",
  ];
  const companySizeOptions = ["1-10", "11-25", "26-50", "51-200", "200+"];

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

// const checkExistingPhoneNumber = async (phone: string) => {
//   try {
//     const normalizedPhone = normalizePhoneNumber(phone);
    
//     const alternatePhone = normalizedPhone.startsWith('+61')
//       ? '0' + normalizedPhone.substring(3)
//       : normalizedPhone;

//     const { data: profileData, error: profileError } = await supabase
//       .from('profiles')
//       .select('phone')
//       // .or(`phone.eq.${normalizedPhone},phone.eq.${alternatePhone}`)
//       .maybeSingle();
  
//     if (profileError) {
//       console.error('Profile check error:', profileError);
//     }

//     if (profileData) {
//       return true; 
//     }

//     const { data: rpcData, error: rpcError } = await supabase
//       .rpc('check_phone_exists_normalized', { 
//         phone_number: normalizedPhone,
//         alternate_phone: alternatePhone 
//       });

//     if (rpcError) {
//       console.error('RPC check error:', rpcError);
//     }

//     if (rpcData) {
//       return true; 
//     }

//     return false;
//   } catch (error) {
//     console.error('Error checking phone number:', error);
//     return false;
//   }
// };

const normalizeUrl = (value: string) => {
  if (!value) return "";
  try {
    const prefixed = value.match(/^https?:\/\//i) ? value : `https://${value}`;
    return new URL(prefixed).toString();
  } catch {
    return value;
  }
};

const extractDomain = (value: string, isUrl = false) => {
  try {
    if (isUrl) {
      const normalized = normalizeUrl(value);
      const url = new URL(normalized);
      const host = url.hostname.toLowerCase();
      return host.startsWith("www.") ? host.slice(4) : host;
    }
    const domain = value.split("@")[1]?.toLowerCase() || "";
    return domain.startsWith("www.") ? domain.slice(4) : domain;
  } catch {
    return "";
  }
};

const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setMessage("");

  if (!accountType) {
    setMessage("Please choose whether you are signing up as an individual or a company.");
    setIsLoading(false);
    return;
  }

  if (!isPasswordValid) {
    setMessage("Password does not meet all security requirements.");
    setIsLoading(false);
    return;
  }

  const normalizedCompanyEmail = companyEmail.trim();

  if (accountType === "individual") {
    if (!isPhoneNumberValid) {
      setMessage("Phone number does not meet Australian phone number requirements.");
      setIsLoading(false);
      return;
    }
  } else {
    if (
      !companyName.trim() ||
      !companyType ||
      !companySize ||
      !companyCountry.trim() ||
      !companyWebsite.trim() ||
      !normalizedCompanyEmail
    ) {
      setMessage("Please complete all company details.");
      setIsLoading(false);
      return;
    }
    const emailDomain = extractDomain(normalizedCompanyEmail);
    const websiteDomain = extractDomain(companyWebsite.trim(), true);
    if (!normalizedCompanyEmail.includes("@") || !emailDomain) {
      setMessage("Please enter a valid company email address.");
      setIsLoading(false);
      return;
    }
    if (FREE_EMAIL_DOMAINS.includes(emailDomain)) {
      setMessage("Please use a company email address, not a personal inbox.");
      setIsLoading(false);
      return;
    }
    if (!websiteDomain) {
      setMessage("Please provide a valid company website URL.");
      setIsLoading(false);
      return;
    }
    const domainsMatch =
      !websiteDomain ||
      emailDomain === websiteDomain ||
      emailDomain.endsWith(`.${websiteDomain}`) ||
      websiteDomain.endsWith(`.${emailDomain}`);
    if (websiteDomain && !domainsMatch) {
      setMessage("Company email must match your company website domain.");
      setIsLoading(false);
      return;
    }
  }

  if (!agree) {
    setMessage("You must agree to the Terms and Privacy Policy.");
    setIsLoading(false);
    return;
  }

  const signupEmail = accountType === "company" ? normalizedCompanyEmail : email.trim();

  // Check if email already exists
  const emailExists = await checkExistingEmail(signupEmail);
  if (emailExists) {
    setMessage("This email is already registered. Please log in instead.");
    setIsLoading(false);
    return;
  }

  // Check if phone number already exists
  // const phoneExists = await checkExistingPhoneNumber(phoneNumber);
  // if (phoneExists) {
  //   setMessage("This phone number is already registered. Please use a different number.");
  //   setIsLoading(false);
  //   return;
  // }

  const normalizedWebsite =
    accountType === "company" ? normalizeUrl(companyWebsite.trim()) : null;

  const { error } = await supabase.auth.signUp({
    email: signupEmail,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth`,
      data: {
        display_name: fullName,
        fullName,
        phone: accountType === "individual" ? normalizePhoneNumber(phoneNumber) : undefined,
        account_type: accountType,
        company_name: companyName || null,
        company_website: normalizedWebsite || null,
        company_type: companyType || null,
        company_size: companySize || null,
        company_country: companyCountry || null,
        company_email: accountType === "company" ? normalizedCompanyEmail : null,
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

  const trimmedCompanyEmail = companyEmail.trim();
  const baseInvalid =
    isLoading ||
    !agree ||
    !password ||
    !fullName ||
    !accountType;
  const individualInvalid = accountType === "individual" && (!email || !phoneNumber);
  const companyInvalid =
    accountType === "company" &&
    (!companyName.trim() ||
      !companyType ||
      !companySize ||
      !companyCountry.trim() ||
      !companyWebsite.trim() ||
      !trimmedCompanyEmail);
  const submitDisabled = baseInvalid || individualInvalid || companyInvalid;

  return (
    <div className={styles.signupSplit}>
      {/* Left: form */}
      <section className={styles.signupLeft}>
        <div className={styles.signupCard}>
          {!accountType ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h1 className={styles.signupTitle}>How will you use TapInk?</h1>
              <p style={{ color: "#475467", marginBottom: 12 }}>
                Choose an account type to tailor your onboarding experience.
              </p>
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setAccountType("individual");
                    setMessage("");
                  }}
                  className={styles.accountTypeCard}
                >
                  <span className={styles.accountTypeEyebrow}>Personal</span>
                  <strong>Individual</strong>
                  <p>Perfect personal cards for professionals.</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccountType("company");
                    setMessage("");
                  }}
                  className={styles.accountTypeCard}
                >
                  <span className={styles.accountTypeEyebrow}>Corporation</span>
                  <strong>Company</strong>
                  <p>Invite team members and manage cards.</p>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <h1 className={styles.signupTitle}>
                  {accountType === "individual"
                    ? "Create your account"
                    : "Create your company account"}
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setAccountType(null);
                    setMessage("");
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#ff7a00",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Change type
                </button>
              </div>

              <form onSubmit={handleSignup} className={styles.signupForm}>
                {accountType === "company" && (
                  <>
                    <label className={styles.signupLabel}>Company name*</label>
                    <input
                      className={`${styles.signupInput} ${styles.pill}`}
                      type="text"
                      placeholder="TapInk"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />

                    <label className={styles.signupLabel}>Company type*</label>
                    <select
                      className={`${styles.signupInput} ${styles.pill}`}
                      value={companyType}
                      onChange={(e) => setCompanyType(e.target.value)}
                      required
                    >
                      <option value="">Select company type</option>
                      {companyTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <label className={styles.signupLabel}>Company size*</label>
                    <select
                      className={`${styles.signupInput} ${styles.pill}`}
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      required
                    >
                      <option value="">Select team size</option>
                      {companySizeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option} people
                        </option>
                      ))}
                    </select>

                    <label className={styles.signupLabel}>Country*</label>
                    <input
                      className={`${styles.signupInput} ${styles.pill}`}
                      type="text"
                      placeholder="Australia"
                      value={companyCountry}
                      onChange={(e) => setCompanyCountry(e.target.value)}
                      required
                    />

                    <label className={styles.signupLabel}>Company website*</label>
                    <input
                      className={`${styles.signupInput} ${styles.pill}`}
                      type="url"
                      placeholder="https://tapink.com.au"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      required
                    />

                    <label className={styles.signupLabel}>Company email*</label>
                    <input
                      className={`${styles.signupInput} ${styles.pill}`}
                      type="email"
                      placeholder="hello@tapink.com.au"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      required
                    />
                  </>
                )}

                {accountType === "individual" ? (
                  <>
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
                  </>
                ) : null}

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
                    <Link href="/policies/terms-of-service">
                      I agree to all Terms, Privacy Policy and Fees
                    </Link>
                  </span>
                </label>

                <button type="submit" className={styles.btnDark} disabled={submitDisabled}>
                  {isLoading ? "Creating…" : "Sign Up"}
                </button>
              </form>
            </>
          )}

          {accountType && (
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
          )}

          {message && <p className={styles.signupMessage}>{message}</p>}
        </div>
      </section>

      {/* Right: visual panel */}
      <aside className={styles.signupRight}>
        <div className={styles.signupArt}>
          <div className={styles.signupArtImg} role="img" aria-label="Decorative" />
          <div className={styles.signupArtCaption}>
            <h3>Discovering the way to share your details</h3>
            <p>Create your digital profile and start connecting with others using just a tap.</p>
            <div className={styles.signupChips}>
              <span className={styles.chip}>NFC-enabled</span>
              <span className={styles.chip}>Eco-friendly</span>
              <span className={styles.chip}>Customisable</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Confirmation Modal */}
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
