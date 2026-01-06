"use client";

import { useState, useEffect, useRef, type CSSProperties, type ChangeEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import Select from "react-select";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, Palette, User } from "lucide-react";
import ProfileQRCode from "@/components/ProfileQRCode";
import VirtualPreview from "@/components/virtualcard_preview/VirtualPreview";
import AppleWalletPreview from "@/components/AppleWalletPreview";
import { CardData } from "@/types/CardData";
import {
  PhysicalCardDesigner,
  DEFAULT_CARD_DESIGN,
  CardDesignSettings,
  parseCardDesign,
  CardExportPayload,
} from "@/components/PhysicalCardDesigner";
import ImageCropperModal from "@/components/ImageCropperModal";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";

interface Link {
  title: string;
  url: string;
}

interface Socials {
  [platform: string]: string;
}

type DesignTab = "profile" | "design";

const SocialIcon = ({ platform }: { platform: string }) => (
  <NextImage 
    src={`/icons/${platform}.svg`} 
    width={20} 
    height={20} 
    alt={`${platform} icon`}
  />
);

interface DesignDashboardProps {
  profile?: any;
}

const MIN_LOGO_DPI = 299;
const FALLBACK_LOGO_MIN_EDGE_PX = 900;
const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const formatPhoneInput = (value: string) => {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return hasPlus ? "+" : "";
  if (hasPlus) {
    if (digits.startsWith("61")) {
      const country = "61";
      const rest = digits.slice(2);
      if (rest.startsWith("4")) {
        const first = rest.slice(0, 3);
        const remaining = rest.slice(3);
        const restGroups = remaining.match(/.{1,3}/g) ?? [];
        return `+${country} ${[first, ...restGroups].filter(Boolean).join(" ")}`.trim();
      }
      const groups = rest.match(/.{1,3}/g) ?? [];
      return `+${country} ${groups.join(" ")}`.trim();
    }
    const groups = digits.match(/.{1,3}/g) ?? [];
    return `+${groups.join(" ")}`;
  }
  if (digits.startsWith("0")) {
    const first = digits.slice(0, 4);
    const rest = digits.slice(4);
    const restGroups = rest.match(/.{1,3}/g) ?? [];
    return [first, ...restGroups].filter(Boolean).join(" ");
  }
  const groups = digits.match(/.{1,3}/g) ?? [];
  return groups.join(" ");
};
const normalizePhoneForSave = (value: string) => {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  return trimmed.startsWith("+") ? `+${digits}` : digits;
};
const DEFAULT_WALLET_DESIGN = {
  backgroundColor: "#000000",
  textColor: "#ffffff",
  accentColor: "#ff7a1c",
  showProfilePic: false,
};

const clampLogoDpi = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const readChunkType = (view: DataView, offset: number) =>
  String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3)
  );

const readPngDpi = (view: DataView): number | null => {
  let offset = 8;
  while (offset < view.byteLength) {
    const length = view.getUint32(offset);
    const type = readChunkType(view, offset + 4);
    if (type === "pHYs" && length >= 9) {
      const pxPerUnitX = view.getUint32(offset + 8);
      const pxPerUnitY = view.getUint32(offset + 12);
      const unit = view.getUint8(offset + 16);
      if (unit === 1) {
        const dpiX = pxPerUnitX * 0.0254;
        const dpiY = pxPerUnitY * 0.0254;
        return clampLogoDpi((dpiX + dpiY) / 2);
      }
      break;
    }
    offset += 12 + length;
  }
  return null;
};

const readJpegDpi = (view: DataView): number | null => {
  let offset = 2;
  while (offset + 1 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    offset += 2;
    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 1 >= view.byteLength) break;
    const segmentLength = view.getUint16(offset);
    if (segmentLength < 2) break;
    if (marker === 0xe0 && offset + segmentLength <= view.byteLength) {
      const identifier = String.fromCharCode(
        view.getUint8(offset + 2),
        view.getUint8(offset + 3),
        view.getUint8(offset + 4),
        view.getUint8(offset + 5),
        view.getUint8(offset + 6)
      );
      if (identifier === "JFIF\u0000" && segmentLength >= 14) {
        const units = view.getUint8(offset + 7);
        const xDensity = view.getUint16(offset + 8);
        const yDensity = view.getUint16(offset + 10);
        const base = clampLogoDpi((xDensity + yDensity) / 2);
        if (!base) return null;
        if (units === 1) {
          return base;
        }
        if (units === 2) {
          return base * 2.54; // dots per cm -> dpi
        }
        return null;
      }
    }
    offset += segmentLength;
  }
  return null;
};

const readImageDpi = async (file: File): Promise<number | null> => {
  const arrayBuffer = await file.arrayBuffer();
  const view = new DataView(arrayBuffer);
  const isPng = PNG_SIGNATURE.every((byte, index) => view.getUint8(index) === byte);
  if (isPng) {
    return readPngDpi(view);
  }
  const isJpeg = view.getUint8(0) === 0xff && view.getUint8(1) === 0xd8;
  if (isJpeg) {
    return readJpegDpi(view);
  }
  return null;
};

const parseWalletDesign = (raw: any) => {
  if (!raw) return DEFAULT_WALLET_DESIGN;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      backgroundColor:
        parsed.backgroundColor ?? parsed.background ?? DEFAULT_WALLET_DESIGN.backgroundColor,
      textColor: parsed.textColor ?? parsed.text ?? DEFAULT_WALLET_DESIGN.textColor,
      accentColor:
        parsed.accentColor ?? parsed.label ?? DEFAULT_WALLET_DESIGN.accentColor,
      showProfilePic:
        typeof parsed.showProfilePic === "boolean"
          ? parsed.showProfilePic
          : DEFAULT_WALLET_DESIGN.showProfilePic,
    };
  } catch (error) {
    console.warn("Failed to parse wallet design settings", error);
    return DEFAULT_WALLET_DESIGN;
  }
};

const getImageDimensions = (file: File): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => reject(new Error("Invalid image"));
      if (typeof reader.result === "string") {
        img.src = reader.result;
      } else {
        reject(new Error("Unsupported image format"));
      }
    };
    reader.readAsDataURL(file);
  });

const ensureCardLogoQuality = async (file: File) => {
  try {
    const dpi = await readImageDpi(file);
    if (dpi !== null && dpi < MIN_LOGO_DPI) {
      return {
        ok: false,
        reason: `Logo must be at least ${MIN_LOGO_DPI} DPI. Detected approximately ${Math.round(dpi)} DPI.`,
      };
    }

    if (dpi === null) {
      const { width, height } = await getImageDimensions(file);
      const longestEdge = Math.max(width, height);
      if (longestEdge < FALLBACK_LOGO_MIN_EDGE_PX) {
        return {
          ok: false,
          reason: `Logo image is too small (${width} x ${height}). Please upload a higher-resolution file (at least ${FALLBACK_LOGO_MIN_EDGE_PX}px on the longest side).`,
        };
      }
    }

    return { ok: true };
  } catch (error) {
    console.error("Logo DPI validation failed", error);
    return {
      ok: false,
      reason: "Unable to verify logo resolution. Please upload a PNG or JPEG exported at 300 DPI.",
    };
  }
};

const NAV_TABS: DesignTab[] = ["profile", "design"];
const TAB_ICONS: Record<DesignTab, typeof User> = {
  profile: User,
  design: Palette,
};
const DESIGN_STEP_TABS = [
  { key: "virtual", label: "Virtual", step: 1 as const },
  { key: "physical", label: "Physical", step: 2 as const },
  { key: "wallet", label: "Apple Wallet", step: 3 as const },
];

export default function DesignDashboard({profile}: DesignDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    DesignTab
  >("profile");
  const [isDesignNavOpen, setDesignNavOpen] = useState(false);
  
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
  const [cardLogoItems, setCardLogoItems] = useState<{ url: string; type: "logo" | "image" }[]>([]);
  const [showQRCode, setShowQRCode] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  // Activation state
  const [physicalActivated, setPhysicalActivated] = useState(false);
  const [virtualActivated, setVirtualActivated] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<string>("template1_blank.svg");
  const [cardLogoUploading, setCardLogoUploading] = useState(false);
  const [cardImageUploading, setCardImageUploading] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [isSmallScreen, setSmallScreen] = useState(false);
  const [defaultProfileId, setDefaultProfileId] = useState<string | null>(null);
  const [defaultDesignProfileId, setDefaultDesignProfileId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [designStep, setDesignStep] = useState<1 | 2 | 3>(1);
  const [walletBgColor, setWalletBgColor] = useState(DEFAULT_WALLET_DESIGN.backgroundColor);
  const [walletTextColor, setWalletTextColor] = useState(DEFAULT_WALLET_DESIGN.textColor);
  const [walletAccentColor, setWalletAccentColor] = useState(DEFAULT_WALLET_DESIGN.accentColor);
  const [walletShowProfilePic, setWalletShowProfilePic] = useState(DEFAULT_WALLET_DESIGN.showProfilePic);
  const [isWalletDownloading, setWalletDownloading] = useState(false);
  const walletAutoSaveTimeout = useRef<number | null>(null);
  const walletAutoSaveReady = useRef(false);
  const autoSaveTimeout = useRef<number | null>(null);
  const autoSaveReady = useRef(false);
  const lastAutoSaved = useRef<string>("");
  const [pendingCrop, setPendingCrop] = useState<{
    file: File;
    fieldName: "profile_pic" | "header_banner" | "card_logo";
    assetType: "logo" | "image";
  } | null>(null);
  const shareDesignProfileId = defaultDesignProfileId ?? designProfileId;
  const sharingDifferentProfile =
    Boolean(
      defaultDesignProfileId &&
        designProfileId &&
        defaultDesignProfileId !== designProfileId
    );
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [unlockedStep, setUnlockedStep] = useState<1 | 2 | 3>(3);
  const profileContentRef = useRef<HTMLDivElement>(null);
  const dismissOnboarding = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tapink_onboarding_seen_v1", "true");
    }
    setShowOnboarding(false);
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
  
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const selectedWalletLogo =
    cardDesign.logoUrl ||
    cardLogoItems.find((entry) => entry.type === "logo")?.url ||
    profilePic ||
    "/images/TAPINK_ICON_WHITE.png";

  const walletSerialNumber = `${shareDesignProfileId ?? profile?.id ?? "0000 1111 2222"}`;
  const walletPassPayload = {
    name: `${firstname} ${surname}`.trim() || "Your Name",
    company: company || "Your Company",
    title: title || "Your Title",
    barcodeMessage: profileUrl || "https://tapink.com.au",
    serialNumber: walletSerialNumber,
    logoUrl: selectedWalletLogo,
    profilePicUrl: walletShowProfilePic ? profilePic ?? undefined : undefined,
    colors: {
      background: walletBgColor,
      label: walletAccentColor,
      text: walletTextColor,
    },
  };

  const walletDesignPayload = {
    backgroundColor: walletBgColor,
    textColor: walletTextColor,
    accentColor: walletAccentColor,
    showProfilePic: walletShowProfilePic,
  };

  const saveWalletDesign = async () => {
    await saveToDatabase({ digital_wallet: walletDesignPayload });
  };

  useEffect(() => {
    if (loading || !profile?.id) return;
    if (!walletAutoSaveReady.current) {
      walletAutoSaveReady.current = true;
      return;
    }

    if (walletAutoSaveTimeout.current) {
      window.clearTimeout(walletAutoSaveTimeout.current);
    }

    walletAutoSaveTimeout.current = window.setTimeout(() => {
      saveWalletDesign().catch((err) => {
        console.error("Failed to auto-save wallet design", err);
      });
    }, 500);

    return () => {
      if (walletAutoSaveTimeout.current) {
        window.clearTimeout(walletAutoSaveTimeout.current);
      }
    };
  }, [walletBgColor, walletTextColor, walletAccentColor, walletShowProfilePic, loading, profile?.id]);

  useEffect(() => {
    if (loading || !profile?.id) return;

    const templateToSave = template || previewTemplate || templateOptions[0].file;
    const logosOnly = cardLogoItems.filter((entry) => entry.type === "logo");
    const imagesOnly = cardLogoItems.filter((entry) => entry.type === "image");
    const payload = {
      firstname,
      surname,
      pronouns,
      phone: normalizePhoneForSave(phone),
      company,
      title,
      email,
      bio,
      profile_pic: profilePic,
      header_banner: headerBanner,
      address,
      links,
      socials,
      template: templateToSave,
      cardDesign: JSON.stringify(cardDesign),
      physical_card_logo: logosOnly.map((entry) => `${entry.type}|${entry.url}`).join(","),
      images: imagesOnly.map((entry) => `${entry.type}|${entry.url}`).join(","),
      digital_wallet: {
        backgroundColor: walletBgColor,
        textColor: walletTextColor,
        accentColor: walletAccentColor,
        showProfilePic: walletShowProfilePic,
      },
    };
    const serialized = JSON.stringify(payload);

    if (!autoSaveReady.current) {
      autoSaveReady.current = true;
      lastAutoSaved.current = serialized;
      return;
    }

    if (serialized === lastAutoSaved.current) return;

    if (autoSaveTimeout.current) {
      window.clearTimeout(autoSaveTimeout.current);
    }

    autoSaveTimeout.current = window.setTimeout(() => {
      saveToDatabase(payload)
        .then(() => {
          lastAutoSaved.current = serialized;
        })
        .catch((err) => {
          console.error("Auto-save failed:", err);
        });
    }, 800);

    return () => {
      if (autoSaveTimeout.current) {
        window.clearTimeout(autoSaveTimeout.current);
      }
    };
  }, [
    loading,
    profile?.id,
    firstname,
    surname,
    pronouns,
    phone,
    company,
    title,
    email,
    bio,
    profilePic,
    headerBanner,
    address,
    links,
    socials,
    template,
    previewTemplate,
    cardDesign,
    cardLogoItems,
    walletBgColor,
    walletTextColor,
    walletAccentColor,
    walletShowProfilePic,
  ]);

  const handleWalletDownload = async () => {
    try {
      setWalletDownloading(true);
      try {
        await saveWalletDesign();
      } catch (err) {
        console.error("Failed to save wallet design", err);
        showNotification("Failed to save wallet design.", "error");
        return;
      }
      const response = await fetch("/api/wallet-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(walletPassPayload),
      });

      if (!response.ok) {
        let text = "";
        try {
          text = await response.clone().text();
          if (!text) {
            const json = await response.clone().json();
            text = json?.error || "";
          }
        } catch {
          // ignore parse errors
        }
        showNotification(text || "Failed to generate wallet pass.", "error");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "tapink-wallet.pkpass";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showNotification("Wallet pass downloaded.", "success");
    } catch (e) {
      console.error(e);
      showNotification("Failed to generate wallet pass.", "error");
    } finally {
      setWalletDownloading(false);
    }
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
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (sessionError || !user || !profile) {
          console.error("Session missing or user not found:", sessionError);
          router.replace("/auth");
          setLoading(false);
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
          setPhone(formatPhoneInput(designData.phone || ""));
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
          const storedLogos = designData.physical_card_logo;
          const storedImages = designData.images;
          const parseAssetList = (raw: any, fallbackType: "logo" | "image") => {
            if (Array.isArray(raw)) {
              return raw
                .filter((item: string) => Boolean(item))
                .map((entry: string) => {
                  const [typeRaw, ...urlParts] = entry.split("|");
                  if (urlParts.length) {
                    return { type: typeRaw === "logo" || typeRaw === "image" ? (typeRaw as "logo" | "image") : fallbackType, url: urlParts.join("|") };
                  }
                  return { type: fallbackType, url: typeRaw };
                });
            }
            if (typeof raw === "string") {
              return raw
                .split(",")
                .map((item: string) => item.trim())
                .filter(Boolean)
                .map((entry: string) => {
                  const [typeRaw, ...urlParts] = entry.split("|");
                  if (urlParts.length) {
                    return { type: typeRaw === "logo" || typeRaw === "image" ? (typeRaw as "logo" | "image") : fallbackType, url: urlParts.join("|") };
                  }
                  return { type: fallbackType, url: typeRaw };
                });
            }
            return [];
          };
          const logoList = parseAssetList(storedLogos, "logo").filter((item) => item.url);
          const imageList = parseAssetList(storedImages, "image").filter((item) => item.url);
          setCardLogoItems([...logoList, ...imageList]);
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
          const walletDesign = parseWalletDesign(designData.digital_wallet);
          setWalletBgColor(walletDesign.backgroundColor);
          setWalletTextColor(walletDesign.textColor);
          setWalletAccentColor(walletDesign.accentColor);
          setWalletShowProfilePic(walletDesign.showProfilePic);
        } else {
          setPreviewTemplate(templateOptions[0].file);
          setTemplate(templateOptions[0].file);
          setCardDesign({ ...DEFAULT_CARD_DESIGN });
          const profileFirst = profile?.firstname || profile?.first_name || "";
          const profileLast = profile?.surname || profile?.last_name || "";
          const profilePronouns = profile?.pronouns || "";
          const profilePhone = profile?.phone || "";
          const profileCompany = profile?.company || "";
          const profileEmail = profile?.email || user.email || "";
          if (profileFirst) setFirstName(profileFirst);
          if (profileLast) setSurname(profileLast);
          if (profilePronouns) setPronouns(profilePronouns);
          if (profilePhone) setPhone(formatPhoneInput(profilePhone));
          if (profileCompany) setCompany(profileCompany);
          if (profileEmail) setEmail(profileEmail);

          try {
            const { data: userRow, error: userRowError } = await supabase
              .from("users")
              .select("email, full_name, role")
              .eq("id", profile.id)
              .maybeSingle();

            if (userRowError) {
              console.error("Error fetching user profile:", userRowError);
            }

            const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
            const metadataFullName = typeof metadata.full_name === "string" ? metadata.full_name : "";
            const metadataPhone = typeof metadata.phone === "string" ? metadata.phone : "";
            const fullName = (userRow?.full_name || metadataFullName || "").trim();
            const nameParts = fullName.split(/\s+/).filter(Boolean);
            const derivedFirst = nameParts[0] || "";
            const derivedLast = nameParts.slice(1).join(" ");
            const derivedCompany =
              userRow?.role === "company" ? fullName : profileCompany;
            const derivedEmail = userRow?.email || profileEmail || user.email || "";
            const derivedPhone = metadataPhone || profilePhone;

            if (!profileFirst && derivedFirst) setFirstName(derivedFirst);
            if (!profileLast && derivedLast) setSurname(derivedLast);
            if (!profileCompany && derivedCompany) setCompany(derivedCompany);
            if (!profileEmail && derivedEmail) setEmail(derivedEmail);
            if (!profilePhone && derivedPhone) setPhone(formatPhoneInput(derivedPhone));

            const seedPayload = {
              firstname: derivedFirst || profileFirst,
              surname: derivedLast || profileLast,
              company: derivedCompany || profileCompany,
              email: derivedEmail,
              phone: normalizePhoneForSave(derivedPhone || profilePhone),
              template: templateOptions[0].file,
            };
            if (Object.values(seedPayload).some((value) => Boolean(value))) {
              await saveToDatabase(seedPayload);
            }
          } catch (err) {
            console.error("Failed to seed design profile:", err);
          }
        }

        // Fill any missing fields from the signed-in profile/user (without overwriting saved data)
        const profileFirst = profile?.firstname || profile?.first_name || "";
        const profileLast = profile?.surname || profile?.last_name || "";
        const profilePronouns = profile?.pronouns || "";
        const profilePhone = profile?.phone || "";
        const profileCompany = profile?.company || "";
        const profileEmail = profile?.email || user.email || "";
        if (!firstname && profileFirst) setFirstName(profileFirst);
        if (!surname && profileLast) setSurname(profileLast);
        if (!pronouns && profilePronouns) setPronouns(profilePronouns);
        if (!phone && profilePhone) setPhone(formatPhoneInput(profilePhone));
        if (!company && profileCompany) setCompany(profileCompany);
        if (!email && profileEmail) setEmail(profileEmail);

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
    if (loading) return;
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem("tapink_onboarding_seen_v1");
    if (!seen) {
      setShowOnboarding(true);
    }
  }, [loading]);

  useEffect(() => {
    if (template) {
      setPreviewTemplate(template);
    }
  }, [template]);

  useEffect(() => {
    if (shareDesignProfileId && typeof window !== "undefined") {
      setProfileUrl(`${window.location.origin}/user/${shareDesignProfileId}`);
    }
  }, [shareDesignProfileId]);

  useEffect(() => {
    const fetchDefaultProfile = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setDefaultProfileId(null);
          setDefaultDesignProfileId(null);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching default profile:", error);
          return;
        }

        if (data?.id) {
          setDefaultProfileId(data.id);
          const { data: designRow, error: designError } = await supabase
            .from("design_profile")
            .select("id")
            .eq("profile_id", data.id)
            .maybeSingle();

          if (designError && designError.code !== "PGRST116") {
            console.error("Error fetching default design profile:", designError);
          } else {
            setDefaultDesignProfileId(designRow?.id ?? null);
          }
        } else {
          setDefaultProfileId(null);
          setDefaultDesignProfileId(null);
        }
      } catch (err) {
        console.error("Unexpected default profile lookup error:", err);
        setDefaultProfileId(null);
        setDefaultDesignProfileId(null);
      }
    };

    fetchDefaultProfile();
  }, []);

  useEffect(() => {
    if (
      defaultProfileId &&
      profile?.id === defaultProfileId &&
      designProfileId &&
      defaultDesignProfileId !== designProfileId
    ) {
      setDefaultDesignProfileId(designProfileId);
    }
  }, [defaultProfileId, profile?.id, designProfileId, defaultDesignProfileId]);

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
  
      const now = new Date().toISOString();
      const payload: Record<string, any> = {
        profile_id: profile.id,
        email: email || user.email || "",
        ...fields,
        updated_at: now,
      };
      if (!designProfileId) {
        payload.created_at = now;
      }

      const { data, error } = await supabase
        .from("design_profile")
        .upsert(payload, { onConflict: "profile_id" })
        .select("*")
        .single();
  
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

  const getCropAspectRatio = (_fieldName: "profile_pic" | "header_banner" | "card_logo") => undefined;

  const processUpload = async (
    file: File,
    fieldName: "profile_pic" | "header_banner" | "card_logo",
    assetType: "logo" | "image" = "logo"
  ) => {
    try {
      if (fieldName === "card_logo") {
        if (assetType === "image") {
          setCardImageUploading(true);
        } else {
          setCardLogoUploading(true);
        }
      }
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user || !profile?.id) {
        showNotification("Not logged in or profile not found!", "error");
        return;
      }

      if (fieldName === "card_logo" && assetType === "logo") {
        const qualityCheck = await ensureCardLogoQuality(file);
        if (!qualityCheck.ok) {
          showNotification(qualityCheck.reason || "Logo must be exported at 300 DPI.", "error");
          return;
        }
      }

      showNotification("Uploading image...", "success");

      const bucketName =
        fieldName === "profile_pic"
          ? "profile-pics"
          : fieldName === "header_banner"
          ? "header-banner"
          : "card-logo";
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        showNotification(`Upload failed: ${uploadError.message}`, "error");
        return;
      }

      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      if (fieldName === "profile_pic") {
        setProfilePic(publicUrl);
        await saveToDatabase({ profile_pic: publicUrl });
      } else if (fieldName === "header_banner") {
        setHeaderBanner(publicUrl);
        await saveToDatabase({ header_banner: publicUrl });
      } else {
        const updatedAssets = [...cardLogoItems, { url: publicUrl, type: assetType }];
        setCardLogoItems(updatedAssets);
        if (assetType === "logo") {
          updateCardDesign({ logoUrl: publicUrl });
        }
        const logosOnly = updatedAssets.filter((entry) => entry.type === "logo");
        const imagesOnly = updatedAssets.filter((entry) => entry.type === "image");
        await saveToDatabase({
          physical_card_logo: logosOnly.map((entry) => `${entry.type}|${entry.url}`).join(","),
          images: imagesOnly.map((entry) => `${entry.type}|${entry.url}`).join(","),
        });
        showNotification(
          assetType === "logo"
            ? "Logo uploaded and linked to your card design."
            : "Image uploaded and added to your library.",
          "success"
        );
        return;
      }

      showNotification("Image uploaded successfully!", "success");
    } catch (err: any) {
      console.error("Upload error:", err);
      showNotification(err.message || "Upload failed", "error");
    } finally {
      if (fieldName === "card_logo") {
        if (assetType === "image") {
          setCardImageUploading(false);
        } else {
          setCardLogoUploading(false);
        }
      }
    }
  };

  const handleFileUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    fieldName: "profile_pic" | "header_banner" | "card_logo",
    assetType: "logo" | "image" = "logo"
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      showNotification("Please upload an image file", "error");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showNotification("File size must be less than 5MB", "error");
      return;
    }

    setPendingCrop({ file, fieldName, assetType });
  };

  const handleCropCancel = () => setPendingCrop(null);

  const handleCropComplete = async (blob: Blob) => {
    if (!pendingCrop) return;
    const ext = blob.type.includes("png") ? "png" : "jpg";
    const nameWithoutExt = pendingCrop.file.name.replace(/\.[^.]+$/, "");
    const croppedFile = new File([blob], `${nameWithoutExt}-cropped.${ext}`, {
      type: blob.type || pendingCrop.file.type,
      lastModified: Date.now(),
    });
    await processUpload(croppedFile, pendingCrop.fieldName, pendingCrop.assetType);
    setPendingCrop(null);
  };

  const handleRemoveAsset = async (url: string) => {
    const filtered = cardLogoItems.filter((entry) => entry.url !== url);
    setCardLogoItems(filtered);
    if (cardDesign.logoUrl === url) {
      updateCardDesign({ logoUrl: null });
    }
    const logosOnly = filtered.filter((entry) => entry.type === "logo");
    const imagesOnly = filtered.filter((entry) => entry.type === "image");
    await saveToDatabase({
      physical_card_logo: logosOnly.map((entry) => `${entry.type}|${entry.url}`).join(","),
      images: imagesOnly.map((entry) => `${entry.type}|${entry.url}`).join(","),
    });
    showNotification("Image removed from your library.", "success");
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
        phone: normalizePhoneForSave(phone),
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
            "Template saved. Complete Profile, Links, and Socials steps before activating your virtual card.",
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
          message += " Assets exported to our team.";
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
    gridTemplateColumns: isMobileLayout ? undefined : "120px 1fr",
    minHeight: "100vh",
    background: "#ffffff",
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    position: "relative",
  };

  const sidebarStyle: CSSProperties = {
    background: "#ffffff",
    borderRight: isMobileLayout ? "none" : "1px solid #e5e5e5",
    padding: "12px 8px",
    position: isMobileLayout ? "fixed" : "relative",
    top: 0,
    left: 0,
    height: isMobileLayout ? "100vh" : "auto",
    minHeight: isMobileLayout ? undefined : "100%",
    alignSelf: "stretch",
    width: isMobileLayout ? "64vw" : "auto",
    minWidth: isMobileLayout ? "auto" : "120px",
    maxWidth: isMobileLayout ? "240px" : "160px",
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
    background: "#ffffff",
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
  const guideButtonStyle: CSSProperties = {
    border: "1px solid #d0d5dd",
    background: "#ffffff",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    color: "#0f172a",
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
      {showOnboarding && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            zIndex: 5000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              padding: "24px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 28px 80px rgba(15,23,42,0.25)",
              border: "1px solid #e5e7eb",
              color: "#0f172a",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>Welcome to TapINK</h2>
              <button
                type="button"
                onClick={dismissOnboarding}
                style={{ border: "none", background: "transparent", fontSize: "18px", cursor: "pointer", color: "#0f172a" }}
                aria-label="Close welcome"
              >
                ×
              </button>
            </div>
            <p style={{ margin: 0, color: "#475467" }}>
              Start designing and customising your digital card. Complete your profile, then jump into the designer.
            </p>
            <ol style={{ margin: "0 0 8px 16px", padding: 0, color: "#1f2937", lineHeight: 1.6 }}>
              <li>Go to <strong>Profile</strong> and add your name, phone, company, and title.</li>
              <li>Hit <strong>Design</strong> to customise layouts, colours, and logos.</li>
            </ol>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap", marginTop: "4px" }}>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("profile");
                  dismissOnboarding();
                }}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #d0d5dd",
                  background: "#ffffff",
                  color: "#0f172a",
                  minWidth: "120px",
                  cursor: "pointer",
                }}
              >
                Fill profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("design");
                  dismissOnboarding();
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #ff8b37, #ff5700)",
                  color: "#ffffff",
                  minWidth: "150px",
                  cursor: "pointer",
                }}
              >
                Start designing
              </button>
            </div>
          </div>
        </div>
      )}
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
            padding: '6px 10px',
            cursor: 'pointer',
            color: "black",
            marginBottom: '16px',
            fontSize: '16px',
            display: "block",
            marginLeft: "auto",
            marginRight: "auto"
          }}
        >
          ←
        </button>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", alignItems: "stretch" }}>
          {NAV_TABS.map((tab) => {
            const isDesign = tab === "design";
            const isActive = activeTab === tab;
            return (
              <li key={tab} style={{ width: "100%" }}>
                <button
                  type="button"
                  onClick={() => {
                    if (tab === "design") {
                      if (activeTab !== "design") {
                        setActiveTab("design");
                        setDesignNavOpen(true);
                      } else {
                        setDesignNavOpen((prev) => !prev);
                      }
                    } else {
                      setActiveTab(tab);
                      if (isMobileLayout) {
                        setSidebarOpen(false);
                      }
                    }
                  }}
                  aria-label={tab === "profile" ? "Profile" : "Design"}
                  style={{
                    width: "100%",
                    height: "40px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    color: isActive ? "#ff7a1c" : "#111827",
                    background: isActive ? "rgba(255, 122, 28, 0.14)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 12px",
                    transition: "all 0.2s ease",
                    fontSize: "13px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    {(() => {
                      const Icon = TAB_ICONS[tab];
                      return <Icon size={18} strokeWidth={2} />;
                    })()}
                    <span>{tab === "profile" ? "Profile" : "Design"}</span>
                  </span>
                  {isDesign && (
                    <ChevronDown
                      size={16}
                      strokeWidth={2}
                      style={{
                        transform: isDesignNavOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                        marginLeft: "12px",
                      }}
                    />
                  )}
                </button>
                {isDesign && isDesignNavOpen && (
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: "6px 0 0",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    {DESIGN_STEP_TABS.map(({ key, label, step }) => (
                      <li key={key} style={{ width: "100%" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("design");
                            setDesignNavOpen(true);
                            setDesignStep(step);
                            if (typeof window !== "undefined") {
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }
                            if (isMobileLayout) {
                              setSidebarOpen(false);
                            }
                          }}
                          aria-label={label}
                          style={{
                            width: "100%",
                            height: "36px",
                            borderRadius: "10px",
                            border: "none",
                            cursor: "pointer",
                            color: designStep === step ? "#ff7a1c" : "#111827",
                            background: designStep === step ? "rgba(255, 122, 28, 0.14)" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            padding: "0 12px 0 24px",
                            fontSize: "12px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span>{label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
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
          <button
            type="button"
            onClick={() => setShowOnboarding(true)}
            style={guideButtonStyle}
          >
            Show guide
          </button>
        </div>
        {!isMobileLayout && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              style={guideButtonStyle}
            >
              Show guide
            </button>
          </div>
        )}
        {/* Design Tab - Virtual & Physical */}
        {activeTab === "design" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div
              style={{
                display: "flex",
                gap: "14px",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
                flexWrap: "wrap",
                position: "sticky",
                top: isMobileLayout ? 10 : 12,
                zIndex: 5,
                background: "#ffffff",
                padding: "6px 0",
              }}
            >
              {[
                { key: "virtual", label: "Virtual card" },
                { key: "physical", label: "Physical card" },
                { key: "wallet", label: "Apple Wallet" },
              ].map((step, idx, arr) => {
                const stepIndex = (idx + 1) as 1 | 2 | 3;
                const isActive = designStep === stepIndex;
                return (
                  <div key={step.key} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setDesignStep(stepIndex);
                        if (typeof window !== "undefined") {
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "6px 10px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: isActive
                            ? "linear-gradient(135deg, #ff8b37, #ff6a00)"
                            : "linear-gradient(135deg, #ffb26f, #ff9c4d)",
                          border: "1px solid " + (isActive ? "#ff7a1c" : "#ffad66"),
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 16,
                          boxShadow: isActive ? "0 10px 20px rgba(255,106,0,0.25)" : "none",
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span
                        style={{
                          color: isActive ? "#ff7a1c" : "#334155",
                          fontWeight: 600,
                          fontSize: 15,
                        }}
                      >
                        {step.label}
                      </span>
                    </button>
                    {idx < arr.length - 1 && (
                      <div style={{ width: 50, height: 2, background: "#e2e8f0", borderRadius: 999 }} aria-hidden />
                    )}
                  </div>
                );
              })}
            </div>

            {designStep === 1 && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px', color: "black" }}>Choose Your Virtual Card Style</h3>
                  {!virtualActivated && (
                    <p style={{ color: '#86868b', fontSize: '15px' }}>
                      Complete Profile, Links, and Socials steps before activating your virtual card
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
                      Please fill out Profile, Links, and Socials steps before choosing a template
                    </p>
                  </div>
                ) : (
                  (() => {
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                            <div style={{ fontSize: '13px', color: '#475467', textAlign: 'center' }}>
                              {template
                                ? `Current selection: ${
                                    templateOptions.find((opt) => opt.file === template)?.name || 'Template'
                                  }`
                                : 'Choose a template to activate your virtual card.'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {designStep === 2 && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px', color: "black"  }}>Design Your Physical Card</h3>
                  {!physicalActivated && (
                    <p style={{ color: '#86868b', fontSize: '15px' }}>
                      Complete Profile, Links, and Socials steps before designing your physical card
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
                      Please fill out Profile, Links, and Socials steps before designing your physical card
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
                    designProfileId={shareDesignProfileId}
                    logoItems={cardLogoItems}
                    onRemoveAsset={handleRemoveAsset}
                    profileId={profile?.id ?? null}
                    physicalActivated={physicalActivated}
                    onSave={saveCardDesignTab}
                    onSaveDesign={() => saveCardDesignTab()}
                    onUploadLogo={(e, type) => Promise.resolve(handleFileUpload(e, 'card_logo', type ?? 'logo'))}
                    uploadingLogo={cardLogoUploading}
                  />
                )}
              </div>
            )}

            {designStep === 3 && (
              <div>
                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "28px", fontWeight: 600, marginBottom: "8px", color: "black" }}>
                    Apple Wallet Pass
                  </h3>
                  <p style={{ color: "#86868b", fontSize: "15px" }}>
                    Personalize your Apple Wallet pass and download it straight to your device.
                  </p>
                </div>

                {!isBasicInfoComplete() ? (
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e5e5",
                      borderRadius: "16px",
                      padding: "48px 24px",
                      textAlign: "center",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                    }}
                  >
                    <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px", color: "black" }}>
                      Complete Your Basic Information First
                    </h3>
                    <p style={{ color: "#86868b", fontSize: "15px" }}>
                      Please fill out Profile, Links, and Socials steps before creating a wallet pass.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isSmallScreen ? "1fr" : "minmax(0,1fr) 340px",
                      gap: isSmallScreen ? "16px" : "24px",
                      alignItems: isSmallScreen ? "stretch" : "start",
                    }}
                  >
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 14,
                        padding: "16px",
                        display: "grid",
                        gap: 14,
                      }}
                    >
                      <h4 style={{ margin: 0, fontSize: 15, color: "#0f172a" }}>Branding & Colours</h4>
                      <div style={{ display: "grid", gap: 8 }}>
                        <label style={{ fontSize: 12, color: "#475467", fontWeight: 600 }}>Background colour</label>
                        <input
                          type="color"
                          value={walletBgColor}
                          onChange={(e) => setWalletBgColor(e.target.value)}
                          style={{ width: 64, height: 36, border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer" }}
                        />
                      </div>
                      <div style={{ display: "grid", gap: 8 }}>
                        <label style={{ fontSize: 12, color: "#475467", fontWeight: 600 }}>Font colour</label>
                        <input
                          type="color"
                          value={walletTextColor}
                          onChange={(e) => setWalletTextColor(e.target.value)}
                          style={{ width: 64, height: 36, border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer" }}
                        />
                      </div>
                      <div style={{ display: "grid", gap: 8 }}>
                        <label style={{ fontSize: 12, color: "#475467", fontWeight: 600 }}>Accent colour</label>
                        <input
                          type="color"
                          value={walletAccentColor}
                          onChange={(e) => setWalletAccentColor(e.target.value)}
                          style={{ width: 64, height: 36, border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer" }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          fontSize: 12,
                          color: "#475467",
                          fontWeight: 600,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setWalletShowProfilePic((prev) => !prev)}
                          aria-pressed={walletShowProfilePic}
                          style={{
                            width: 42,
                            height: 24,
                            borderRadius: 999,
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            background: walletShowProfilePic ? "#ff7a1c" : "#cbd5e1",
                            position: "relative",
                            transition: "background 0.2s ease",
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              top: 2,
                              left: walletShowProfilePic ? 20 : 2,
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              background: "#ffffff",
                              boxShadow: "0 2px 6px rgba(15,23,42,0.2)",
                              transition: "left 0.2s ease",
                            }}
                          />
                        </button>
                        <span>Show profile photo</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                        Uses your profile name, company, and title. Banner/logo assets come from your profile media.
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        alignItems: isSmallScreen ? "stretch" : "flex-start",
                      }}
                    >
                      <AppleWalletPreview
                        name={walletPassPayload.name}
                        company={walletPassPayload.company}
                        title={walletPassPayload.title}
                        barcodeMessage={walletPassPayload.barcodeMessage}
                        serialNumber={walletPassPayload.serialNumber}
                        logoUrl={walletPassPayload.logoUrl}
                        profilePicUrl={walletPassPayload.profilePicUrl}
                        showProfilePic={walletShowProfilePic}
                        backgroundColor={walletPassPayload.colors.background}
                        textColor={walletPassPayload.colors.text}
                        labelColor={walletPassPayload.colors.label}
                      />
                      <button
                        type="button"
                        onClick={handleWalletDownload}
                        disabled={isWalletDownloading}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 10,
                          padding: "12px 16px",
                          borderRadius: 12,
                          background: "linear-gradient(135deg, #000000, #111827)",
                          color: "#ffffff",
                          textDecoration: "none",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
                          border: "none",
                          cursor: isWalletDownloading ? "not-allowed" : "pointer",
                          opacity: isWalletDownloading ? 0.7 : 1,
                          width: isSmallScreen ? "100%" : "auto",
                        }}
                      >
                        <span style={{ fontSize: 18, lineHeight: 1 }}></span>
                        <span>{isWalletDownloading ? "Generating..." : "Add to Apple Wallet"}</span>
                      </button>
                      <div
                        style={{
                          maxWidth: isSmallScreen ? "100%" : 340,
                          color: "#475467",
                          fontSize: 14,
                          lineHeight: 1.5,
                        }}
                      >
                        Download the pass on your iPhone to add it to Apple Wallet.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div ref={profileContentRef}>
            <h3 style={{ fontSize: "28px", fontWeight: 600, marginBottom: "8px", color: "black" }}>Edit Profile</h3>
            <h4 style={{ color: "#86868b", fontSize: "15px", marginBottom: "24px" }}>
              This information will be visible on your profile
            </h4>
            {(() => {
              const steps = [
                { key: "profile", label: "Profile", done: Boolean(firstname || surname || phone || email) },
                { key: "links", label: "Links", done: links.length > 0 },
                { key: "socials", label: "Socials", done: Object.keys(socials || {}).length > 0 },
              ];
              return (
                <div
                  style={{
                    display: "flex",
                    gap: "18px",
                    alignItems: "center",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                    position: "sticky",
                    top: isMobileLayout ? 10 : 12,
                    zIndex: 5,
                    background: "#ffffff",
                    padding: "6px 0",
                  }}
                >
                  {steps.map((step, idx) => {
                    const stepNumber = (idx + 1) as 1 | 2 | 3;
                    const isLocked = stepNumber > unlockedStep;
                    const isActive = activeStep === stepNumber;
                    return (
                      <div key={step.key} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (isLocked) return;
                            setActiveStep(stepNumber);
                            profileContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                          disabled={isLocked}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "6px 10px",
                            border: "none",
                            background: "transparent",
                            cursor: isLocked ? "not-allowed" : "pointer",
                          }}
                        >
                          <span
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: "50%",
                              background: isActive
                                ? "linear-gradient(135deg, #ff8b37, #ff6a00)"
                                : "linear-gradient(135deg, #ffb26f, #ff9c4d)",
                              border: "1px solid " + (isActive ? "#ff7a1c" : "#ffad66"),
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 16,
                              boxShadow: isActive ? "0 10px 20px rgba(255,106,0,0.25)" : "none",
                            }}
                          >
                            {idx + 1}
                          </span>
                          <span
                            style={{
                              color: isActive ? "#ff7a1c" : "#334155",
                              fontWeight: 600,
                              fontSize: 15,
                              opacity: isLocked ? 0.6 : 1,
                            }}
                          >
                            {step.label}
                          </span>
                        </button>
                        {idx < steps.length - 1 && (
                          <div
                            style={{
                              width: 50,
                              height: 2,
                              background: "#e2e8f0",
                              borderRadius: 999,
                              opacity: isLocked ? 0.5 : 1,
                            }}
                            aria-hidden
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {activeStep === 1 && (
              <div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "black" }}>Header Banner</label>
                  {headerBanner && (
                    <div style={{ marginBottom: "10px" }}>
                      <img
                        src={headerBanner}
                        alt="Header preview"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "150px",
                          objectFit: "cover",
                          color: "black",
                          borderRadius: "8px",
                          border: "1px solid #e5e5e5",
                        }}
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "header_banner")}
                    style={{
                      padding: "12px",
                      border: "1px solid #d2d2d7",
                      borderRadius: "10px",
                      color: "black",
                      width: "100%",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "black" }}>Profile Picture</label>
                  {profilePic && (
                    <div style={{ marginBottom: "10px" }}>
                      <img
                        src={profilePic}
                        alt="Profile preview"
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "cover",
                          borderRadius: "50%",
                          border: "2px solid #e5e5e5",
                        }}
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "profile_pic")}
                    style={{
                      padding: "12px",
                      border: "1px solid #d2d2d7",
                      color: "black",
                      borderRadius: "10px",
                      width: "100%",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "black" }}>First Name</label>
                  <input
                    type="text"
                    value={firstname}
                    onChange={(e) => setFirstName(e.target.value)}
                    style={{
                      padding: "12px 16px",
                      border: "1px solid #d2d2d7",
                      borderRadius: "10px",
                      color: "black",
                      width: "100%",
                      fontSize: "15px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "black" }}>Surname</label>
                  <input
                    type="text"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    style={{
                      padding: "12px 16px",
                      border: "1px solid #d2d2d7",
                      borderRadius: "10px",
                      color: "black",
                      width: "100%",
                      fontSize: "15px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "black" }}>Pronouns</label>
                  <Select
                    options={options}
                    value={options.find((option) => option.value === pronouns)}
                    onChange={(selectedOption) => setPronouns(selectedOption?.value || "")}
                    instanceId="pronouns-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: "#d2d2d7",
                        borderRadius: "10px",
                        backgroundColor: "white",
                        color: "black",
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: "black",
                      }),
                      input: (base) => ({
                        ...base,
                        color: "black",
                      }),
                      menu: (base) => ({
                        ...base,
                        backgroundColor: "white",
                        color: "black",
                      }),
                      option: (base, state) => ({
                        ...base,
                        color: "black",
                        backgroundColor: state.isFocused ? "#f5f5f7" : "white",
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: "#888",
                      }),
                    }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "black" }}>Email</label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      padding: "12px 16px",
                      border: "1px solid #d2d2d7",
                      borderRadius: "10px",
                      color: "black",
                      width: "100%",
                      fontSize: "15px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "black" }}>Mobile Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                    style={{
                      padding: "12px 16px",
                      border: "1px solid #d2d2d7",
                      borderRadius: "10px",
                      color: "black",
                      width: "100%",
                      fontSize: "15px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "black" }}>Company</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    style={{
                      padding: "12px 16px",
                      border: "1px solid #d2d2d7",
                      borderRadius: "10px",
                      color: "black",
                      width: "100%",
                      fontSize: "15px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "black" }}>Job Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                      padding: "12px 16px",
                      border: "1px solid #d2d2d7",
                      borderRadius: "10px",
                      color: "black",
                      width: "100%",
                      fontSize: "15px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "black" }}>Address</label>
                  {isLoaded ? (
                    <Autocomplete onLoad={(autocompleteInstance) => setAutocomplete(autocompleteInstance)} onPlaceChanged={handlePlaceChanged}>
                      <input
                        type="text"
                        placeholder="Search for an address..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        style={{
                          padding: "12px 16px",
                          border: "1px solid #d2d2d7",
                          borderRadius: "10px",
                          color: "black",
                          width: "100%",
                          fontSize: "15px",
                        }}
                      />
                    </Autocomplete>
                  ) : (
                    <p>Loading Google Places...</p>
                  )}
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "black" }}>Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    style={{
                      padding: "12px 16px",
                      border: "1px solid #d2d2d7",
                      borderRadius: "10px",
                      color: "black",
                      width: "100%",
                      minHeight: "100px",
                      fontSize: "15px",
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    }}
                  />
                </div>

              </div>
            )}

            {activeStep === 2 && unlockedStep >= 2 && (
              <div style={{ marginTop: "12px" }}>
                <h3 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px", color: "black" }}>Step 2: Add Links</h3>
                <p style={{ color: "#667085", marginTop: 0, marginBottom: "16px" }}>
                  Curate quick actions to your website, LinkedIn, booking page, or any URL.
                </p>

                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e5e5",
                    borderRadius: "16px",
                    padding: "16px",
                    boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
                    marginBottom: "16px",
                    display: "grid",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "grid", gap: 8 }}>
                    <label style={{ fontWeight: 600, color: "#0f172a", fontSize: 14 }}>Link title</label>
                    <input
                      type="text"
                      placeholder="e.g. Portfolio, Book a call, LinkedIn"
                      value={newLink.title}
                      onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                      style={{
                        padding: "12px 14px",
                        border: "1px solid #d2d2d7",
                        borderRadius: "10px",
                        color: "black",
                        fontSize: "15px",
                      }}
                    />
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <label style={{ fontWeight: 600, color: "#0f172a", fontSize: 14 }}>URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com/your-link"
                      value={newLink.url}
                      onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                      style={{
                        padding: "12px 14px",
                        border: "1px solid #d2d2d7",
                        borderRadius: "10px",
                        color: "black",
                        fontSize: "15px",
                      }}
                    />
                  </div>
                  <button
                    onClick={addLink}
                    style={{
                      background: "linear-gradient(135deg,#ff8b37,#ff6a00)",
                      color: "#ffffff",
                      border: "none",
                      padding: "12px 18px",
                      borderRadius: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "15px",
                      boxShadow: "0 12px 24px rgba(255,106,0,0.25)",
                      justifySelf: "flex-start",
                    }}
                  >
                    + Add link
                  </button>
                </div>

                <div style={{ display: "grid", gap: 12, marginBottom: "16px" }}>
                  {links.length === 0 && (
                    <div
                      style={{
                        background: "#ffffff",
                        border: "1px dashed #d0d5dd",
                        borderRadius: "14px",
                        padding: "28px 18px",
                        textAlign: "center",
                        color: "#475467",
                      }}
                    >
                      No links yet. Add your first link above.
                    </div>
                  )}
                  {links.map((l, i) => (
                    <div
                      key={`${l.title}-${i}`}
                      style={{
                        border: "1px solid #e5e5e5",
                        borderRadius: "14px",
                        padding: "14px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        background: "#ffffff",
                        boxShadow: "0 6px 14px rgba(15,23,42,0.05)",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <p style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {l.title}
                          </p>
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
                              padding: "6px",
                              fontWeight: 600,
                            }}
                            aria-label={`Remove ${l.title}`}
                          >
                            ✕
                          </button>
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", color: "#64748b", wordBreak: "break-all" }}>{l.url}</p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

{activeStep === 3 && unlockedStep >= 3 && (
              <div style={{ marginTop: "12px" }}>
                <h3 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px", color: "black" }}>Step 3: Social Links</h3>

                <div style={{ ...socialGridStyle, color: "black" }}>
                  {["X", "Instagram", "Linkedin", "Facebook", "Youtube", "Discord", "Twitch", "Whatsapp", "Github"].map((platform) => (
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
                        background:
                          socials[platform] !== undefined
                            ? "linear-gradient(135deg, #ff9f4d, #ff7a1c)"
                            : "#ffffff",
                        border: socials[platform] !== undefined ? "1px solid #ff8b37" : "1px solid #e5e5e5",
                        color: socials[platform] !== undefined ? "#ffffff" : "#000000",
                        borderRadius: "12px",
                        padding: "20px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                        boxShadow: socials[platform] !== undefined ? "0 10px 20px rgba(255, 122, 28, 0.25)" : "none",
                      }}
                    >
                      <SocialIcon platform={platform.toLowerCase()} />
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: "24px" }}>
                  {Object.entries(socials).map(([platform, url]) => (
                    <div key={platform} style={{ marginBottom: "20px" }}>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "black" }}>{platform} URL</label>
                      <input
                        type="url"
                        placeholder={`Enter your ${platform} URL`}
                        value={url}
                        onChange={(e) => {
                          const inputUrl = e.target.value.trim();
                          let normalizedUrl = inputUrl;

                          if (inputUrl && !inputUrl.startsWith("http://") && !inputUrl.startsWith("https://")) {
                            normalizedUrl = `https://www.${inputUrl}`;
                          }

                          setSocials({ ...socials, [platform]: normalizedUrl });
                        }}
                        style={{
                          padding: "12px 16px",
                          border: "1px solid #d2d2d7",
                          borderRadius: "10px",
                          width: "100%",
                          color: "black",
                          fontSize: "15px",
                        }}
                      />
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>
        )}
      </main>

      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: notification.type === 'success'
            ? 'linear-gradient(135deg, #ff9952 0%, #ff7a1c 100%)'
            : '#ef4444',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: notification.type === 'success'
            ? '0 20px 40px rgba(255, 122, 28, 0.35)'
            : '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
          transition: 'all 0.2s ease'
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
        {shareDesignProfileId ? (
          <>
            <a
              href={`/user/${shareDesignProfileId}`}
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
            {sharingDifferentProfile && (
              <p
                style={{
                  marginTop: '12px',
                  fontSize: '13px',
                  color: '#a15a00',
                  background: '#fff6ec',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,149,2,0.3)',
                }}
              >
                You're editing a different profile. Sharing uses your default profile set in the dashboard.
              </p>
            )}
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
            Save your profile first or set a default profile in your dashboard.
          </p>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRCode && shareDesignProfileId && (
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
            padding: '32px 32px 36px',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
            maxWidth: '420px',
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
                  width: 'min(70vw, 260px)',
                  maxWidth: '260px',
                  aspectRatio: '1 / 1',
                  margin: '0 auto',
                  background: '#ffffff',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  overflow: 'hidden',
                }}
              >
                <ProfileQRCode designProfileId={shareDesignProfileId} displaySize={232} />
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
              {typeof window !== 'undefined' ? `${window.location.origin}/user/${shareDesignProfileId}` : ''}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={async () => {
                  if (typeof window !== "undefined") {
                    const profileUrl = `${window.location.origin}/user/${shareDesignProfileId}`;
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
      {pendingCrop && (
        <ImageCropperModal
          file={pendingCrop.file}
          aspectRatio={getCropAspectRatio(pendingCrop.fieldName)}
          onCancel={handleCropCancel}
          onComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
