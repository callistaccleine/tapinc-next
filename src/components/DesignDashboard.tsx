"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import Select from "react-select";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ProfileQRCode from "@/components/ProfileQRCode";
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

interface DesignDashboardProps {
  profile?: any;
}

export default function DesignDashboard({profile}: DesignDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "profile" | "links" | "socials" | "templates" | "card design"
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
  const [cardDesign, setCardDesign] = useState("");
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

  const templateMap: Record<string, string> = {
    "Template 1": "template1_blank.svg",
    "Template 2": "template2_blank.svg",
    "Template 3": "template3_blank.svg",
  };

  const cardDesignMap: Record<string, string> = {
    "Sunset": "/images/cards/Physical Card Option 1.png",
    "Sea": "/images/cards/Physical Card Option 2.png",
    "Flowery": "/images/cards/Physical Card Option 3.png",
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
          setTemplate(designData.template || "");
          setCardDesign(designData.cardDesign || "");
          setLinks(designData.links || []);
          setSocials(designData.socials || {});
          setAddress(designData.address || "");
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

  // Check if basic info is complete
  const isBasicInfoComplete = () => {
    return firstname && surname && email;
  };

  // Toggle activation
  const toggleActivation = async (type: 'physical' | 'virtual') => {
    if (!profile?.id) {
      showNotification("Profile not found", "error");
      return;
    }

    if (!isBasicInfoComplete()) {
      showNotification("Please complete Profile, Links, and Socials tabs first", "error");
      return;
    }

    try {
      const newStatus = type === 'physical' ? !physicalActivated : !virtualActivated;
      
      const { error } = await supabase
        .from("profiles")
        .update({
          [type === 'physical' ? 'physical_activated' : 'virtual_activated']: newStatus
        })
        .eq("id", profile.id);

      if (error) throw error;

      if (type === 'physical') {
        setPhysicalActivated(newStatus);
      } else {
        setVirtualActivated(newStatus);
      }

      showNotification(
        `${type === 'physical' ? 'Physical' : 'Virtual'} card ${newStatus ? 'activated' : 'deactivated'} successfully!`,
        "success"
      );
    } catch (error: any) {
      console.error("Error toggling activation:", error);
      showNotification("Failed to update activation status", "error");
    }
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
    fieldName: "profile_pic" | "header_banner"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
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

      const bucketName = fieldName === "profile_pic" ? "profile-pics" : "header-banner";
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

      await saveToDatabase({ [fieldName]: publicUrl });

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

  const addLink = () => {
    if (!newLink.title || !newLink.url) return;
    setLinks([...links, newLink]);
    setNewLink({ title: "", url: "" });
  };

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

  const saveTemplateTab = async () => {
    try {
      await saveToDatabase({ template });

      const hasTemplate = Boolean(template);
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

        if (!virtualActivated) {
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

  const saveCardDesignTab = async () => {
    try {
      await saveToDatabase({ cardDesign });
      await toggleActivation('physical');
    } catch (error) {
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

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '260px 1fr',
      minHeight: '100vh',
      background: '#f5f5f7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
    }}>
      {/* Sidebar */}
      <aside style={{
        background: '#ffffff',
        borderRight: '1px solid #e5e5e5',
        padding: '24px',
      }}>
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
          {["profile", "links", "socials", "templates", "card design"].map((tab) => (
            <li
              key={tab}
              onClick={() => setActiveTab(tab as any)}
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
      <main style={{ padding: '40px', overflowY: 'auto' }}>
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
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  {Object.keys(templateMap).map((templateName) => (
                    <div
                      key={templateName}
                      onClick={() => setTemplate(templateMap[templateName])}
                      style={{
                        background: '#ffffff',
                        border: template === templateMap[templateName] ? '2px solid #D3d3d3' : '1px solid #e5e5e5',
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <img
                        src={`/templates/${templateName}.png`}
                        alt={templateName}
                        style={{ width: '100%', borderRadius: '8px', marginBottom: '12px' }}
                      />
                      <p style={{ textAlign: 'center', fontWeight: 500, color: "black" }}>{templateName}</p>
                    </div>
                  ))}
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
                    cursor: 'pointer'
                  }}
                >
                  {virtualActivated ? 'Update & Save Template' : 'Save & Activate Virtual Card'}
                </button>
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
                  Please fill out Profile, Links, and Socials tabs before choosing a card design
                </p>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  {Object.entries(cardDesignMap).map(([designName, imagePath]) => (
                <div
                  key={designName}
                  onClick={() => setCardDesign(imagePath)}
                  style={{
                    background: '#ffffff',
                    border: cardDesign === imagePath ? '2px solid #D3d3d3' : '1px solid #e5e5e5',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <img
                    src={imagePath}
                    alt={designName}
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      objectFit: 'cover',
                    }}
                  />
                  <p style={{ textAlign: 'center', fontWeight: 500, color: "black" }}>
                    {designName}
                  </p>
                </div>
              ))}
                </div>

                <button 
                  onClick={saveCardDesignTab}
                  style={{
                    background: '#000000',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  {physicalActivated ? 'Update & Save Card Design' : 'Save & Activate Physical Card'}
                </button>
              </>
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
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
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
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: '12px',
              color: "black",
              marginBottom: '24px'
            }}>
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
                  if (typeof window !== 'undefined') {
                    const profileUrl = `${window.location.origin}/user/${designProfileId}`;
                    await navigator.clipboard.writeText(profileUrl);
                    showNotification('Profile link copied to clipboard!', 'success');
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
