"use client";

import { useState, useEffect, ChangeEvent, useRef } from "react";
import styles from "@/styles/DesignDashboard.module.css";
import { supabase } from "@/lib/supabaseClient";
import Select from "react-select";
import React from "react";
import Image from "next/image"
import { input } from "framer-motion/client";
import { useRouter } from "next/navigation";
import { types } from "util";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";

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

export default function DesignDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "profile" | "links" | "socials" | "templates"
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
  const [headerBanner, setHeaderBanner] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [loading, setLoading] = useState(true);
  const [designProfileId, setDesignProfileId] = useState<string | null>(null);

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

        const { data, error } = await supabase
          .from("design_profile")
          .select("*")
          .eq("id", user.id)
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
          setTemplate(data.template || "");
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
  }, []);

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
        return alert("Not logged in!");
      }

      const { data, error } = await supabase
        .from("design_profile")
        .upsert({
          id: user.id,
          ...fields,
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (error) {
        console.error("Supabase error:", error);
        alert("Error saving: " + error.message);
      } else if (data) {
        setDesignProfileId(data.id);
        setProfilePic(data.profile_pic || null);
        setHeaderBanner(data.header_banner || null);
        alert("Saved successfully!");
      }
    } catch (err) {
      console.error("Error saving:", err);
      alert("Error saving");
    }
  };

  // Specific save functions for each tab
  const saveProfileTab = () =>
    saveToDatabase({
      firstname,
      surname,
      pronouns,
      phone,
      company,
      title,
      email,
      bio,
      profile_pic: profilePic,
      address,
    });

  const saveLinksTab = () => saveToDatabase({ links });

  const saveSocialsTab = () => saveToDatabase({ socials });

  const saveTemplateTab = () => saveToDatabase({ template });

  // File upload handler
  const handleFileUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    setter: (val: string | null) => void,
    folder: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        alert("Not logged in!");
        return;
      }
  
      // Unique path for this user’s file
      const filePath = `${folder}/${user.id}-${Date.now()}-${file.name}`;
  
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profile-pics") 
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });
  
      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert("Upload failed: " + uploadError.message);
        return;
      }
  
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from("profile-pics")
        .getPublicUrl(filePath);
  
      const publicUrl = publicUrlData.publicUrl;
  
      // Save public URL to state
      setter(publicUrl);
  
      // Optionally update DB immediately
      await supabase
        .from("design_profile")
        .update({ [folder === "profile-pics" ? "profile_pic" : "header_banner"]: publicUrl })
        .eq("id", user.id);
  
      console.log("File uploaded:", publicUrl);
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Error uploading file");
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
          {["profile", "links", "socials", "templates"].map((tab) => (
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
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setHeaderBanner, "header-banners")}
              />
            </div>

            <div className={styles.field}>
              <label>Profile Picture</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setProfilePic, "profile-pics")}
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
                options={options}
                value={options.find((option) => option.value === pronouns)}
                onChange={(selectedOption) =>
                  setPronouns(selectedOption?.value || "")
                }
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
                <p key={i}>
                  {l.title} → {l.url}
                </p>
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
                  {/* Only show the icon */}
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

                      // Normalize the URL if it doesn't already start with "http://" or "https://"
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
      </main>

      {/* Profile Action Buttons */}
      <div style={{ marginTop: "20px", textAlign: "center", display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
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
              onClick={() => {
                const profileUrl = `${window.location.origin}/user/${designProfileId}`;
                navigator.clipboard.writeText(profileUrl);
                alert("Profile URL copied to clipboard!");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px 20px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontWeight: 500,
                color: "#374151",
                backgroundColor: "#fff",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                cursor: "pointer",
                width: "fit-content",
              }}
            >
              Share Profile
            </button>
          </>
        ) : (
          <p>Loading profile link...</p>
        )}
      </div>

    </div>
  );
}
