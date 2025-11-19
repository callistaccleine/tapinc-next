"use client";

import { useState, useEffect, type CSSProperties, type ChangeEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import Select from "react-select";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ProfileQRCode from "@/components/ProfileQRCode";
import VirtualPreview from "@/components/virtualcard_preview/VirtualPreview";
import { CardData } from "@/types/CardData";
import {
  PhysicalCardDesigner,
  DEFAULT_CARD_DESIGN,
  CardDesignSettings,
  parseCardDesign,
  CardExportPayload,
} from "@/components/PhysicalCardDesigner";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";

interface Link {
  title: string;
  url: string;
}

interface Socials {
  [platform: string]: string;
}

type DesignTab = "profile" | "links" | "socials" | "templates" | "card design";

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

const NAV_TABS: DesignTab[] = [
  "profile",
  "links",
  "socials",
  "templates",
  "card design",
];

export default function DesignDashboard({profile}: DesignDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    DesignTab
  >("profile");
  
  // Profile state
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
  const [cardDesign, setCardDesign] = useState<CardDesignSettings>({ ...DEFAULT_CARD_DESIGN });
  const [headerBanner, setHeaderBanner] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [loading, setLoading] = useState(true);
  const [designProfileId, setDesignProfileId] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  // Activation state
  const [physicalActivated, setPhysicalActivated] = useState(false);
  const [virtualActivated, setVirtualActivated] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<string>("template1_blank.svg");
  const [cardLogoUploading, setCardLogoUploading] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [isSmallScreen, setSmallScreen] = useState(false);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
  
    setTimeout(() => {
      setNotification(null);
    }, 5000);
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

  const templateOptions = [
    {
      name: "Template 1",
      file: "template1_blank.svg",
      persona: "Modern Gradient",
      description: "Curved hero with soft gradients ideal for creative professionals.",
      thumbnail: "/templates/Template 1.png",
    },
    {
      name: "Template 2",
      file: "template2_blank.svg",
      persona: "Polished Minimal",
      description: "Clean card with centered bio and neutral palette for consultants.",
      thumbnail: "/templates/Template 2.png",
    },
    {
      name: "Template 3",
      file: "template3_blank.svg",
      persona: "Executive Formal",
      description: "Structured layout with crisp dividers made for corporate teams.",
      thumbnail: "/templates/Template 3.png",
    },
  ];


  const updateCardDesign = (changes: Partial<CardDesignSettings>) =>
    setCardDesign((prev) => ({ ...prev, ...changes }));

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

        if (userError || !user || !profile) {
          console.error("User error or no profile:", userError);
          return;
        }

        // Load design_profile data
        const { data: designData, error: designError } = await supabase
          .from("design_profile")
          .select("*")
          .eq("profile_id", profile.id)
          .single();

        if (designError && designError.code !== 'PGRST116') {
          console.error("Database error:", designError);
        } else if (designData) {
          setDesignProfileId(designData.id);
          setFirstName(designData.firstname || "");
          setSurname(designData.surname || "");
          setPronouns(designData.pronouns || "");
          setPhone(designData.phone || "");
          setCompany(designData.company || "");
          setTitle(designData.title || "");
          setEmail(designData.email || user.email || "");
          setBio(designData.bio || "");
          setProfilePic(designData.profile_pic || null);
          setHeaderBanner(designData.header_banner || null);
          const loadedTemplate = designData.template || "";
          setTemplate(loadedTemplate);
          setPreviewTemplate(loadedTemplate || templateOptions[0].file);
          setCardDesign(parseCardDesign(designData.cardDesign));
          let loadedLinks: any = designData.links || [];
          if (typeof designData.links === "string") {
            try {
              loadedLinks = JSON.parse(designData.links);
            } catch (err) {
              console.warn("Failed to parse saved links", err);
              loadedLinks = [];
            }
          }
          setLinks(Array.isArray(loadedLinks) ? loadedLinks : []);
          setSocials(designData.socials || {});
          setAddress(designData.address || "");
        } else {
          setPreviewTemplate(templateOptions[0].file);
          setCardDesign({ ...DEFAULT_CARD_DESIGN });
        }

        // Load activation status from profiles table
        if (profile) {
          setPhysicalActivated(profile.physical_activated || false);
          setVirtualActivated(profile.virtual_activated || false);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [profile]);

  useEffect(() => {
    if (template) {
      setPreviewTemplate(template);
    }
  }, [template]);

  useEffect(() => {
    if (profile?.id && typeof window !== "undefined") {
      setProfileUrl(`${window.location.origin}/user/${profile.id}`);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobileLayout(width <= 1024);
      setSmallScreen(width <= 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isMobileLayout) {
      setSidebarOpen(false);
    }
  }, [isMobileLayout]);

  // Check if basic info is complete
  const isBasicInfoComplete = () => {
    return firstname && surname && email;
  };

  // Save functions
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
  
      const { data: existing } = await supabase
        .from("design_profile")
        .select("id")
        .eq("profile_id", profile.id)
        .maybeSingle();
  
      let response;
      if (existing) {
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
        return data;
      }
    } catch (err) {
      console.error("Error saving:", err);
      throw err;
    }
  };

  const handleFileUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    fieldName: "profile_pic" | "header_banner" | "card_logo"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (fieldName === "card_logo") {
        setCardLogoUploading(true);
      }
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user || !profile?.id) {
        showNotification("Not logged in or profile not found!", "error");
        return;
      }

      if (!file.type.startsWith('image/')) {
        showNotification("Please upload an image file", "error");
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        showNotification("File size must be less than 5MB", "error");
        return;
      }

      showNotification("Uploading image...", "success");

      const bucketName =
        fieldName === "profile_pic"
          ? "profile-pics"
          : fieldName === "header_banner"
          ? "header-banner"
          : "card-logo";
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

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

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      if (fieldName === "profile_pic") {
        setProfilePic(publicUrl);
        await saveToDatabase({ profile_pic: publicUrl });
      } else if (fieldName === "header_banner") {
        setHeaderBanner(publicUrl);
        await saveToDatabase({ header_banner: publicUrl });
      } else {
        updateCardDesign({ logoUrl: publicUrl });
        showNotification("Logo uploaded. Don't forget to save your card design.", "success");
        return;
      }

      showNotification("Image uploaded successfully!", "success");
    } catch (err: any) {
      console.error("Upload error:", err);
      showNotification(err.message || "Upload failed", "error");
    } finally {
      if (fieldName === "card_logo") {
        setCardLogoUploading(false);
      }
    }
  };

  const addLink = () => {
    if (!newLink.title || !newLink.url) return;
    setLinks([...links, newLink]);
    setNewLink({ title: "", url: "" });
  };

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

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
      // Generate profile link 
      if (profile?.id) {
        const profileUrl = `${window.location.origin}/user/${profile.id}`;
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ qr_url: profileUrl })
          .eq("id", profile.id);

        if (updateError) {
          console.error("Error saving QR URL:", updateError);
        }
      }
      showNotification("Profile saved successfully!", "success");
    } catch (error) {
      showNotification("Failed to save profile", "error");
    }
  };
  
  const saveLinksTab = async () => {
    try {
      await saveToDatabase({ links });
      showNotification("Links saved successfully!", "success");
    } catch (error) {
      showNotification("Failed to save links", "error");
    }
  };
  
  const saveSocialsTab = async () => {
    try {
      await saveToDatabase({ socials });
      showNotification("Socials saved successfully!", "success");
    } catch (error) {
      showNotification("Failed to save socials", "error");
    }
  };

  const updateVirtualActivation = async (status: boolean) => {
    if (!profile?.id) {
      throw new Error("Profile not found");
    }

    if (virtualActivated === status) {
      setVirtualActivated(status);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ virtual_activated: status })
      .eq("id", profile.id);

    if (error) {
      throw error;
    }

    setVirtualActivated(status);
  };

  const updatePhysicalActivation = async (status: boolean) => {
    if (!profile?.id) {
      throw new Error("Profile not found");
    }

    if (physicalActivated === status) {
      setPhysicalActivated(status);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ physical_activated: status })
      .eq("id", profile.id);

    if (error) {
      throw error;
    }

    setPhysicalActivated(status);
  };

  const saveTemplateTab = async () => {
    try {
      const templateToPersist = previewTemplate || template || templateOptions[0].file;
      setTemplate(templateToPersist);
      await saveToDatabase({ template: templateToPersist });

      const hasTemplate = Boolean(templateToPersist);
      const basicInfoReady = isBasicInfoComplete();
      let message = "Template updated successfully.";

      if (hasTemplate) {
        if (!basicInfoReady) {
          showNotification(
            "Template saved. Complete Profile, Links, and Socials tabs before activating your virtual card.",
            "error"
          );
          return;
        }

        if (!virtualActivated || profile?.virtual_activated !== true) {
          await updateVirtualActivation(true);
          message = "Your virtual card is now active. Share your profile instantly.";
        }
      } else {
        await updateVirtualActivation(false);
        message = "Virtual card deactivated. Select a template to activate it again.";
      }

      showNotification(message, "success");
    } catch (error) {
      console.error("Error saving template:", error);
      showNotification("Failed to save template", "error");
    }
  };

  const saveCardDesignTab = async (exportPayload?: CardExportPayload) => {
    try {
      const savedRecord = await saveToDatabase({ cardDesign: JSON.stringify(cardDesign) });
      const currentDesignId = savedRecord?.id || designProfileId;

      let message = "Card design saved.";

      if (!physicalActivated) {
        await updatePhysicalActivation(true);
        message = "Physical card activated. Your latest design is ready.";
      } else {
        message = "Card design updated.";
      }

      if (
        exportPayload &&
        exportPayload.frontImage &&
        exportPayload.backImage &&
        currentDesignId
      ) {
        try {
          const response = await fetch("/api/physical-card/export", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              designProfileId: currentDesignId,
              frontImage: exportPayload.frontImage,
              backImage: exportPayload.backImage,
              resolution: exportPayload.resolution,
              widthPx: exportPayload.widthPx,
              heightPx: exportPayload.heightPx,
              designSettings: cardDesign,
            }),
          });

          if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            console.error("Failed to export card assets:", errorBody);
            showNotification(
              "Card design saved but exporting assets to Google Drive failed.",
              "error"
            );
            return;
          }
          message += " Assets exported to Google Drive.";
        } catch (err) {
          console.error("Export error:", err);
          showNotification(
            "Card design saved but exporting assets to Google Drive failed.",
            "error"
          );
          return;
        }
      }

      showNotification(message, "success");
    } catch (error) {
      console.error("Error saving card design", error);
      showNotification("Failed to save card design", "error");
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
      }}>
        Loading profile...
      </div>
    );
  }

  const containerStyle: CSSProperties = {
    display: isMobileLayout ? "block" : "grid",
    gridTemplateColumns: isMobileLayout ? undefined : "260px 1fr",
    minHeight: "100vh",
    background: "#f5f5f7",
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    position: "relative",
  };

  const sidebarStyle: CSSProperties = {
    background: "#ffffff",
    borderRight: isMobileLayout ? "none" : "1px solid #e5e5e5",
    padding: "24px",
    position: isMobileLayout ? "fixed" : "relative",
    top: 0,
    left: 0,
    height: isMobileLayout ? "100vh" : "auto",
    minHeight: isMobileLayout ? undefined : "100%",
    alignSelf: "stretch",
    width: isMobileLayout ? "80vw" : "auto",
    minWidth: isMobileLayout ? "auto" : "260px",
    maxWidth: isMobileLayout ? "320px" : "320px",
    transform: isMobileLayout ? (isSidebarOpen ? "translateX(0)" : "translateX(-100%)") : "none",
    transition: "transform 0.3s ease",
    zIndex: 1200,
    boxShadow: isMobileLayout ? "0 24px 64px rgba(0, 0, 0, 0.25)" : "none",
    overflowY: "auto",
  };

  const sidebarOverlayStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.4)",
    border: "none",
    opacity: isSidebarOpen ? 1 : 0,
    pointerEvents: isSidebarOpen ? "auto" : "none",
    transition: "opacity 0.3s ease",
    zIndex: 1100,
  };

  const mainStyle: CSSProperties = {
    padding: isMobileLayout ? "28px 20px 80px" : "40px",
    overflowY: "auto",
    minHeight: "100vh",
    position: "relative",
  };

  const mobileHeaderStyle: CSSProperties = {
    display: isMobileLayout ? "flex" : "none",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "24px",
  };

  const mobileMenuButtonStyle: CSSProperties = {
    border: "1px solid #d2d2d7",
    background: "#ffffff",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "15px",
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  };
  const linkInputRowStyle: CSSProperties = {
    display: isSmallScreen ? "grid" : "flex",
    gridTemplateColumns: isSmallScreen ? "1fr" : undefined,
    gap: isSmallScreen ? "10px" : "12px",
    marginBottom: "16px",
  };

  const linksListRowStyle = (isLast: boolean): CSSProperties => ({
    display: isSmallScreen ? "grid" : "flex",
    gridTemplateColumns: isSmallScreen ? "1fr" : undefined,
    justifyContent: isSmallScreen ? "stretch" : "space-between",
    alignItems: isSmallScreen ? "start" : "center",
    gap: isSmallScreen ? "10px" : "16px",
    padding: "12px 16px",
    background: "#ffffff",
    border: "1px solid #e5e5e5",
    borderRadius: "8px",
    marginBottom: isLast ? "0" : "8px",
  });

  const socialGridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: isSmallScreen ? "repeat(3, minmax(0, 1fr))" : "repeat(auto-fill, minmax(80px, 1fr))",
    gap: "12px",
    marginBottom: "24px",
  };

  const templatePreviewGridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: isSmallScreen ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
    alignItems: "start",
    marginBottom: "24px",
  };

  const templateListStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  };

  const templateActionRowStyle: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    flexDirection: isSmallScreen ? "column" : "row",
    justifyContent: "space-between",
    alignItems: isSmallScreen ? "stretch" : "center",
    gap: "16px",
  };

  return (
    <div style={containerStyle}>
      {isMobileLayout && (
        <button
          type="button"
          aria-label="Close navigation"
          aria-hidden={!isSidebarOpen}
          tabIndex={isSidebarOpen ? 0 : -1}
          onClick={closeSidebar}
          style={sidebarOverlayStyle}
        />
      )}
      {/* Sidebar */}
      <aside style={sidebarStyle} aria-hidden={isMobileLayout && !isSidebarOpen}>
        <button 
          onClick={() => router.push("/dashboard")}
          style={{
            background: '#f5f5f7',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            color: "black",
            marginBottom: '24px',
            fontSize: '18px'
          }}
        >
          ←
        </button>

        <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: "black" }}>Editor</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {NAV_TABS.map((tab) => (
            <li
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (isMobileLayout) {
                  setSidebarOpen(false);
                }
              }}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '4px',
                color: "black",
                background: activeTab === tab ? '#f5f5f7' : 'transparent',
                fontWeight: activeTab === tab ? 500 : 400,
                transition: 'all 0.2s ease'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Editor */}
      <main style={mainStyle}>
        <div style={mobileHeaderStyle}>
          <button
            type="button"
            onClick={openSidebar}
            style={mobileMenuButtonStyle}
          >
            ☰
          </button>
        </div>
        {/* Templates Tab - Virtual Card */}
        {activeTab === "templates" && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px', color: "black" }}>Choose Your Virtual Card Style</h3>
              {!virtualActivated && (
                <p style={{ color: '#86868b', fontSize: '15px' }}>
                  Complete Profile, Links, and Socials tabs before activating your virtual card
                </p>
              )}
              {virtualActivated && (
                <div style={{
                  display: 'inline-block',
                  background: '#000000',
                  color: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500
                }}>
                  Virtual Card Active
                </div>
              )}
            </div>

            {!isBasicInfoComplete() ? (
              <div style={{
                background: '#ffffff',
                border: '1px solid #e5e5e5',
                color: "black",
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: "black" }}>
                  Complete Your Basic Information First
                </h3>
                <p style={{ color: '#86868b', fontSize: '15px'}}>
                  Please fill out Profile, Links, and Socials tabs before choosing a template
                </p>
              </div>
            ) : (
              <>
                {(() => {
                  const socialArray = Object.entries(socials || {})
                    .filter(([_, url]) => Boolean(url))
                    .map(([platform, url]) => ({
                      platform,
                      url: typeof url === 'string' ? url : String(url),
                    }));
                  const filteredLinks = (links || []).filter((link) => link.title && link.url);
                  const selectedPreviewTemplate = previewTemplate || template || templateOptions[0].file;
                  const previewData: CardData = {
                    name: `${firstname} ${surname}`.trim() || 'Your Name',
                    title: title || '',
                    company,
                    phone: phone || '',
                    email: email || '',
                    bio,
                    address,
                    socials: socialArray,
                    links: filteredLinks,
                    headerBanner: headerBanner || undefined,
                    profilePic: profilePic ?? undefined,
                    template: selectedPreviewTemplate,
                  };

                  return (
                    <div style={templatePreviewGridStyle}>
                      <div
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e5e5e5',
                          borderRadius: '18px',
                          padding: '20px',
                          boxShadow: '0 20px 45px rgba(15,23,42,0.08)',
                        }}
                      >
                        <div style={{ marginBottom: '16px' }}>
                          <span style={{ fontSize: '12px', letterSpacing: '0.14em', color: '#667085' }}>
                            LIVE PREVIEW
                          </span>
                          <h4 style={{ margin: '8px 0 0', fontSize: '18px', fontWeight: 500, color: '#0f172a' }}>
                            {templateOptions.find((opt) => opt.file === selectedPreviewTemplate)?.name}
                          </h4>
                        </div>
                        <div
                          style={{
                            background: 'transparent',
                            borderRadius: '0',
                            padding: '0',
                            display: 'flex',
                            justifyContent: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: isSmallScreen ? '100%' : 'auto',
                              maxWidth: isSmallScreen ? '100%' : 'inherit',
                            }}
                          >
                            <VirtualPreview data={previewData} showSplash={false} />
                          </div>
                        </div>
                      </div>

                      <div style={templateListStyle}>
                        {templateOptions.map((option) => {
                          const isSelected = template === option.file;
                          return (
                            <button
                              key={option.file}
                              type="button"
                              onClick={() => {
                                setTemplate(option.file);
                                setPreviewTemplate(option.file);
                              }}
                              style={{
                                textAlign: 'left',
                                border: isSelected ? '2px solid #111827' : '1px solid #d0d5dd',
                                borderRadius: '16px',
                                background: '#ffffff',
                                boxShadow: isSelected
                                  ? '0 18px 40px rgba(17,24,39,0.12)'
                                  : '0 10px 24px rgba(17,24,39,0.05)',
                                padding: '20px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                                  {option.name}
                                </h5>
                                {isSelected && (
                                  <span style={{
                                    fontSize: '11px',
                                    letterSpacing: '0.14em',
                                    color: '#111827',
                                  }}>
                                    SELECTED
                                  </span>
                                )}
                              </div>
                              <p style={{ margin: 0, fontSize: '12px', letterSpacing: '0.12em', color: '#667085' }}>
                                {option.persona.toUpperCase()}
                              </p>
                              <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#475467', lineHeight: 1.5 }}>
                                {option.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <div style={templateActionRowStyle}>
                  <div style={{ fontSize: '13px', color: '#475467' }}>
                    {template
                      ? `Current selection: ${
                          templateOptions.find((opt) => opt.file === template)?.name || 'Template'
                        }`
                      : 'Choose a template to activate your virtual card.'}
                  </div>

                  <button
                    onClick={saveTemplateTab}
                    style={{
                      background: '#000000',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {virtualActivated ? 'Update Template' : 'Save & Activate Virtual Card'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Card Design Tab - Physical Card */}
        {activeTab === "card design" && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px', color: "black"  }}>Design Your Physical Card</h3>
              {!physicalActivated && (
                <p style={{ color: '#86868b', fontSize: '15px' }}>
                  Complete Profile, Links, and Socials tabs before designing your physical card
                </p>
              )}
              {physicalActivated && (
                <div style={{
                  display: 'inline-block',
                  background: '#000000',
                  color: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500
                }}>
                  Physical Card Active
                </div>
              )}
            </div>

            {!isBasicInfoComplete() ? (
              <div style={{
                background: '#ffffff',
                border: '1px solid #e5e5e5',
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: "black"  }}>
                  Complete Your Basic Information First
                </h3>
                <p style={{ color: '#86868b', fontSize: '15px' }}>
                  Please fill out Profile, Links, and Socials tabs before designing your physical card
                </p>
              </div>
            ) : (
              <PhysicalCardDesigner
                cardDesign={cardDesign}
                updateCardDesign={updateCardDesign}
                previewData={{
                  name: `${firstname} ${surname}`.trim() || 'Your Name',
                  title: title || '',
                  company: company || '',
                  phone: phone || '000 000 000',
                  email: email || 'hello@tapink.com',
                  bio,
                  address,
                  socials: Object.entries(socials || {})
                    .filter(([_, url]) => Boolean(url))
                    .map(([platform, url]) => ({
                      platform,
                      url: typeof url === 'string' ? url : String(url),
                    })),
                  links: links || [],
                  headerBanner: headerBanner || undefined,
                  profilePic: profilePic ?? undefined,
                  template: previewTemplate,
                }}
                profileUrl={profileUrl}
                physicalActivated={physicalActivated}
                onSave={saveCardDesignTab}
                onUploadLogo={(e) => handleFileUpload(e, 'card_logo')}
                uploadingLogo={cardLogoUploading}
              />
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div>
            <h3 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px', color: "black" }}>Edit Profile</h3>
            <h4 style={{ color: '#86868b', fontSize: '15px', marginBottom: '24px' }}>
              This information will be visible on your profile
            </h4>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: "black" }}>Header Banner</label>
              {headerBanner && (
                <div style={{ marginBottom: '10px' }}>
                  <img 
                    src={headerBanner} 
                    alt="Header preview" 
                    style={{
                      maxWidth: '100%', 
                      maxHeight: '150px',
                      objectFit: 'cover',
                      color: "black",
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
                style={{
                  padding: '12px',
                  border: '1px solid #d2d2d7',
                  borderRadius: '10px',
                  color: "black",
                  width: '100%'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: "black" }}>Profile Picture</label>
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
                style={{
                  padding: '12px',
                  border: '1px solid #d2d2d7',
                  color: "black",
                  borderRadius: '10px',
                  width: '100%'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: "black" }}>First Name</label>
              <input
                type="text"
                value={firstname}
                onChange={(e) => setFirstName(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: '1px solid #d2d2d7',
                  borderRadius: '10px',
                  color: "black",
                  width: '100%',
                  fontSize: '15px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: "black" }}>Surname</label>
              <input
                type="text"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: '1px solid #d2d2d7',
                  borderRadius: '10px',
                  color: "black",
                  width: '100%',
                  fontSize: '15px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: "black" }}>Pronouns</label>
              <Select
                options={options}
                value={options.find((option) => option.value === pronouns)}
                onChange={(selectedOption) => setPronouns(selectedOption?.value || '')}
                instanceId="pronouns-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: '#d2d2d7',
                    borderRadius: '10px',
                    backgroundColor: 'white',
                    color: 'black',
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: 'black',
                  }),
                  input: (base) => ({
                    ...base,
                    color: 'black',
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: 'white',
                    color: 'black',
                  }),
                  option: (base, state) => ({
                    ...base,
                    color: 'black',
                    backgroundColor: state.isFocused ? '#f5f5f7' : 'white',
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: '#888',
                  }),
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: "black" }}>Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: '1px solid #d2d2d7',
                  borderRadius: '10px',
                  color: "black",
                  width: '100%',
                  fontSize: '15px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: "black" }}>Mobile Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: '1px solid #d2d2d7',
                  borderRadius: '10px',
                  color: "black",
                  width: '100%',
                  fontSize: '15px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: "black" }}>Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: '1px solid #d2d2d7',
                  borderRadius: '10px',
                  color: "black",
                  width: '100%',
                  fontSize: '15px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: "black" }}>Job Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: '1px solid #d2d2d7',
                  borderRadius: '10px',
                  color: "black",
                  width: '100%',
                  fontSize: '15px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: "black" }}>Address</label>
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
                    style={{
                      padding: '12px 16px',
                      border: '1px solid #d2d2d7',
                      borderRadius: '10px',
                      color: "black",
                      width: '100%',
                      fontSize: '15px'
                    }}
                  />
                </Autocomplete>
              ) : (
                <p>Loading Google Places...</p>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: "black" }}>Bio</label>
              <textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: '1px solid #d2d2d7',
                  borderRadius: '10px',
                  color: "black",
                  width: '100%',
                  minHeight: '100px',
                  fontSize: '15px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                }}
              />
            </div>

            <button 
              onClick={saveProfileTab}
              style={{
                background: '#000000',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: 500,
                cursor: 'pointer',
                fontSize: '15px'
              }}
            >
              Save Profile
            </button>
          </div>
        )}

        {/* Links Tab */}
        {activeTab === "links" && (
          <div>
            <h3 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px', color: "black"}}>Add Links</h3>
            
            <div style={linkInputRowStyle}>
              <input
                type="text"
                placeholder="Link title"
                value={newLink.title}
                onChange={(e) =>
                  setNewLink({ ...newLink, title: e.target.value })
                }
                style={{
                  padding: '12px 16px',
                  border: '1px solid #d2d2d7',
                  borderRadius: '10px',
                  flex: 1,
                  color: "black",
                  fontSize: '15px'
                }}
              />
              <input
                type="url"
                placeholder="https://example.com"
                value={newLink.url}
                onChange={(e) =>
                  setNewLink({ ...newLink, url: e.target.value })
                }
                style={{
                  padding: '12px 16px',
                  border: '1px solid #d2d2d7',
                  borderRadius: '10px',
                  color: "black",
                  flex: 1,
                  fontSize: '15px'
                }}
              />
            </div>

            <button 
              onClick={addLink}
              style={{
                background: '#f5f5f7',
                color: '#000000',
                border: '1px solid #d2d2d7',
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: 500,
                cursor: 'pointer',
                marginBottom: '24px',
                fontSize: '15px'
              }}
            >
              + Add Link
            </button>

            <div style={{ marginBottom: '24px' }}>
              {links.length === 0 && (
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e5e5e5',
                  borderRadius: '16px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  color: "black",
                }}>
                  <p>No links added yet</p>
                </div>
              )}
              {links.map((l, i) => (
                <div 
                  key={i} 
                  style={linksListRowStyle(i === links.length - 1)}
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
                      fontWeight: 500
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={saveLinksTab}
              style={{
                background: '#000000',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: 500,
                cursor: 'pointer',
                fontSize: '15px'
              }}
            >
              Save Links
            </button>
          </div>
        )}

        {/* Socials Tab */}
        {activeTab === "socials" && (
          <div>
            <h3 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px', color: "black" }}>Social Links</h3>
            
            <div style={{ ...socialGridStyle, color: "black" }}>
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
                  onClick={() => {
                    if (socials[platform] === undefined) {
                      setSocials({ ...socials, [platform]: "" });
                    } else {
                      const updated = { ...socials };
                      delete updated[platform];
                      setSocials(updated);
                    }
                  }}
                  style={{
                    background: socials[platform] !== undefined ? '#f0f0f0' : '#ffffff',
                    border: '1px solid #e5e5e5',
                    borderRadius: '12px',
                    padding: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: "black",
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <SocialIcon platform={platform.toLowerCase()} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '24px' }}>
              {Object.entries(socials).map(([platform, url]) => (
                <div key={platform} style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: "black" }}>
                    {platform} URL
                  </label>
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
                    style={{
                      padding: '12px 16px',
                      border: '1px solid #d2d2d7',
                      borderRadius: '10px',
                      width: '100%',
                      color: "black",
                      fontSize: '15px'
                    }}
                  />
                </div>
              ))}
            </div>

            <button 
              onClick={saveSocialsTab}
              style={{
                background: '#000000',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: 500,
                cursor: 'pointer',
                fontSize: '15px'
              }}
            >
              Save Socials
            </button>
          </div>
        )}
      </main>

      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: notification.type === 'success' ? '#000000' : '#ef4444',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 9999
        }}>
          {notification.message}
        </div>
      )}
      {/* Profile Action Buttons */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'flex-end',
        zIndex: 1000
      }}>
        {designProfileId ? (
          <>
            <a
              href={`/user/${designProfileId}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                border: '1px solid #d2d2d7',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 500,
                color: '#000000',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
            >
              👁️ View Profile
            </a>

            <button
              onClick={() => setShowQRCode(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 500,
                color: '#ffffff',
                backgroundColor: '#000000',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              📱 Share Profile
            </button>
          </>
        ) : (
          <p style={{ 
            color: '#86868b', 
            fontSize: '13px',
            background: '#ffffff',
            padding: '12px 16px',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            margin: 0
          }}>
            Save your profile first
          </p>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRCode && designProfileId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowQRCode(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              padding: '40px',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
              maxWidth: '400px',
              width: '90%',
            }}
          >

            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: 600, 
              marginBottom: '24px',
              color: '#000000'
            }}>
              Share Your Profile
            </h3>

            <div
              style={{
                marginBottom: '20px',
                padding: '20px',
                background: '#f5f5f7',
                borderRadius: '12px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '200px',
                  height: '200px',
                  margin: '0 auto',
                  background: '#ffffff',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ProfileQRCode profileId={designProfileId} />
              </div>

              <p
                style={{
                  marginTop: '12px',
                  fontSize: '14px',
                  color: '#000',
                  fontWeight: 400,
                }}
              >
                Scan to view profile
              </p>

            </div>

            <p style={{
              fontSize: '13px',
              color: '#86868b',
              wordBreak: 'break-all',
              marginBottom: '20px',
              padding: '12px',
              background: '#f5f5f7',
              borderRadius: '8px'
            }}>
              {typeof window !== 'undefined' ? `${window.location.origin}/user/${designProfileId}` : ''}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={async () => {
                  if (typeof window !== "undefined") {
                    const profileUrl = `${window.location.origin}/user/${designProfileId}`;
                    try {
                      if (navigator?.clipboard?.writeText) {
                        await navigator.clipboard.writeText(profileUrl);
                      } else {
                        const tempInput = document.createElement("textarea");
                        tempInput.value = profileUrl;
                        tempInput.style.position = "fixed";
                        tempInput.style.opacity = "0";
                        document.body.appendChild(tempInput);
                        tempInput.focus();
                        tempInput.select();
                        document.execCommand("copy");
                        document.body.removeChild(tempInput);
                      }
                      showNotification("Profile link copied to clipboard!", "success");
                    } catch (error) {
                      console.error("Failed to copy profile link:", error);
                      showNotification("Unable to copy link. Please copy it manually.", "error");
                    }
                  }
                }}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '10px',
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
              >
                Copy Link
              </button>

              <button
                onClick={() => setShowQRCode(false)}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #d2d2d7',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
