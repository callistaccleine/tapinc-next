"use client";

import { useState, useEffect, ChangeEvent, useRef } from "react";
import styles from "@/styles/DesignDashboard.module.css";
import { supabase } from "@/lib/supabaseClient";
import Select from "react-select";
import React from "react";
import Image from "next/image"
import { useRouter } from "next/navigation";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";
import ProfileQRCode from "@/components/ProfileQRCode";
import Notification from "./Notification";

interface Link {
  title: string;
  url: string;
}

interface Socials {
  [platform: string]: string;
}

const SocialIcon = ({ platform }: { platform: string }) => (
  <Image 
    src={`/icons/${platform}.svg`} 
    width={20} 
    height={20} 
    alt={`${platform} icon`}
  />
);

interface DesignDashboardProps {
  profile?: any;
}

export default function DesignDashboard({profile}: DesignDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "profile" | "links" | "socials" | "templates" | "card design"
  >("profile");
  const [firstname, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [socials, setSocials] = useState<Socials>({});
  const [newLink, setNewLink] = useState<Link>({ title: "", url: "" });
  const [template, setTemplate] = useState("");
  const [cardDesign, setCardDesign] = useState("");
  const [headerBanner, setHeaderBanner] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [loading, setLoading] = useState(true);
  const [designProfileId, setDesignProfileId] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false); 
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
  };

  const libraries: ("places")[] = ["places"];

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "", 
    libraries,
  });

  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place && place.formatted_address) {
        setAddress(place.formatted_address);
      }
    }
  };

  const templateMap: Record<string, string> = {
    "Template 1": "template1_blank.svg",
    "Template 2": "template2_blank.svg",
    "Template 3": "template3_blank.svg",
  };

  const options = [
    { value: "She/Her", label: "She/Her" },
    { value: "He/Him", label: "He/Him" },
    { value: "They/Them", label: "They/Them" },
    { value: "Not Specified", label: "Not Specified" },
  ];

  // Load profile from Supabase
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("User error:", userError);
          return;
        }
        if (!user) {
          console.log("No user found");
          return;
        }

        console.log("Loading profile for user:", user.id);

        if (!profile) return;
     
        const { data, error } = await supabase
          .from("design_profile")
          .select("*")
          .eq("profile_id", profile.id)
          .single();

        if (error) {
          console.error("Database error:", error);
        } else if (data) {
          setDesignProfileId(data.id);
          setFirstName(data.firstname || "");
          setSurname(data.surname || "");
          setPronouns(data.pronouns || "");
          setPhone(data.phone || "");
          setCompany(data.company || "");
          setTitle(data.title || "");
          setEmail(data.email || user.email || "");
          setBio(data.bio || "");
          setProfilePic(data.profile_pic || null);
          setHeaderBanner(data.header_banner || null);
          setTemplate(data.template || "");
          setCardDesign(data.cardDesign || "");
          setLinks(data.links || []);
          setSocials(data.socials || {});
          setAddress(data.address || "");
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [profile]);

  // Add link
  const addLink = () => {
    if (!newLink.title || !newLink.url) return;
    setLinks([...links, newLink]);
    setNewLink({ title: "", url: "" });
  };

  // Reusable save function
  const saveToDatabase = async (fields: Record<string, any>) => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
  
      if (userError || !user) {
        showNotification("Not logged in!", "error");
        return;
      }
  
      if (!profile?.id) {
        showNotification("Profile not found!", "error");
        return;
      }
  
      // Check if design_profile already exists for this profile
      const { data: existing } = await supabase
        .from("design_profile")
        .select("id")
        .eq("profile_id", profile.id)
        .maybeSingle();
  
      let response;
      if (existing) {
        // Update existing record
        response = await supabase
          .from("design_profile")
          .update({
            ...fields,
            updated_at: new Date().toISOString(),
          })
          .eq("profile_id", profile.id)
          .select("*")
          .single();
      } else {
        // Insert new record
        response = await supabase
          .from("design_profile")
          .insert({
            profile_id: profile.id,
            email: email || user.email || "",
            ...fields,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("*")
          .single();
      }
  
      const { data, error } = response;
  
      if (error) {
        console.error("Supabase error:", error);
        showNotification("Error saving: " + error.message, "error");
        throw error;
      } else if (data) {
        setDesignProfileId(data.id);
        console.log("Saved successfully:", data);
        return data;
      }
    } catch (err) {
      console.error("Error saving:", err);
      throw err;
    }
  };

  // Improved file upload handler
  const handleFileUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    fieldName: "profile_pic" | "header_banner"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        showNotification("Not logged in!", "error");
        return;
      }

      if (!profile?.id) {
        showNotification("Profile not found!", "error");
        return;
      }

      // Validate file
      if (!file.type.startsWith('image/')) {
        showNotification("Please upload an image file", "error");
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        showNotification("File size must be less than 5MB", "error");
        return;
      }

      showNotification("Uploading image...", "success");

      // Determine bucket
      const bucketName = fieldName === "profile_pic" ? "profile-pics" : "header-banner";
      
      // Create unique file path
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        showNotification(`Upload failed: ${uploadError.message}`, "error");
        return;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;
      console.log("Public URL generated:", publicUrl);

      // Get current record to delete old image
      const { data: existingRecord } = await supabase
        .from("design_profile")
        .select("id, profile_pic, header_banner")
        .eq("profile_id", profile.id)
        .maybeSingle();

      // Save to database
      await saveToDatabase({ [fieldName]: publicUrl });

      // Delete old image if exists
      if (existingRecord && existingRecord[fieldName]) {
        try {
          const oldUrl = existingRecord[fieldName] as string;
          const oldUrlParts = oldUrl.split(`/${bucketName}/`);
          if (oldUrlParts[1]) {
            const oldPath = decodeURIComponent(oldUrlParts[1]);
            await supabase.storage.from(bucketName).remove([oldPath]);
            console.log("Old image deleted:", oldPath);
          }
        } catch (err) {
          console.log("Could not delete old image:", err);
        }
      }

      // Update local state
      if (fieldName === "profile_pic") {
        setProfilePic(publicUrl);
      } else {
        setHeaderBanner(publicUrl);
      }

      showNotification("Image uploaded successfully!", "success");
    } catch (err: any) {
      console.error("Upload error:", err);
      showNotification(err.message || "Upload failed", "error");
    }
  };

  // Specific save functions for each tab
  const saveProfileTab = async () => {
    try {
      await saveToDatabase({
        firstname,
        surname,
        pronouns,
        phone,
        company,
        title,
        email,
        bio,
        profile_pic: profilePic,
        header_banner: headerBanner,
        address,
      });
      showNotification("Profile saved successfully!", "success");
    } catch (error) {
      console.error("Error saving profile:", error);
      showNotification("Failed to save profile. Please try again.", "error");
    }
  };
  
  const saveLinksTab = async () => {
    try {
      await saveToDatabase({ links });
      showNotification("Links saved successfully!", "success");
    } catch (error) {
      console.error("Error saving links:", error);
      showNotification("Failed to save links. Please try again.", "error");
    }
  };
  
  const saveSocialsTab = async () => {
    try {
      await saveToDatabase({ socials });
      showNotification("Socials saved successfully!", "success");
    } catch (error) {
      console.error("Error saving socials:", error);
      showNotification("Failed to save socials. Please try again.", "error");
    }
  };
  
  const saveTemplateTab = async () => {
    try {
      await saveToDatabase({ template });
      showNotification("Template saved successfully!", "success");
    } catch (error) {
      console.error("Error saving template:", error);
      showNotification("Failed to save template. Please try again.", "error");
    }
  };

  const saveCardDesignTab = async () => {
    try {
      await saveToDatabase({ cardDesign });
      showNotification("Card Design saved successfully!", "success");
    } catch (error) {
      console.error("Error saving card design:", error);
      showNotification("Failed to save card design. Please try again.", "error");
    }
  };

  if (loading) {
    return <div className={styles.designpageContainer}>Loading profile...</div>;
  }

  return (
    <div className={styles.designpageContainer}>
      {/* Sidebar */}
      <aside className={styles.designSidebar}>
        {/* Back Button */}
        <button className={styles.backButton} 
          onClick={() => router.push("/dashboard")}>
          ←
        </button>

        <h3>Editor</h3>
        <ul className={styles.navList}>
          {["profile", "links", "socials", "templates", "card design"].map((tab) => (
            <li
              key={tab}
              className={activeTab === tab ? styles.active : ""}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </li>
          ))}
        </ul>
      </aside>

      {/* Middle Editor */}
      <main className={styles.designEditor}>
        {activeTab === "profile" && (
          <>
            <h3>Edit Profile</h3>
            <h4>This information will be visible on your profile</h4>

            <div className={styles.field}>
              <label>Header Banner</label>
              {headerBanner && (
                <div style={{ marginBottom: '10px' }}>
                  <img 
                    src={headerBanner} 
                    alt="Header preview" 
                    style={{
                      maxWidth: '100%', 
                      maxHeight: '150px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #e5e5e5'
                    }} 
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "header_banner")}
              />
            </div>

            <div className={styles.field}>
              <label>Profile Picture</label>
              {profilePic && (
                <div style={{ marginBottom: '10px' }}>
                  <img 
                    src={profilePic} 
                    alt="Profile preview" 
                    style={{
                      width: '100px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '50%',
                      border: '2px solid #e5e5e5'
                    }} 
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "profile_pic")}
              />
            </div>

            <div className={styles.field}>
              <label>First Name</label>
              <input
                type="text"
                value={firstname}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label>Surname</label>
              <input
                type="text"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label>Pronouns</label>
              <Select
                className={styles.pronounsSelect}
                options={options}
                value={options.find((option) => option.value === pronouns)}
                onChange={(selectedOption) =>
                  setPronouns(selectedOption?.value || "")
                }
                instanceId="pronouns-select"
              />
            </div>

            <div className={styles.field}>
              <label>Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label>Mobile Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label>Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label>Job Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label>Address</label>
              {isLoaded ? (
                <Autocomplete
                  onLoad={(autocompleteInstance) => setAutocomplete(autocompleteInstance)}
                  onPlaceChanged={handlePlaceChanged}
                >
                  <input
                    type="text"
                    placeholder="Search for an address..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </Autocomplete>
              ) : (
                <p>Loading Google Places...</p>
              )}
            </div>

            <div className={styles.field}>
              <label>Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>

            <button className={styles.btn} onClick={saveProfileTab}>
              Save Profile
            </button>
          </>
        )}

        {activeTab === "links" && (
          <>
            <h3>Add Links</h3>
            <div className={styles.linkRow}>
              <input
                type="text"
                placeholder="Link title"
                value={newLink.title}
                onChange={(e) =>
                  setNewLink({ ...newLink, title: e.target.value })
                }
              />
              <input
                type="url"
                placeholder="https://example.com"
                value={newLink.url}
                onChange={(e) =>
                  setNewLink({ ...newLink, url: e.target.value })
                }
              />
            </div>
            <button className={styles.btn} onClick={addLink}>
              + Add Link
            </button>

            <div className={styles.blockPlaceholder}>
              {links.length === 0 && <p>[No links added]</p>}
              {links.map((l, i) => (
                <div 
                  key={i} 
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: "#ffffff",
                    border: "1px solid #e5e5e5",
                    borderRadius: "8px",
                    marginBottom: "8px"
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 500, color: "#000000" }}>
                      {l.title}
                    </p>
                    <p style={{ margin: 0, fontSize: "13px", color: "#86868b" }}>
                      {l.url}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const updatedLinks = links.filter((_, index) => index !== i);
                      setLinks(updatedLinks);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: 500,
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fef2f2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button className={styles.btn} onClick={saveLinksTab}>
              Save Links
            </button>
          </>
        )}

        {activeTab === "socials" && (
          <>
            <h3>Social Links</h3>
            <div className={styles.socialCards}>
              {[
                "X",
                "instagram",
                "linkedin",
                "facebook",
                "youtube",
                "discord",
                "twitch",
                "whatsapp",
                "github",
              ].map((platform) => (
                <div
                  key={platform}
                  className={`${styles.socialCard} ${
                    socials[platform] !== undefined ? styles.active : ""
                  }`}
                  onClick={() => {
                    if (socials[platform] === undefined) {
                      setSocials({ ...socials, [platform]: "" });
                    } else {
                      const updated = { ...socials };
                      delete updated[platform];
                      setSocials(updated);
                    }
                  }}
                >
                  <SocialIcon platform={platform.toLowerCase()} />
                </div>
              ))}
            </div>

            <div className={styles.socialInputs}>
              {Object.entries(socials).map(([platform, url]) => (
                <div key={platform} className={styles.field}>
                  <label>{platform} URL</label>
                  <input
                    type="url"
                    placeholder={`Enter your ${platform} URL`}
                    value={url}
                    onChange={(e) => {
                      const inputUrl = e.target.value.trim();
                      let normalizedUrl = inputUrl;

                      if (
                        inputUrl &&
                        !inputUrl.startsWith("http://") &&
                        !inputUrl.startsWith("https://")
                      ) {
                        normalizedUrl = `https://www.${inputUrl}`;
                      }

                      setSocials({ ...socials, [platform]: normalizedUrl });
                    }}
                  />
                </div>
              ))}
            </div>

            <button className={styles.btn} onClick={saveSocialsTab}>
              Save Socials
            </button>
          </>
        )}

        {activeTab === "templates" && (
          <>
            <h3>Choose Your Virtual Card Style</h3>
            <div className={styles.templateGrid}>
              {Object.keys(templateMap).map((templateName) => (
                <div
                  key={templateName}
                  className={`${styles.templateCard} ${
                    template === templateMap[templateName] ? styles.active : ""
                  }`}
                  onClick={() => setTemplate(templateMap[templateName])}
                >
                  <img
                    src={`/templates/${templateName}.png`}
                    alt={templateName}
                    className={styles.templateImage}
                  />
                  <p className={styles.templateLabel}>{templateName}</p>
                </div>
              ))}
            </div>

            <button className={styles.btn} onClick={saveTemplateTab}>
              Save Template
            </button>
          </>
        )}

        {activeTab === "card design" && (
          <>
            <h3>Design Your Card</h3>
            <div className={styles.templateGrid}>
              {Object.keys(templateMap).map((templateName) => (
                <div
                  key={templateName}
                  className={`${styles.templateCard} ${
                    cardDesign === templateMap[templateName] ? styles.active : ""
                  }`}
                  onClick={() => setCardDesign(templateMap[templateName])}
                >
                  <img
                    src={`/templates/${templateName}.png`}
                    alt={templateName}
                    className={styles.templateImage}
                  />
                  <p className={styles.templateLabel}>{templateName}</p>
                </div>
              ))}
            </div>

            <button className={styles.btn} onClick={saveCardDesignTab}>
              Save Card Design
            </button>
          </>
        )}
      </main>

      {/* Profile Action Buttons */}
      <div
        style={{
          marginTop: "20px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          alignItems: "center",
        }}
      >
        {designProfileId ? (
          <>
            <a
              href={`/user/${designProfileId}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px 20px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: 500,
                color: "#374151",
                backgroundColor: "#fff",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                width: "fit-content",
              }}
            >
              View Profile
            </a>

            <button
              onClick={() => setShowQRCode(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px 10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontWeight: 500,
                color: "#374151",
                backgroundColor: "#fff",
                boxShadow: "1px 1px 2px rgba(0,0,0,0.05)",
                cursor: "pointer",
                width: "fit-content",
              }}
            >
              Share Profile
            </button>

            {showQRCode && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100vw",
                  height: "100vh",
                  background: "rgba(0, 0, 0, 0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 9999,
                }}
                onClick={() => setShowQRCode(false)}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: "#fff",
                    padding: "30px 40px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    textAlign: "center",
                    maxWidth: "400px",
                    width: "90%",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                    <ProfileQRCode profileId={designProfileId} />

                    <p
                      style={{
                        fontSize: "13px",
                        color: "#555",
                        wordBreak: "break-all",
                        marginBottom: "12px",
                      }}
                    >
                      {`${window.location.origin}/user/${designProfileId}`}
                    </p>

                    <button
                      onClick={async () => {
                        const profileUrl = `${window.location.origin}/user/${designProfileId}`;
                        await navigator.clipboard.writeText(profileUrl);
                        showNotification("Profile link copied to clipboard!", "success");
                      }}
                      style={{
                        padding: "10px 18px",
                        border: "none",
                        borderRadius: "6px",
                        backgroundColor: "#000",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      Copy Link
                    </button>

                    <button
                      onClick={() => setShowQRCode(false)}
                      style={{
                        marginTop: "10px",
                        border: "none",
                        background: "transparent",
                        color: "#555",
                        fontSize: "13px",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <p style={{ color: "#777" }}>Please save your profile first to view or share it.</p>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}