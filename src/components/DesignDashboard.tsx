"use client";

import { useState, useEffect, ChangeEvent } from "react";
import styles from "@/styles/DesignDashboard.module.css";
import { supabase } from "@/lib/supabaseClient";

interface Link {
  title: string;
  url: string;
}

interface Socials {
  [platform: string]: string;
}

export default function DesignDashboard() {
  const [activeTab, setActiveTab] = useState<"profile" | "links" | "socials" | "templates">("profile");
  const [firstname, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [socials, setSocials] = useState<Socials>({});
  const [newLink, setNewLink] = useState<Link>({ title: "", url: "" });
  const [headerStyle, setHeaderStyle] = useState("minimal");
  const [headerBanner, setHeaderBanner] = useState<string | null>(null);

  // ✅ Load profile from Supabase
  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        console.error(userError);
        return;
      }
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        if (error.code !== "PGRST116") console.error(error);
      } else if (data) {
        setFirstName(data.firstname || "");
        setSurname(data.surname || "");
        setPhone(data.phone || "");
        setCompany(data.company || "");
        setTitle(data.title || "");
        setBio(data.bio || "");
        setProfilePic(data.profile_pic || null);
        setHeaderBanner(data.header_banner || null);
        setHeaderStyle(data.header_style || "minimal");
        setLinks(data.links || []);
        setSocials(data.socials || {});
      }
    };
    loadProfile();
  }, []);

  // ✅ Add link
  const addLink = () => {
    if (!newLink.title || !newLink.url) return;
    setLinks([...links, newLink]);
    setNewLink({ title: "", url: "" });
  };

  // ✅ Save profile to Supabase
  const saveProfile = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return alert("Not logged in!");
    }

    const { error } = await supabase.from("design_profile").upsert({
      id: user.id,
      firstname,
      surname,
      phone,
      company,
      title,
      bio,
      profile_pic: profilePic,
      header_banner: headerBanner,
      header_style: headerStyle,
      links,
      socials,
    });

    if (error) {
      console.error("Supabase error:", error.message, error.details);
      alert("Error saving profile: " + error.message);
    } else {
      alert("Profile saved!");
    }
  };

  const handleFileUpload = (
    e: ChangeEvent<HTMLInputElement>,
    setter: (val: string | null) => void
  ) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (event) => setter(event.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className={styles.designpageContainer}>
      {/* Sidebar */}
      <aside className={styles.designSidebar}>
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
                onChange={(e) => handleFileUpload(e, setHeaderBanner)}
              />
            </div>

            <div className={styles.field}>
              <label>Profile Picture</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setProfilePic)}
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
              <input
                type="text"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
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
              <label>Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
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
          </>
        )}

        {activeTab === "socials" && (
          <>
            <h3>Social Links</h3>
            <div className={styles.socialCards}>
              {[
                "twitter",
                "instagram",
                "linkedin",
                "facebook",
                "youtube",
                "discord",
                "twitch",
                "whatsapp",
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
                  <span>{platform}</span>
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
                    onChange={(e) =>
                      setSocials({ ...socials, [platform]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "templates" && (
          <>
            <h3>Choose Header Style</h3>
            <div className={styles.templateOptions}>
              {["minimal", "banner", "portrait", "shapes"].map((style) => (
                <button
                  key={style}
                  className={`${styles.templateChoice} ${
                    headerStyle === style ? styles.active : ""
                  }`}
                  onClick={() => setHeaderStyle(style)}
                >
                  {style}
                </button>
              ))}
            </div>
          </>
        )}

        <button className={styles.btn} onClick={saveProfile}>
          Save Profile
        </button>
      </main>

      {/* Emulator */}
      <aside className={styles.designEmulator}>
        <div className={styles.phoneFrame}>
          <div className={styles.phoneHeader}></div>
          <div className={styles.phoneContent}>
            {headerBanner && (
              <div className={styles.headerBanner}>
                <img src={headerBanner} alt="Header Banner" />
              </div>
            )}

            <div className={styles.avatarSection}>
              <div className={styles.avatarCircle}>
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className={styles.avatarImg} />
                ) : (
                  <span>+</span>
                )}
              </div>
              <h3>
                {firstname || "First Name"} {surname || "Surname"}
              </h3>
              <p className={styles.jobTitle}>
                {title || "Job Title"} @ {company || "Company"}
              </p>
              <p className={styles.phone}>{phone || "Mobile Number"}</p>
            </div>

            <div className={styles.bioSection}>
              <p>{bio || "Bio placeholder text..."}</p>
            </div>

            <div className={styles.pronounsSection}>
              <p>{pronouns || "Gender"}</p>
            </div>

            <div className={styles.linksSection}>
              <p>Links</p>
              {links.length === 0 && <p className={styles.placeholder}>[No links yet]</p>}
              {links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noreferrer" className={styles.linkButton}>
                  {l.title}
                </a>
              ))}
            </div>

            <div className={styles.socialIcons}>
              <p>Social Links</p>
              {Object.entries(socials).map(([platform, url]) => (
                <a key={platform} href={url} target="_blank" rel="noreferrer">
                  {platform}
                </a>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
