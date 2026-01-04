"use client";

import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";
import { QRCodeCanvas } from "qrcode.react";
import { CardData } from "@/types/CardData";
import { toPng } from "html-to-image";

const CARD_MM_WIDTH = 86;
const CARD_MM_HEIGHT = 54;
const CARD_BORDER_RADIUS_MM = 2.88;
const CARD_BLEED_MM = 3;
const SAFE_MARGIN_MM = 4;
const PREVIEW_MAX_WIDTH = 360;

const mmToPx = (mm: number, dpi: number) => (mm * dpi) / 25.4;

export type CardResolution = "300" | "600" | "1200";
export type CardOrientation = "landscape" | "portrait";
type CardSide = "front" | "back";
type TextContentKey =
  | "headline"
  | "tagline"
  | "name"
  | "title"
  | "company"
  | "role"
  | "phone"
  | "email"
  | "custom";

type CardElementType = "text" | "image" | "qr" | "shape" | "line" | "border";

type FontOption =
  | "sfpro"
  | "manrope"
  | "apple-system"
  | "-apple-system"
  | "helveticas"
  | "arial"
  | "playfair"
  | "times"
  | "serif"
  | "mono"
  | "courier"
  | "pacifio"
  | "brush"
  | "cursive"
  | "poppins"
  | "avenir"
  | "default";

const FONT_STACKS: Record<FontOption, string> = {
  sfpro: "SF Pro Display",
  manrope: "Manrope",
  "apple-system": "-apple-system",
  "-apple-system": "-apple-system",
  helveticas: "Helvetica Neue",
  arial: "Arial",
  playfair: "Playfair Display",
  times: "Times New Roman",
  serif: "serif",
  mono: "'Space Mono'",
  courier: "'Courier New'",
  pacifio: "'Pacifico'",
  brush: "'Brush Script MT'",
  cursive: "cursive",
  poppins: "Poppins",
  avenir: "Avenir",
  default: "Manrope"
};

type FontWeightOption = "400" | "700";
const FONT_WEIGHT_OPTIONS: { label: string; value: FontWeightOption }[] = [
  { label: "Normal", value: "400" },
  { label: "Bold", value: "700" },
];
const DEFAULT_FONT_WEIGHT: FontWeightOption = "400";
type FontStyleOption = "normal" | "italic";
const DEFAULT_FONT_STYLE: FontStyleOption = "normal";

const FONT_OPTIONS: { label: string; value: FontOption }[] = [
  { label: "SF Pro", value: "sfpro" },
  { label: "Manrope", value: "manrope" },
  { label: "Apple System", value: "-apple-system" },
  { label: "Helvetica", value: "helveticas" },
  { label: "Arial", value: "arial" },
  { label: "Playfair", value: "playfair" },
  { label: "Times New Roman", value: "times" },
  { label: "Serif", value: "serif" },
  { label: "Monospace", value: "mono" },
  { label: "Courier New", value: "courier" },
  { label: "Pacifico", value: "pacifio" },
  { label: "Brush", value: "brush" },
  { label: "Cursive", value: "cursive" },
  { label: "Poppins", value: "poppins" },
  { label: "Avenir", value: "avenir" },
  { label: "Default (Manrope)", value: "default" },
];
const MIN_RESIZABLE_RATIO = 0.08;
const MAX_RESIZABLE_RATIO = 0.6;
const MIN_FONT_RATIO = 0.01;
const MAX_FONT_RATIO = 0.2;
const MIN_IMAGE_PX = 240;
const MAX_MEDIA_PX = 1000;
const MIN_OPACITY = 0.1;
const MAX_OPACITY = 1;

const applyOpacityToColor = (color: string, opacity: number) => {
  if (opacity >= 1) return color;
  const normalized = color.trim();
  const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    const expanded = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const r = parseInt(expanded.slice(0, 2), 16);
    const g = parseInt(expanded.slice(2, 4), 16);
    const b = parseInt(expanded.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  const rgbMatch = normalized.match(/^rgba?\\((\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)(?:\\s*,\\s*([0-9.]+))?\\)$/i);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

const isCustomTextElement = (element: CardElement) =>
  element.type === "text" && (!element.contentKey || element.contentKey === "custom");

const isBorderElement = (element: CardElement) => element.type === "border";
const isShapeElement = (element: CardElement) => element.type === "shape";
const iconEligibleKeys: TextContentKey[] = ["name", "title", "company", "role", "phone", "email"];
const canShowIcon = (element: CardElement) =>
  element.type === "text" && !!element.contentKey && iconEligibleKeys.includes(element.contentKey);

export type CardElement = {
  id: string;
  type: CardElementType;
  side: CardSide;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  textAlign?: "left" | "center" | "right";
  contentKey?: TextContentKey;
  text?: string;
  color?: string;
  showIcon?: boolean;
  opacity?: number;
  imageUrl?: string | null;
  frontBackgroundColor?: string;
  backBackgroundColor?: string;
  backgroundColor?: string;
  qrColor?: string;
  fontWeight?: FontWeightOption;
  fontStyle?: FontStyleOption;
  shapeVariant?: "rectangle" | "circle" | "square" | "triangle";
  borderThickness?: number;
  borderStyle?: "solid" | "dashed" | "dotted";
  borderColor?: string;
  fontFamily?: FontOption;
  locked?: boolean;
  rotation?: number;
  mediaType?: "logo" | "image";
};

const DEFAULT_CARD_ELEMENTS: CardElement[] = [
  {
    id: "front-headline",
    type: "text",
    side: "front",
    x: 0.08,
    y: 0.58,
    fontSize: 0.50,
    textAlign: "left",
    contentKey: "headline",
  },
  {
    id: "front-tagline",
    type: "text",
    side: "front",
    x: 0.08,
    y: 0.75,
    fontSize: 0.50,
    textAlign: "left",
    contentKey: "tagline",
  },
  {
    id: "front-logo",
    type: "image",
    side: "front",
    x: 0.68,
    y: 0.08,
    width: 0.22,
    height: 0.22,
  },
  {
    id: "back-name",
    type: "text",
    side: "back",
    x: 0.08,
    y: 0.12,
    fontSize: 0.055,
    textAlign: "left",
    contentKey: "name",
  },
  {
    id: "back-role",
    type: "text",
    side: "back",
    x: 0.08,
    y: 0.25,
    fontSize: 0.055,
    textAlign: "left",
    contentKey: "role",
  },
  {
    id: "back-phone",
    type: "text",
    side: "back",
    x: 0.08,
    y: 0.38,
    fontSize: 0.055,
    textAlign: "left",
    contentKey: "phone",
  },
  {
    id: "back-email",
    type: "text",
    side: "back",
    x: 0.08,
    y: 0.5,
    fontSize: 0.055,
    textAlign: "left",
    contentKey: "email",
  },
  {
    id: "back-qr",
    type: "qr",
    side: "back",
    x: 0.6,
    y: 0.16,
    width: 0.28,
    height: 0.28,
  },
  {
    id: "role",
    type: "text",
    side: "back",
    x: 0.08,
    y: 0.25,
    fontSize: 0.055,
    textAlign: "left",
    contentKey: "role",
  }
];

const TEXT_PRESET_OPTIONS: { label: string; value: TextContentKey }[] = [
  { label: "Headline", value: "headline" },
  { label: "Tagline", value: "tagline" },
  { label: "Name", value: "name" },
  { label: "Role (Title • Company)", value: "role" },
  { label: "Title", value: "title" },
  { label: "Company", value: "company" },
  { label: "Phone", value: "phone" },
  { label: "Email", value: "email" },
  { label: "Custom text", value: "custom" },
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const cloneDefaultElements = (): CardElement[] => DEFAULT_CARD_ELEMENTS.map((el) => ({ ...el }));

export type CardDesignSettings = {
  frontBackgroundColor: string;
  backBackgroundColor: string;
  backgroundColor: string;
  textColor: string;
  headline: string;
  tagline?: string;
  logoUrl?: string | null;
  resolution: CardResolution;
  elements?: CardElement[];
  orientation?: CardOrientation;
  fontFamily?: FontOption;
};

export type CardExportPayload = {
  frontImage: string;
  backImage: string;
  resolution: CardResolution;
  widthPx: number;
  heightPx: number;
};

export const DEFAULT_CARD_DESIGN: CardDesignSettings = {
  backgroundColor: "#0f172a",
  frontBackgroundColor: "#0f172a",
  backBackgroundColor: "#0f172a",
  // accentColor: "#ff7a00",
  textColor: "#ffffff",
  headline: "",
  tagline: "",
  logoUrl: null,
  resolution: "600",
  elements: [],
  orientation: "landscape",
  fontFamily: "default",
};

export const parseCardDesign = (raw: any): CardDesignSettings => {
  if (!raw) return DEFAULT_CARD_DESIGN;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return { ...DEFAULT_CARD_DESIGN, ...parsed };
  } catch (error) {
    console.warn("Failed to parse card design settings", error);
    return DEFAULT_CARD_DESIGN;
  }
};

type PhysicalCardDesignerProps = {
  cardDesign: CardDesignSettings;
  updateCardDesign: (changes: Partial<CardDesignSettings>) => void;
  previewData: CardData;
  profileUrl?: string;
  logoItems?: { url: string; type: "logo" | "image" }[];
  designProfileId?: string | null;
  profileId?: string | null;
  onRemoveAsset?: (url: string) => Promise<void> | void;
  physicalActivated: boolean;
  onSave: (payload: CardExportPayload) => Promise<void> | void;
  onSaveDesign: () => Promise<void> | void;
  onUploadLogo: (e: ChangeEvent<HTMLInputElement>, assetType?: "logo" | "image") => Promise<void>;
  uploadingLogo: boolean;
};

const resolutionOptions: { label: string; value: CardResolution }[] = [
  { label: "300 DPI", value: "300" },
  { label: "600 DPI (Recommended)", value: "600" },
  { label: "1200 DPI", value: "1200" },
];
const orientationOptions: { label: string; value: CardOrientation }[] = [
  { label: "Landscape", value: "landscape" },
  { label: "Portrait", value: "portrait" },
];
type BackgroundFillMode = "solid" | "gradient2" | "gradient3";
const DEFAULT_GRADIENT_TWO = ["#ff8b37", "#ff5700"];
const DEFAULT_GRADIENT_THREE = ["#ff8b37", "#ff5700", "#ffd166"];

const buildGradient = (stops: string[]) => `linear-gradient(135deg, ${stops.join(", ")})`;

const parseGradientStops = (background: string): string[] => {
  if (!background.startsWith("linear-gradient")) return [];
  const start = background.indexOf("(");
  const end = background.lastIndexOf(")");
  if (start === -1 || end === -1 || end <= start) return [];
  const body = background.slice(start + 1, end);
  const parts = body.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 1) return [];
  // ignore the first entry (the angle)
  return parts.slice(1).map((part) => part.replace(/\s?(0|100)%/g, "").trim());
};

const hexToRgb = (color: string): [number, number, number] | null => {
  const match = color.trim().match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (!match) return null;
  const value = match[1];
  const expand = (str: string) => (str.length === 1 ? str + str : str);
  if (value.length <= 4) {
    const [r, g, b] = value
      .slice(0, 3)
      .split("")
      .map((v) => parseInt(expand(v), 16));
    return [r, g, b];
  }
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return [r, g, b];
};

const rgbStringToRgb = (color: string): [number, number, number] | null => {
  const match = color.trim().match(/^rgba?\\((.+)\\)$/i);
  if (!match) return null;
  const parts = match[1]
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3);
  if (parts.length < 3) return null;
  const [r, g, b] = parts.map((value) => Number.parseFloat(value));
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return [r, g, b];
};

const colorToLuminance = (color: string): number | null => {
  const rgb = hexToRgb(color) ?? rgbStringToRgb(color);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((value) => Math.min(Math.max(value, 0), 255));
  const srgb = [r, g, b].map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
};

const getBackgroundLuminance = (background: string): number | null => {
  const stops = parseGradientStops(background);
  const palette = stops.length ? stops : [background];
  const luminances = palette
    .map((entry) => colorToLuminance(entry))
    .filter((value): value is number => value !== null);
  if (!luminances.length) return null;
  return luminances.reduce((total, value) => total + value, 0) / luminances.length;
};

const gradientCatalog: Record<string, string[]> = {
  Sunset: ["#ff8b37", "#ff5700"],
  Ocean: ["#2BC0E4", "#EAECC6"],
  Midnight: ["#232526", "#414345"],
  Forest: ["#5A3F37", "#2C7744"],
};

const getGradientStopsForMode = (
  mode: BackgroundFillMode,
  currentStops: string[]
): string[] => {
  if (mode === "solid") return [];
  const desiredLength = mode === "gradient3" ? 3 : 2;
  const fallback = mode === "gradient3" ? DEFAULT_GRADIENT_THREE : DEFAULT_GRADIENT_TWO;
  const normalizedStops = currentStops.filter(Boolean);
  if (normalizedStops.length >= desiredLength) {
    return normalizedStops.slice(0, desiredLength);
  }
  return [...normalizedStops, ...fallback].slice(0, desiredLength);
};

export function PhysicalCardDesigner({
  cardDesign,
  updateCardDesign,
  previewData,
  profileUrl,
  logoItems = [],
  designProfileId,
  profileId,
  onRemoveAsset,
  physicalActivated,
  onSave,
  onSaveDesign,
  onUploadLogo,
  uploadingLogo,
}: PhysicalCardDesignerProps) {
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{ left: number; top: number } | null>(null);
  const AlignIcon = ({ variant }: { variant: "left" | "center" | "right" | "top" | "middle" | "bottom" }) => {
    const common = {
      width: 16,
      height: 16,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
      "aria-hidden": true as const,
    };
    if (variant === "left") {
      return (
        <svg {...common}>
          <line x1="6" y1="4" x2="6" y2="20" />
          <rect x="8" y="7" width="10" height="10" rx="2" />
        </svg>
      );
    }
    if (variant === "center") {
      return (
        <svg {...common}>
          <line x1="12" y1="4" x2="12" y2="20" />
          <rect x="6" y="7" width="12" height="10" rx="2" />
        </svg>
      );
    }
    if (variant === "right") {
      return (
        <svg {...common}>
          <line x1="18" y1="4" x2="18" y2="20" />
          <rect x="4" y="7" width="10" height="10" rx="2" />
        </svg>
      );
    }
    if (variant === "top") {
      return (
        <svg {...common}>
          <line x1="4" y1="6" x2="20" y2="6" />
          <rect x="7" y="8" width="10" height="10" rx="2" />
        </svg>
      );
    }
    if (variant === "middle") {
      return (
        <svg {...common}>
          <line x1="4" y1="12" x2="20" y2="12" />
          <rect x="7" y="6" width="10" height="12" rx="2" />
        </svg>
      );
    }
    return (
      <svg {...common}>
        <line x1="4" y1="18" x2="20" y2="18" />
        <rect x="7" y="6" width="10" height="10" rx="2" />
      </svg>
    );
  };
  const logoAssets = logoItems.filter((entry) => entry.type === "logo");
  const imageAssets = logoItems.filter((entry) => entry.type === "image");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handle = () => setIsCompactLayout(window.innerWidth <= 640);
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  const assetCardStyle = (): CSSProperties => ({
    display: isCompactLayout ? "block" : "flex",
    alignItems: isCompactLayout ? "flex-start" : "center",
    gap: isCompactLayout ? "8px" : "12px",
    border: "1px solid #eef0f3",
    borderRadius: "12px",
    padding: "10px 12px",
    background: "#fff",
    width: "100%",
  });
  const actionRowStyle: CSSProperties = {
    display: "flex",
    gap: "8px",
    flexWrap: isCompactLayout ? "wrap" : "nowrap",
    width: "100%",
  };
  const orientation = cardDesign.orientation ?? "landscape";
  const isPortrait = orientation === "portrait";
  const dpi = Number(cardDesign.resolution || "300");
  const widthMm = isPortrait ? CARD_MM_HEIGHT : CARD_MM_WIDTH;
  const heightMm = isPortrait ? CARD_MM_WIDTH : CARD_MM_HEIGHT;
  const bleedXRatio = CARD_BLEED_MM / widthMm;
  const bleedYRatio = CARD_BLEED_MM / heightMm;
  const safeXRatio = SAFE_MARGIN_MM / widthMm;
  const safeYRatio = SAFE_MARGIN_MM / heightMm;
  const cardWidthPx = mmToPx(widthMm, dpi); // trim size
  const cardHeightPx = mmToPx(heightMm, dpi); // trim size
  const bleedPx = mmToPx(CARD_BLEED_MM, dpi);
  const safeMarginPx = mmToPx(SAFE_MARGIN_MM, dpi);
  const totalWidthPx = cardWidthPx + bleedPx * 2;
  const totalHeightPx = cardHeightPx + bleedPx * 2;
  const baseDimensionPx = isPortrait ? totalHeightPx : totalWidthPx;
  const previewScale = Math.min(0.74, PREVIEW_MAX_WIDTH / baseDimensionPx);
  const displayedWidth = cardWidthPx * previewScale; // trim render width
  const displayedHeight = cardHeightPx * previewScale; // trim render height
  const bleedXPx = bleedPx * previewScale;
  const bleedYPx = bleedPx * previewScale;
  const safeXPx = safeMarginPx * previewScale;
  const safeYPx = safeMarginPx * previewScale;
  const selectionHighlightColor = "rgba(255, 180, 71, 0.95)";
  const selectionIdleColor = "rgba(255, 184, 94, 0.45)";
  const safeLineColor = "rgba(82, 211, 151, 0.7)";
  const bleedLineColor = "rgba(255, 111, 97, 0.75)";
  const ratioToPt = (ratio: number) => Math.round(((ratio || 0) * baseDimensionPx * 72) / dpi);
  const ptToRatio = (pt: number) => (pt / 72) * (dpi / baseDimensionPx);
  const minFontRatio = Math.max(MIN_FONT_RATIO, ptToRatio(10));
  const cornerRadiusPx = mmToPx(CARD_BORDER_RADIUS_MM, dpi) * previewScale;
  const minElementSizePx = MIN_RESIZABLE_RATIO * cardWidthPx;
  const maxElementSizePx = MAX_RESIZABLE_RATIO * cardWidthPx;
  const imageMaxRatio = displayedWidth > 0 ? MAX_MEDIA_PX / displayedWidth : MAX_RESIZABLE_RATIO;
  const mediaMaxSliderRatio = Math.min(
    MAX_RESIZABLE_RATIO,
    Math.max(1 - safeXRatio * 2, 0),
    Math.max(1 - safeYRatio * 2, 0),
    displayedWidth > 0 ? MAX_MEDIA_PX / displayedWidth : MAX_RESIZABLE_RATIO
  );
  const qrMinSizeRatio = Math.max(MIN_RESIZABLE_RATIO, MIN_IMAGE_PX / cardWidthPx);
  const qrMaxSizeRatio = Math.max(MIN_RESIZABLE_RATIO, Math.min(1 - safeXRatio * 2, 1 - safeYRatio * 2));
  const mediaMinSliderPx = Math.max(minElementSizePx, MIN_IMAGE_PX);
  const mediaMaxSliderPx = mediaMaxSliderRatio * cardWidthPx;
  const mediaMaxSliderPxForElement = (element: CardElement) => {
    if (element.type === "qr") return qrMaxSizeRatio * cardWidthPx;
    const ratio =
      element.type === "image" && getMediaType(element) !== "logo"
        ? imageMaxRatio
        : mediaMaxSliderRatio;
    return ratio * cardWidthPx;
  };
  const mediaMaxRatioForElement = (element: CardElement) => {
    const minRatio = displayedWidth > 0 ? MIN_IMAGE_PX / displayedWidth : MIN_RESIZABLE_RATIO;
    const globalMax =
      element.type === "qr"
        ? qrMaxSizeRatio
        : element.type === "image" && getMediaType(element) !== "logo"
        ? imageMaxRatio
        : mediaMaxSliderRatio;
    const x = element.x ?? safeXRatio;
    const y = element.y ?? safeYRatio;
    const posMaxX =
      element.type === "image" && getMediaType(element) !== "logo"
        ? Math.max(1 - x, minRatio)
        : Math.max(1 - safeXRatio - x, minRatio);
    const posMaxY =
      element.type === "image" && getMediaType(element) !== "logo"
        ? Math.max(1 - y, minRatio)
        : Math.max(1 - safeYRatio - y, minRatio);
    return Math.max(minRatio, Math.min(globalMax, posMaxX, posMaxY));
  };
  const getBoundsForElement = (element: CardElement, widthRatio: number, heightRatio: number) => {
    if (element.type === "qr") {
      const minX = safeXRatio;
      const minY = safeYRatio;
      const maxX = 1 - safeXRatio - widthRatio;
      const maxY = 1 - safeYRatio - heightRatio;
      return { 
        minX, 
        minY, 
        maxX: Math.max(minX, maxX),  // Prevent negative/invalid bounds
        maxY: Math.max(minY, maxY) 
      };
    }
    const isImageNonLogo = element.type === "image" && getMediaType(element) !== "logo";
    const allowFull = isCustomTextElement(element) || isShapeElement(element);
    const minX = isImageNonLogo ? -bleedXRatio : allowFull ? 0 : safeXRatio;
    const maxX = isImageNonLogo
      ? Math.max(minX, 1 + bleedXRatio - widthRatio)
      : allowFull
      ? Math.max(0, 1 - widthRatio)
      : Math.max(minX, 1 - safeXRatio - widthRatio);
    const minY = isImageNonLogo ? -bleedYRatio : allowFull ? 0 : safeYRatio;
    const maxY = isImageNonLogo
      ? Math.max(minY, 1 + bleedYRatio - heightRatio)
      : allowFull
      ? Math.max(minY, 1 - heightRatio)
      : Math.max(minY, 1 - safeYRatio - heightRatio);
    return { minX, maxX, minY, maxY };
  };
  const clampMediaSizeForElement = (sizeRatio: number, element: CardElement) => {
    const minRatio =
      element.type === "qr"
        ? qrMinSizeRatio
        : displayedWidth > 0
        ? MIN_IMAGE_PX / displayedWidth
        : MIN_RESIZABLE_RATIO;
    const maxRatio = element.type === "qr" ? qrMaxSizeRatio : mediaMaxRatioForElement(element);
    return clamp(sizeRatio, minRatio, maxRatio);
  };
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    id: string;
    side: CardSide;
    offsetX: number;
    offsetY: number;
    deltas: Record<string, { dx: number; dy: number }>;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingDesign, setSavingDesign] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeElementIds, setActiveElementIds] = useState<string[]>([]);
  const [selectedElementSide, setSelectedElementSide] = useState<CardSide>("front");
  const [selectedPreset, setSelectedPreset] = useState<TextContentKey>("headline");
  const [customText, setCustomText] = useState("TapINK");
  const pixelRatio = displayedWidth > 0 ? cardWidthPx / displayedWidth : 1;
  const cardElements = cardDesign.elements ?? [];
  const [showGuidesOverlay, setShowGuidesOverlay] = useState(true);
  const [showGuidesHint, setShowGuidesHint] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const previewWrapperRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const headerRowRef = useRef<HTMLDivElement>(null);
  const resolveMediaType = useCallback(
    (element: CardElement) => {
      if (element.mediaType) return element.mediaType;
      const idHint = element.id?.toLowerCase().includes("logo");
      const logoMatch =
        element.imageUrl &&
        (logoAssets.some((asset) => asset.url === element.imageUrl) || cardDesign.logoUrl === element.imageUrl);
      if (idHint || logoMatch) return "logo";
      return "image";
    },
    [logoAssets, cardDesign.logoUrl]
  );
  const getMediaType = resolveMediaType;
  const backgroundFront = cardDesign.frontBackgroundColor ?? cardDesign.backgroundColor ?? "#0f172a";
  const backgroundBack = cardDesign.backBackgroundColor ?? cardDesign.backgroundColor ?? "#0f172a";
  const getBackgroundForSide = (side: CardSide) => (side === "front" ? backgroundFront : backgroundBack);
  const activeBackground = getBackgroundForSide(selectedElementSide);
  const getCutLineColor = useCallback(
    (side: CardSide) => {
      const luminance = getBackgroundLuminance(getBackgroundForSide(side));
      if (luminance === null) return "rgba(255, 255, 255, 0.88)";
      return luminance > 0.65 ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.9)";
    },
    [backgroundFront, backgroundBack]
  );
  const setBackgroundForActiveSide = (value: string) => {
    if (selectedElementSide === "front") {
      updateCardDesign({ frontBackgroundColor: value });
    } else {
      updateCardDesign({ backBackgroundColor: value });
    }
  };
  const existingStops = parseGradientStops(activeBackground || "");
  const backgroundMode: BackgroundFillMode =
    existingStops.length >= 3 ? "gradient3" : existingStops.length >= 2 ? "gradient2" : "solid";
  const activeGradientStops = getGradientStopsForMode(backgroundMode, existingStops);

  const qrValue =
    profileUrl ||
    (typeof window !== "undefined" && designProfileId ? `${window.location.origin}/user/${designProfileId}` : "https://tapink.com.au");

  useEffect(() => {
    if (!cardElements.length) {
      updateCardDesign({ elements: cloneDefaultElements() });
    }
  }, [cardElements.length, updateCardDesign]);

  useEffect(() => {
    if (!cardDesign.elements?.length) return;
    const clamped = cardDesign.elements.map(clampElementPosition);
    const changed = cardDesign.elements.some((element, index) => {
      const target = clamped[index];
      return element.x !== target.x || element.y !== target.y || element.mediaType !== target.mediaType;
    });
    if (changed) {
      updateCardDesign({ elements: clamped });
    }
  }, [cardDesign.orientation, safeXRatio, safeYRatio]);

  const clampElementPosition = (element: CardElement): CardElement => {
    if (isBorderElement(element)) {
      return { ...element, x: 0, y: 0, width: 1, height: 1, borderStyle: element.borderStyle ?? "solid" };
    }
    if (element.type === "qr") {
      const widthRatio = getQrWidthRatio(element);
      const heightRatio = getQrHeightRatio(element);
      const bounds = getBoundsForElement(element, widthRatio, heightRatio);
      return {
        ...element,
        width: widthRatio,
        height: widthRatio,
        x: clamp(element.x ?? bounds.minX, bounds.minX, bounds.maxX),
        y: clamp(element.y ?? bounds.minY, bounds.minY, bounds.maxY),
        opacity: 1,
        qrColor: element.qrColor ?? "#000000",
      };
    }
    const widthRatio = getElementWidth(element);
    const heightRatio = getElementHeight(element);
    const bounds = getBoundsForElement(element, widthRatio, heightRatio);
    const mediaType = getMediaType(element);

    return {
      ...element,
      mediaType: element.mediaType ?? (element.type === "image" ? mediaType : undefined),
      x: clamp(element.x ?? bounds.minX, bounds.minX, bounds.maxX),
      y: clamp(element.y ?? bounds.minY, bounds.minY, bounds.maxY),
      showIcon: element.showIcon ?? false,
      opacity: clamp(element.opacity ?? 1, MIN_OPACITY, MAX_OPACITY),
    };
  };

  const setElements = (updater: (prev: CardElement[]) => CardElement[]) => {
    const next = updater(cardDesign.elements ?? []).map(clampElementPosition);
    updateCardDesign({ elements: next });
  };

  const measureTextWidthPx = (
    text: string,
    fontSizePx: number,
    fontFamily: string,
    fontWeight: FontWeightOption = DEFAULT_FONT_WEIGHT,
    fontStyle: FontStyleOption = DEFAULT_FONT_STYLE
  ) => {
    if (typeof document === "undefined") {
      return text.length * fontSizePx * 0.6;
    }
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return text.length * fontSizePx * 0.6;
    ctx.font = `${fontStyle} ${fontWeight} ${fontSizePx}px ${fontFamily}`;
    const metrics = ctx.measureText(text || "");
    return metrics.width || 0;
  };

  const getQrWidthRatio = (element: CardElement) => {
    const baseRatio = element.width ?? 0.28;
    return clamp(baseRatio, qrMinSizeRatio, qrMaxSizeRatio);
  };

  const getQrHeightRatio = (element: CardElement) => {
    const widthRatio = getQrWidthRatio(element);
    if (displayedWidth <= 0 || displayedHeight <= 0) return widthRatio;
    const squarePx = widthRatio * displayedWidth;
    return squarePx / displayedHeight;
  };

  const getElementWidth = (element: CardElement) => {
    if (element.type === "text") {
      const fontSizePx = (element.fontSize ?? 0.05) * displayedWidth;
      const fontKey = (element.fontFamily ?? cardDesign.fontFamily ?? "default") as FontOption;
      const fontFamily = FONT_STACKS[fontKey];
      const fontWeight = element.fontWeight ?? DEFAULT_FONT_WEIGHT;
      const fontStyle = element.fontStyle ?? DEFAULT_FONT_STYLE;
      const iconWidthPx =
        element.showIcon && element.contentKey && iconEligibleKeys.includes(element.contentKey)
          ? fontSizePx * 0.9 + 6
          : 0;
      const textWidthPx =
        measureTextWidthPx(getTextValue(element), fontSizePx, fontFamily, fontWeight, fontStyle) + 2 + iconWidthPx;
      const measuredRatio = textWidthPx / displayedWidth;
      return Math.max(measuredRatio, 0.02);
    }
    if (element.type === "qr") return getQrWidthRatio(element);
    if (typeof element.width === "number") return element.width;
    if (element.type === "image") {
      const minRatio = displayedWidth > 0 ? MIN_IMAGE_PX / displayedWidth : MIN_RESIZABLE_RATIO;
      return Math.max(element.width ?? 0.22, minRatio);
    }
    if (element.type === "shape") return 0.25;
    if (element.type === "border") return 1;
    if (element.type === "line") return 0.6;
    return 0.82;
  };

  const getElementHeight = (element: CardElement) => {
    if (element.type === "text") {
      const fontSizePx = (element.fontSize ?? 0.05) * displayedWidth;
      const lineHeightPx = fontSizePx * 1.15;
      return lineHeightPx / displayedHeight;
    }
    if (element.type === "qr") return getQrHeightRatio(element);
    if (typeof element.height === "number") return element.height;
    if (element.type === "image") return 0.22;
    if (element.type === "shape") return 0.12;
    if (element.type === "line") return 0.01;
    if (element.type === "border") return element.height ?? 1;
    const fontSize = element.fontSize ?? 0.07;
    return fontSize * 1.6;
  };

  const getTextValue = (element: CardElement) => {
    switch (element.contentKey) {
      case "headline":
        return cardDesign.headline?.trim() || "Headline";
      case "tagline":
        return cardDesign.tagline?.trim() || "Tagline";
      case "name":
        return previewData.name || "Your Name";
      case "title":
        return previewData.title || "Title";
      case "company":
        return previewData.company || "Company";
      case "role": {
        const combined = [previewData.title, previewData.company].filter(Boolean).join(" • ");
        return combined || "Role • Company";
      }
      case "phone":
        return previewData.phone || "000 000 000";
      case "email":
        return previewData.email || "hello@tapink.com";
      case "custom":
      default:
        return element.text || "Custom text";
    }
  };

  const selectElement = (element: CardElement, event?: ReactPointerEvent<HTMLDivElement>) => {
    const allowMulti = event?.metaKey || event?.ctrlKey || event?.shiftKey;
    if (!allowMulti) {
      setActiveElementId(element.id);
      setActiveElementIds([element.id]);
      setSelectedElementSide(element.side);
      return;
    }
    if (element.side !== selectedElementSide) {
      setSelectedElementSide(element.side);
      setActiveElementIds([element.id]);
      setActiveElementId(element.id);
      return;
    }
    setActiveElementIds((prev) => {
      if (prev.includes(element.id)) {
        const next = prev.filter((id) => id !== element.id);
        setActiveElementId(next[0] ?? null);
        return next;
      }
      const next = [...prev, element.id];
      setActiveElementId(element.id);
      return next;
    });
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>, element: CardElement) => {
    if (exporting || element.locked || isBorderElement(element)) return;
    const targetRef = element.side === "front" ? frontRef : backRef;
    const cardEl = targetRef.current;
    if (!cardEl) return;
    const rect = cardEl.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const left = (element.x ?? 0) * displayedWidth + bleedXPx;
    const top = (element.y ?? 0) * displayedHeight + bleedYPx;

    const idsToMoveBase =
      activeElementIds.length && activeElementIds.includes(element.id) ? activeElementIds : [element.id];
    const movableIds = cardElements
      .filter(
        (el) =>
          idsToMoveBase.includes(el.id) &&
          el.side === element.side &&
          !el.locked &&
          el.type !== "border"
      )
      .map((el) => el.id);

    const deltas: Record<string, { dx: number; dy: number }> = {};
    cardElements.forEach((el) => {
      if (!movableIds.includes(el.id)) return;
      deltas[el.id] = {
        dx: (el.x ?? 0) - (element.x ?? 0),
        dy: (el.y ?? 0) - (element.y ?? 0),
      };
    });

    dragState.current = {
      id: element.id,
      side: element.side,
      offsetX: pointerX - left,
      offsetY: pointerY - top,
      deltas,
    };

    const handleMove = (moveEvent: PointerEvent) => {
      if (!dragState.current) return;
      const activeRef = dragState.current.side === "front" ? frontRef : backRef;
      const activeEl = activeRef.current;
      if (!activeEl) return;
      const activeRect = activeEl.getBoundingClientRect();
      const posX = moveEvent.clientX - activeRect.left - dragState.current.offsetX;
      const posY = moveEvent.clientY - activeRect.top - dragState.current.offsetY;
      const trimmedPosX = posX - bleedXPx;
      const trimmedPosY = posY - bleedYPx;

    setElements((prev) =>
      prev.map((item) => {
          const delta = dragState.current?.deltas[item.id];
          if (!delta || item.side !== dragState.current?.side || item.locked || item.type === "border") {
            return item;
          }

          const widthRatio = getElementWidth(item);
          const heightRatio = getElementHeight(item);
          const bounds = getBoundsForElement(item, widthRatio, heightRatio);

          const nextX = clamp(trimmedPosX / displayedWidth + delta.dx, bounds.minX, bounds.maxX);
          const nextY = clamp(trimmedPosY / displayedHeight + delta.dy, bounds.minY, bounds.maxY);
          return { ...item, x: nextX, y: nextY };
        })
      );
    };

    const handleUp = () => {
      dragState.current = null;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    event.preventDefault();
  };

  const handleElementPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    element: CardElement
  ) => {
    selectElement(element, event);
    startDrag(event, element);
  };
  const clearSelection = () => {
    setActiveElementId(null);
    setActiveElementIds([]);
  };

const renderElement = (element: CardElement) => {
  const isOnActiveSide = element.side === selectedElementSide;
  const isSelected = activeElementIds.length
    ? activeElementIds.includes(element.id)
    : activeElementId
    ? element.id === activeElementId
    : isOnActiveSide;
  const widthRatio = getElementWidth(element);
  const heightRatio = getElementHeight(element);
  const widthPx = widthRatio * displayedWidth;
  const heightPx = heightRatio * displayedHeight;
    const left = contentOffsetX + (element.x ?? 0) * displayedWidth;
    const top = contentOffsetY + (element.y ?? 0) * displayedHeight;
    const showGuides = !exporting && isOnActiveSide;
    const selectionBorder = showGuides
      ? isSelected
        ? `1px solid ${selectionHighlightColor}`
        : `1px dotted ${selectionIdleColor}`
      : "none";
    const selectionDashedBorder = showGuides
      ? isSelected
        ? `1px solid ${selectionHighlightColor}`
        : `1px dashed ${selectionIdleColor}`
      : "none";

  const baseStyle: CSSProperties = {
      position: "absolute",
      left,
      top,
      width: widthPx,
      height: heightPx,
      display: element.type === "image" ? "flex" : "block",
      alignItems: element.type === "image" ? "center" : undefined,
      justifyContent: element.type === "image" ? "center" : undefined,
      cursor: showGuides ? (element.locked? "not-allowed": "grab") : "default",
      border: selectionBorder,
      borderRadius: element.type === "text" ? 8 : element.type === "image" ? 0 : 10,
      boxSizing: "border-box",
      userSelect: "none",
      touchAction: "none",
      opacity: (element.opacity ?? 1) * (element.locked ? 0.6 : 1),
      transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
      transformOrigin: "center center",
    };

    if (element.type === "text") {
      const fontSize = (element.fontSize ?? 0.05) * displayedWidth;
      const textAlign = element.textAlign ?? "left";
      const fontKey = (element.fontFamily ?? cardDesign.fontFamily ?? "default") as FontOption;
      const fontFamily = FONT_STACKS[fontKey];
      const fontWeight = element.fontWeight ?? DEFAULT_FONT_WEIGHT;
      const fontStyle = element.fontStyle ?? DEFAULT_FONT_STYLE;
      const iconKey = element.contentKey && iconEligibleKeys.includes(element.contentKey) ? element.contentKey : null;
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            display: "flex",
            alignItems: "center",
            justifyContent:
              textAlign === "right" ? "flex-end" : textAlign === "center" ? "center" : "flex-start",
          }}
          onPointerDown={(event) => handleElementPointerDown(event, element)}
        >
          <div
            style={{
              color: element.color || cardDesign.textColor,
              fontSize,
              textAlign,
              fontWeight,
              fontStyle,
              lineHeight: 1.15,
              whiteSpace: "pre",
              fontFamily,
              display: element.showIcon && iconKey ? "inline-flex" : "inline",
              alignItems: "center",
              gap: element.showIcon && iconKey ? Math.max(fontSize * 0.2, 6) : undefined,
              height: "100%",
            }}
          >
            {element.showIcon && iconKey && (
              <span
                aria-hidden="true"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: fontSize * 0.9,
                  height: fontSize * 0.9,
                  color: element.color || cardDesign.textColor,
                }}
              >
                {iconKey === "phone" && (
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.37 1.7.72 2.49a2 2 0 0 1-.45 2.11l-1.27 1.27a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.79.35 1.63.6 2.49.72A2 2 0 0 1 22 16.92z" />
                  </svg>
                )}
                {iconKey === "email" && (
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16v16H4z" />
                    <path d="m4 4 8 8 8-8" />
                  </svg>
                )}
                {iconKey === "company" && (
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 21h18" />
                    <path d="M6 21V9a1 1 0 0 1 1-1h4v13" />
                    <path d="M13 21h5V5a1 1 0 0 0-1-1h-4z" />
                    <path d="M6 12h4" />
                    <path d="M6 16h4" />
                    <path d="M13 7h2" />
                    <path d="M13 11h2" />
                    <path d="M13 15h2" />
                  </svg>
                )}
                {(iconKey === "title" || iconKey === "role") && (
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                    <path d="M10 11h4" />
                  </svg>
                )}
                {iconKey === "name" && (
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="7" r="4" />
                    <path d="M4 21v-1a7 7 0 0 1 16 0v1" />
                  </svg>
                )}
              </span>
            )}
            {getTextValue(element)}
          </div>
        </div>
      );
    }

    if (element.type === "image") {
      const src = element.imageUrl ?? cardDesign.logoUrl;
      const defaultImageRatio = 0.22;
      const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
        const img = event.currentTarget as HTMLImageElement;
        if (!img.naturalWidth || !img.naturalHeight) return;
        const aspect = img.naturalHeight / img.naturalWidth;
        const url = src || "";
        setImageAspectByUrl((prev) => (prev[url] === aspect ? prev : { ...prev, [url]: aspect }));

        const widthRatio = typeof element.width === "number" ? element.width : defaultImageRatio;
        const heightRatio = typeof element.height === "number" ? element.height : defaultImageRatio;
        const targetHeight = widthRatio * aspect;
        const shouldAutoSetHeight =
          element.height === undefined ||
          Math.abs(heightRatio - defaultImageRatio) < 0.0001 ||
          Math.abs(heightRatio - widthRatio) < 0.0001;
        if (shouldAutoSetHeight && Math.abs(heightRatio - targetHeight) > 0.0001) {
          setElements((prev) =>
            prev.map((el) => (el.id === element.id ? { ...el, height: targetHeight } : el))
          );
        }
      };
      return (
            <div
              key={element.id}
              style={{
                ...baseStyle,
                border: selectionDashedBorder,
                borderRadius: 0,
              }}
              onPointerDown={(event) => handleElementPointerDown(event, element)}
            >
          {src ? (
            <img
              src={src}
              alt="Card image"
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              onLoad={handleImageLoad}
            />
          ) : (
            <span style={{ fontSize: 12, color: cardDesign.textColor, opacity: 0.6 }}>
              Upload a logo to display
            </span>
          )}
        </div>
      );
    }

    if (element.type === "shape") {
      const variant = element.shapeVariant ?? "rectangle";
      if (variant === "triangle") {
        return (
          <div
            key={element.id}
            style={{
              position: "absolute",
              left,
              top,
              width: widthPx,
              height: heightPx,
              cursor: showGuides ? "grab" : "default",
            }}
            onPointerDown={(event) => handleElementPointerDown(event, element)}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${widthPx / 2}px solid transparent`,
                borderRight: `${widthPx / 2}px solid transparent`,
                borderBottom: `${heightPx}px solid ${element.backgroundColor || cardDesign.textColor}`,
                filter: showGuides ? "drop-shadow(0 0 0 rgba(0,0,0,0.1))" : undefined,
              }}
            />
          </div>
        );
      }

      const radius =
        variant === "circle" ? "50%" : variant === "square" ? "4px" : "12px";
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            background: element.backgroundColor || cardDesign.textColor,
            borderRadius: radius,
            border: selectionDashedBorder,
          }}
          onPointerDown={(event) => handleElementPointerDown(event, element)}
        />
      );
    }

    if (element.type === "line") {
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            background: element.backgroundColor || cardDesign.textColor,
            borderRadius: "999px",
            border: selectionDashedBorder,
          }}
          onPointerDown={(event) => handleElementPointerDown(event, element)}
        />
      );
    }

    if (element.type === "border") {
      const thicknessPx = element.borderThickness ?? 2;
      const borderColor = element.borderColor ?? "#0f172a";
      const borderStyle = element.borderStyle ?? "solid";
      const borderOpacity = clamp(element.opacity ?? 1, MIN_OPACITY, MAX_OPACITY);
      const colorWithOpacity = applyOpacityToColor(borderColor, borderOpacity);
      const insetXPx = bleedXRatio * displayedWidth;
      const insetYPx = bleedYRatio * displayedHeight;
      const innerWidth = Math.max(displayedWidth - insetXPx * 2, 0);
      const innerHeight = Math.max(displayedHeight - insetYPx * 2, 0);
      return (
        <React.Fragment key={`${element.id}-border-wrapper`}>
          {/* Hit areas for selecting the border without blocking inner elements */}
          <div
            key={`${element.id}-hit-top`}
            style={{
              position: "absolute",
              left: contentOffsetX,
              top: contentOffsetY,
              width: displayedWidth,
              height: Math.max(thicknessPx * 2, 12),
              background: "transparent",
              cursor: "pointer",
            }}
            onPointerDown={(event) => handleElementPointerDown(event as unknown as ReactPointerEvent<HTMLDivElement>, element)}
          />
          <div
            key={`${element.id}-hit-bottom`}
            style={{
              position: "absolute",
              left: contentOffsetX,
              top: contentOffsetY + Math.max(displayedHeight - Math.max(thicknessPx * 2, 12), 0),
              width: displayedWidth,
              height: Math.max(thicknessPx * 2, 12),
              background: "transparent",
              cursor: "pointer",
            }}
            onPointerDown={(event) => handleElementPointerDown(event as unknown as ReactPointerEvent<HTMLDivElement>, element)}
          />
          <div
            key={`${element.id}-hit-left`}
            style={{
              position: "absolute",
              left: contentOffsetX,
              top: contentOffsetY + Math.max(thicknessPx * 2, 12),
              width: Math.max(thicknessPx * 2, 12),
              height: Math.max(displayedHeight - Math.max(thicknessPx * 4, 24), 0),
              background: "transparent",
              cursor: "pointer",
            }}
            onPointerDown={(event) => handleElementPointerDown(event as unknown as ReactPointerEvent<HTMLDivElement>, element)}
          />
          <div
            key={`${element.id}-hit-right`}
            style={{
              position: "absolute",
              left: contentOffsetX + Math.max(displayedWidth - Math.max(thicknessPx * 2, 12), 0),
              top: contentOffsetY + Math.max(thicknessPx * 2, 12),
              width: Math.max(thicknessPx * 2, 12),
              height: Math.max(displayedHeight - Math.max(thicknessPx * 4, 24), 0),
              background: "transparent",
              cursor: "pointer",
            }}
            onPointerDown={(event) => handleElementPointerDown(event as unknown as ReactPointerEvent<HTMLDivElement>, element)}
          />
          <div
            key={element.id}
            style={{
              position: "absolute",
              left: contentOffsetX,
              top: contentOffsetY,
              width: displayedWidth,
              height: displayedHeight,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: insetXPx,
                top: insetYPx,
                width: innerWidth,
                height: innerHeight,
                border: `${thicknessPx}px ${borderStyle} ${colorWithOpacity}`,
                borderRadius: Math.max(cornerRadiusPx - thicknessPx, 0),
                boxSizing: "border-box",
                opacity: borderOpacity,
              }}
            />
          </div>
        </React.Fragment>
      );
    }

    const qrVisualSize = Math.min(widthPx, heightPx);
    const qrPadding = 0;
    const qrResolutionBoost = Math.max(2, pixelRatio, 1 / Math.max(previewScale, 0.1));
    const qrRenderSize = qrVisualSize * qrResolutionBoost;

    return (
      <div
        key={element.id}
        style={{
          ...baseStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: qrVisualSize,
          height: qrVisualSize,
          padding: qrPadding,
          borderRadius: 0,
          boxSizing: "border-box",
        }}
        onPointerDown={(event) => handleElementPointerDown(event, element)}
      >
        <QRCodeCanvas
          value={qrValue}
          size={qrRenderSize}
          bgColor="transparent"
          fgColor={element.qrColor || cardDesign.textColor || "#000000"}
          level="H"
          includeMargin={false}
          style={{ width: qrVisualSize, height: qrVisualSize }}
        />
      </div>
    );
  };

  const frontElements = useMemo(
    () => cardElements.filter((element) => element.side === "front"),
    [cardElements]
  );
  const backElements = useMemo(
    () => cardElements.filter((element) => element.side === "back"),
    [cardElements]
  );
  const activeElements = useMemo(
    () => cardElements.filter((element) => activeElementIds.includes(element.id)),
    [cardElements, activeElementIds]
  );
  const selectedElements = useMemo(
    () => cardElements.filter((element) => element.side === selectedElementSide),
    [cardElements, selectedElementSide]
  );
  const activeElement = useMemo(
    () => activeElements[0] ?? cardElements.find((element) => element.id === activeElementId) ?? null,
    [activeElements, cardElements, activeElementId]
  );
  const mixedImageSelection =
    activeElements.filter((el) => el.type === "image").length > 1 &&
    new Set(activeElements.filter((el) => el.type === "image").map((el) => getMediaType(el))).size > 1;

  useEffect(() => {
    if (activeElementId && !activeElement) {
      setActiveElementId(null);
      setToolbarPosition(null);
    }
    if (activeElements.length && !activeElementId) {
      setActiveElementId(activeElements[0].id);
    }
    if (!activeElements.length && activeElementIds.length) {
      setActiveElementIds([]);
    }
  }, [activeElementId, activeElement, activeElements, activeElementIds]);

  useEffect(() => {
    if (!activeElement) {
      setToolbarPosition(null);
      return;
    }
    const wrapper = previewWrapperRef.current;
    const header = headerRowRef.current;
    if (!wrapper || !header) return;
    const wrapperRect = wrapper.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const left = headerRect.right - wrapperRect.left + 16;
    const top = headerRect.top - wrapperRect.top + headerRect.height + 8;
    setToolbarPosition({
      left: clamp(left, 12, wrapperRect.width - 12),
      top: clamp(top, 12, wrapperRect.height - 12),
    });
  }, [activeElement, displayedWidth, displayedHeight, previewScale]);

  const selectedIds = useMemo(
    () => (activeElementIds.length ? activeElementIds : activeElementId ? [activeElementId] : []),
    [activeElementIds, activeElementId]
  );
  const selectionBucket = useMemo(
    () =>
      activeElements.length
        ? activeElements
        : activeElement
        ? [activeElement]
        : [],
    [activeElements, activeElement]
  );
  const contentOffsetX = bleedXPx;
  const contentOffsetY = bleedYPx;
  const selectionCount = selectionBucket.length;
  const hasMultiSelection = selectionCount > 1;
  const anyUnlockedSelected = selectionBucket.some((el) => !el.locked);
  const tidyTargets = useMemo(
    () =>
      cardElements.filter(
        (element) =>
          selectedIds.includes(element.id) &&
          element.side === selectedElementSide &&
          !element.locked &&
          element.type !== "border"
      ),
    [selectedIds, cardElements, selectedElementSide]
  );
  const canDistributeX = tidyTargets.length >= 2;
  const canDistributeY = tidyTargets.length >= 2;
  const isOutsideSafeArea = (element: CardElement) => {
    const widthRatio = getElementWidth(element);
    const heightRatio = getElementHeight(element);
    const x = element.x ?? 0;
    const y = element.y ?? 0;
    return (
      x < safeXRatio ||
      y < safeYRatio ||
      x + widthRatio > 1 - safeXRatio ||
      y + heightRatio > 1 - safeYRatio
    );
  };
  const showPlacementWarning =
    !!activeElement &&
    (isCustomTextElement(activeElement) || isShapeElement(activeElement)) &&
    isOutsideSafeArea(activeElement);
  const guidesVisible = !previewMode && !exporting && (showGuidesOverlay || showGuidesHint);
  const cutLineVisible = guidesVisible || exporting;
  const [imageAspectByUrl, setImageAspectByUrl] = useState<Record<string, number>>({});

  useEffect(() => {
    if (showPlacementWarning) {
      setShowGuidesHint(true);
      const timeout = window.setTimeout(() => setShowGuidesHint(false), 1800);
      return () => window.clearTimeout(timeout);
    }
    setShowGuidesHint(false);
    return;
  }, [showPlacementWarning]);

  const applyToSelection = (
    predicate: (element: CardElement) => boolean,
    updater: (element: CardElement) => CardElement
  ) => {
    const targets = selectedIds.length ? selectedIds : activeElement ? [activeElement.id] : [];
    if (!targets.length) return;
    setElements((prev) =>
      prev.map((element) => {
        const isSelected =
          targets.includes(element.id) &&
          element.side === selectedElementSide &&
          !element.locked &&
          predicate(element);
        return isSelected ? updater(element) : element;
      })
    );
  };

  const moveElementLayer = (id: string, direction: "forward" | "backward") => {
    setElements((prev) => {
      const currentIndex = prev.findIndex((el) => el.id === id);
      if (currentIndex === -1) return prev;
      const element = prev[currentIndex];
      if (element.type === "border") return prev;
      const sameSide = prev
        .map((el, idx) => ({ el, idx }))
        .filter(({ el }) => el.side === element.side);
      const orderPositions = sameSide.map((item) => item.idx);
      const sorted = [...orderPositions].sort((a, b) => a - b);
      const positionIndex = sorted.findIndex((pos) => pos === currentIndex);
      if (positionIndex === -1) return prev;

      const targetPos =
        direction === "forward" ? sorted[Math.min(positionIndex + 1, sorted.length - 1)] : sorted[Math.max(positionIndex - 1, 0)];
      if (targetPos === currentIndex) return prev;

      const next = [...prev];
      const [removed] = next.splice(currentIndex, 1);
      const adjustedTarget = targetPos > currentIndex ? targetPos - 1 : targetPos;
      next.splice(adjustedTarget, 0, removed);
      return next;
    });
  };

  useEffect(() => {
    const handleOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      const insideToolbar = toolbarRef.current?.contains(target);
      const insidePreview = previewWrapperRef.current?.contains(target);
      if (!insideToolbar && !insidePreview) {
        clearSelection();
      }
    };
    document.addEventListener("pointerdown", handleOutsideClick, true);
    return () => document.removeEventListener("pointerdown", handleOutsideClick, true);
  }, []);
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setExporting(true);
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    try {
      if (!frontRef.current || !backRef.current) {
        throw new Error("Card preview not ready");
      }

      const [frontImage, backImage] = await Promise.all([
        toPng(frontRef.current, {
          cacheBust: true,
          pixelRatio,
        }),
        toPng(backRef.current, {
          cacheBust: true,
          pixelRatio,
        }),
      ]);

      await onSave({
        frontImage,
        backImage,
        resolution: cardDesign.resolution,
        widthPx: Math.round(cardWidthPx),
        heightPx: Math.round(cardHeightPx),
      });
    } catch (error) {
      console.error("Failed to export card design", error);
    } finally {
      setExporting(false);
      setSaving(false);
    }
  };

  const handleSaveDesign = async () => {
    if (savingDesign) return;
    setSavingDesign(true);
    try {
      await onSaveDesign();
    } catch (error) {
      console.error("Failed to save card design", error);
    } finally {
      setSavingDesign(false);
    }
  };

  const addTextElement = () => {
    const preset = selectedPreset;
    const baseId = `${preset}-${Date.now()}`;
    const baseText = preset === "custom" ? customText.trim() || "Custom text" : undefined;

    setElements((prev) => [
      ...prev,
      {
        id: baseId,
        type: "text",
        side: selectedElementSide,
        x: 0.08,
        y: 0.4,
        width: 0.8,
        height: 0.12,
        fontSize: 0.065,
        textAlign: "left",
        contentKey: preset,
        text: baseText,
      },
    ]);
    if (preset === "custom") {
      setCustomText("Custom text");
    }
  };

  const addLogoElement = () => {
    const sourceUrl = cardDesign.logoUrl || logoItems[0]?.url || null;
    setElements((prev) => [
      ...prev,
      {
        id: `image-${Date.now()}`,
        type: "image",
        side: selectedElementSide,
        x: 0.68,
        y: 0.08,
        width: 0.22,
        height: 0.22,
        imageUrl: sourceUrl,
      },
    ]);
  };

  const addImageElementFromLibrary = (imageUrl: string) => {
    if (!imageUrl) return;
    setElements((prev) => [
      ...prev,
      {
        id: `image-${Date.now()}`,
        type: "image",
        side: selectedElementSide,
        x: 0.68,
        y: 0.08,
        width: 0.22,
        height: 0.22,
        imageUrl,
      },
    ]);
  };

  const addQrElement = () => {
    const existing = cardElements.find((element) => element.type === "qr" && element.side === selectedElementSide);
    if (existing) return;
    setElements((prev) => [
      ...prev,
      {
        id: `qr-${Date.now()}`,
        type: "qr",
        side: selectedElementSide,
        x: 0.6,
        y: 0.16,
        width: 0.28,
        height: 0.28,
      },
    ]);
  };

  const addShapeElement = () => {
    const defaultVariant: CardElement["shapeVariant"] = "rectangle";
    const defaultWidth = 0.25;
    const defaultHeight = 0.12;

    setElements((prev) => [
      ...prev,
      {
        id: `shape-${Date.now()}`,
        type: "shape",
        side: selectedElementSide,
        x: 0.1,
        y: 0.6,
        width: defaultWidth,
        height: defaultHeight,
        backgroundColor: "#ffffff",
        shapeVariant: defaultVariant,
      },
    ]);
  };

  const addLineElement = () => {
      setElements((prev) => [
        ...prev,
        {
          id: `line-${Date.now()}`,
          type: "line",
          side: selectedElementSide,
          x: 0.08,
          y: 0.50,
          width: 0.6,
          height: 0.012,
          backgroundColor: cardDesign.textColor,
        },
      ]);
  };

  const addBorderElement = () => {
    setElements((prev) => [
      ...prev,
      {
        id: `border-${Date.now()}`,
        type: "border",
        side: selectedElementSide,
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        borderThickness: 2,
        borderColor: "#000000",
      },
    ]);
  };

  const removeElement = (id: string) => {
    setElements((prev) => prev.filter((element) => element.id !== id));
  };

  const duplicateSelection = () => {
    const targets = selectedIds.length ? selectedIds : activeElement ? [activeElement.id] : [];
    if (!targets.length) return;
    const offset = 0.02;
    const copies: CardElement[] = [];
    targets.forEach((id, index) => {
      const original = cardElements.find((el) => el.id === id);
      if (!original || original.locked) return;
      const copy: CardElement = clampElementPosition({
        ...original,
        id: `${original.id}-copy-${Date.now()}-${index}`,
        x: (original.x ?? 0) + offset,
        y: (original.y ?? 0) + offset,
        locked: false,
      });
      copies.push(copy);
    });
    if (!copies.length) return;
    setElements((prev) => [...prev, ...copies]);
    setActiveElementIds(copies.map((c) => c.id));
    setActiveElementId(copies[0].id);
    setSelectedElementSide(copies[0].side);
  };

  const toggleLockElement = (id: string) => {
    setElements((prev) =>
      prev.map((element) => (element.id === id ? { ...element, locked: !element.locked } : element))
    );
  };

  const alignBulk = (options: { horizontal?: "left" | "center" | "right"; vertical?: "top" | "middle" | "bottom" }) => {
    const targetIds = selectedIds;
    if (!targetIds.length) return;
    setElements((prev) => {
      const selected = prev.filter(
        (element) =>
          targetIds.includes(element.id) &&
          element.side === selectedElementSide &&
          !element.locked &&
          element.type !== "border"
      );
      if (!selected.length) return prev;

      const widths = new Map<string, number>();
      const heights = new Map<string, number>();
      selected.forEach((el) => {
        widths.set(el.id, getElementWidth(el));
        heights.set(el.id, getElementHeight(el));
      });

      const minX = Math.min(...selected.map((el) => el.x ?? 0));
      const minY = Math.min(...selected.map((el) => el.y ?? 0));
      const maxX = Math.max(...selected.map((el) => (el.x ?? 0) + (widths.get(el.id) ?? 0)));
      const maxY = Math.max(...selected.map((el) => (el.y ?? 0) + (heights.get(el.id) ?? 0)));
      const groupWidth = maxX - minX;
      const groupHeight = maxY - minY;

      const horizontalDelta = (() => {
        if (!options.horizontal) return 0;
        const allowBleedWidth = selected.every((el) => el.type === "image" && getMediaType(el) !== "logo");
        const allowFullWidth =
          allowBleedWidth || selected.every((el) => isCustomTextElement(el) || isShapeElement(el));
        const marginX = allowBleedWidth ? -bleedXRatio : allowFullWidth ? 0 : safeXRatio;
        const availableWidth = allowBleedWidth
          ? Math.max(1 + bleedXRatio * 2, 0)
          : allowFullWidth
          ? 1
          : Math.max(1 - safeXRatio * 2, 0);
        const targetLeft =
          options.horizontal === "left"
            ? marginX
            : options.horizontal === "right"
            ? marginX + Math.max(availableWidth - groupWidth, 0)
            : marginX + Math.max((availableWidth - groupWidth) / 2, 0);
        const desired = targetLeft - minX;

        let deltaMin = -Infinity;
        let deltaMax = Infinity;
        selected.forEach((el) => {
          const w = widths.get(el.id) ?? 0;
          const x = el.x ?? 0;
          const bounds = getBoundsForElement(el, w, heights.get(el.id) ?? 0);
          const minAllowed = bounds.minX;
          const maxAllowed = bounds.maxX;
          deltaMin = Math.max(deltaMin, minAllowed - x);
          deltaMax = Math.min(deltaMax, maxAllowed - x);
        });
        return clamp(desired, deltaMin, deltaMax);
      })();

      const verticalDelta = (() => {
        if (!options.vertical) return 0;
        const allowBleedHeight = selected.every((el) => el.type === "image" && getMediaType(el) !== "logo");
        const allowFullHeight =
          allowBleedHeight || selected.every((el) => isCustomTextElement(el) || isShapeElement(el));
        const marginY = allowBleedHeight ? -bleedYRatio : allowFullHeight ? 0 : safeYRatio;
        const availableHeight = allowBleedHeight
          ? Math.max(1 + bleedYRatio * 2, 0)
          : allowFullHeight
          ? 1
          : Math.max(1 - safeYRatio * 2, 0);
        const targetTop =
          options.vertical === "top"
            ? marginY
            : options.vertical === "bottom"
            ? marginY + Math.max(availableHeight - groupHeight, 0)
            : marginY + Math.max((availableHeight - groupHeight) / 2, 0);
        const desired = targetTop - minY;

        let deltaMin = -Infinity;
        let deltaMax = Infinity;
        selected.forEach((el) => {
          const h = heights.get(el.id) ?? 0;
          const y = el.y ?? 0;
          const bounds = getBoundsForElement(el, widths.get(el.id) ?? 0, h);
          const minAllowed = bounds.minY;
          const maxAllowed = bounds.maxY;
          deltaMin = Math.max(deltaMin, minAllowed - y);
          deltaMax = Math.min(deltaMax, maxAllowed - y);
        });
        return clamp(desired, deltaMin, deltaMax);
      })();

      return prev.map((element) => {
        const isSelected =
          targetIds.includes(element.id) &&
          element.side === selectedElementSide &&
          !element.locked &&
          element.type !== "border";
        if (!isSelected) return element;
        return {
          ...element,
          x: (element.x ?? 0) + horizontalDelta,
          y: (element.y ?? 0) + verticalDelta,
        };
      });
    });
  };

  const distributeEvenly = (direction: "horizontal" | "vertical") => {
    const targetIds = selectedIds;
    setElements((prev) => {
      const targets = prev.filter(
        (element) =>
          targetIds.includes(element.id) &&
          element.side === selectedElementSide &&
          !element.locked &&
          element.type !== "border"
      );
      if (targets.length < 2) return prev;
      const sizeFn = direction === "horizontal" ? getElementWidth : getElementHeight;
      const posKey = direction === "horizontal" ? "x" : "y";
      const sorted = [...targets].sort((a, b) => {
        const aPos = a[posKey] ?? 0;
        const bPos = b[posKey] ?? 0;
        return aPos - bPos;
      });
      const minStart = Math.min(...sorted.map((el) => (el[posKey] ?? 0)));
      const maxEnd = Math.max(...sorted.map((el) => (el[posKey] ?? 0) + sizeFn(el)));
      const totalSpan = sorted.reduce((sum, el) => sum + sizeFn(el), 0);
      const gap =
        sorted.length > 1 ? Math.max((maxEnd - minStart - totalSpan) / (sorted.length - 1), 0) : 0;
      let cursor = minStart;
      const nextPositions = new Map<string, number>();
      sorted.forEach((el) => {
        nextPositions.set(el.id, cursor);
        cursor += sizeFn(el) + gap;
      });
      return prev.map((el) => {
        const next = nextPositions.get(el.id);
        if (next === undefined) return el;
        return {
          ...el,
          [posKey]: next,
        } as CardElement;
      });
    });
  };

  const distributeSelection = (direction: "horizontal" | "vertical") => {
    if (selectionCount < 2) return;
    distributeEvenly(direction);
  };

  const setRotationForSelection = (rotation: number) => {
    const clamped = Math.max(-180, Math.min(rotation, 180));
    const targetIds = selectedIds;
    setElements((prev) =>
      prev.map((el) => {
        const isSelected =
          targetIds.includes(el.id) &&
          el.side === selectedElementSide &&
          !el.locked;
        if (!isSelected) return el;
        return { ...el, rotation: clamped };
      })
    );
  };
  const resizeSelection = (ratio: number, predicate: (element: CardElement) => boolean) => {
    applyToSelection(predicate, (element) => {
      const maxRatio =
        element.type === "qr"
          ? qrMaxSizeRatio
          : element.type === "image" && getMediaType(element) !== "logo"
          ? mediaMaxRatioForElement(element)
          : MAX_RESIZABLE_RATIO;
      const clamped = clamp(ratio, MIN_RESIZABLE_RATIO, maxRatio);
      if (element.type === "image" || element.type === "qr" || element.type === "shape") {
        return { ...element, width: clamped, height: element.type === "shape" ? element.height : clamped };
      }
      if (element.type === "line") {
        return { ...element, width: clamped };
      }
      return element;
    });
  };

  const alignElement = (
    id: string,
    options: { horizontal?: "left" | "center" | "right"; vertical?: "top" | "middle" | "bottom" }
  ) => {
    setElements((prev) =>
      prev.map((element) => {
        if (element.id !== id) return element;
        if (element.locked || element.type === "border") return element;

        const widthRatio = getElementWidth(element);
        const heightRatio = getElementHeight(element);
        const bounds = getBoundsForElement(element, widthRatio, heightRatio);

        const next = { ...element };
        if (options.horizontal) {
          if (options.horizontal === "left") next.x = bounds.minX;
          if (options.horizontal === "center") next.x = clamp((1 - widthRatio) / 2, bounds.minX, bounds.maxX);
          if (options.horizontal === "right") next.x = bounds.maxX;
        }
        if (options.vertical) {
          if (options.vertical === "top") next.y = bounds.minY;
          if (options.vertical === "middle") next.y = clamp((1 - heightRatio) / 2, bounds.minY, bounds.maxY);
          if (options.vertical === "bottom") next.y = bounds.maxY;
        }
        return next;
      })
    );
  };

  const alignSelection = (options: { horizontal?: "left" | "center" | "right"; vertical?: "top" | "middle" | "bottom" }) => {
    if (selectionCount > 1) {
      alignBulk(options);
      return;
    }
    if (activeElement) {
      alignElement(activeElement.id, options);
    }
  };

  const updateCustomText = (id: string, value: string) => {
    setElements((prev) =>
      prev.map((element) =>
        element.id === id
          ? {
              ...element,
              text: value,
            }
          : element
      )
    );
  };

  const getElementLabel = (element: CardElement) => {
    if (element.type === "qr") return "QR code";
    if (element.type === "image") return "Logo / image";
    if (element.type === "shape") return "Shape";
    if (element.type === "line") return "Line";
    if (element.type === "border") return "Border";
    if (element.contentKey && element.contentKey !== "custom") {
      const preset = TEXT_PRESET_OPTIONS.find((option) => option.value === element.contentKey);
      return preset?.label || "Text";
    }
    return "Custom text";
  };
  const handleResizeElement = (id: string, ratio: number) => {
    const target = cardElements.find((el) => el.id === id);
    if (target?.locked) return;
    const maxRatio =
      target && target.type === "image" && getMediaType(target) !== "logo"
        ? mediaMaxRatioForElement(target)
        : MAX_RESIZABLE_RATIO;
    const clamped = clamp(ratio, MIN_RESIZABLE_RATIO, maxRatio);
    setElements((prev) =>
      prev.map((element) =>
        element.id === id
          ? {
              ...element,
              width: clamped,
              height:
                element.type === "image" || element.type === "qr"
                  ? clamped
                  : element.type === "line"
                  ? element.height
                  : element.type === "shape" && (element.shapeVariant === "circle" || element.shapeVariant === "square")
                  ? clamped
                  : element.height,
            }
          : element
      )
    );
  };

  const renderCard = (
    side: CardSide,
    ref: RefObject<HTMLDivElement | null>,
    elements: CardElement[]
  ) => {
    const cutLineColor = getCutLineColor(side);
    return (
    <div
      style={{
        width: displayedWidth + bleedXPx * 2,
        maxWidth: "100%",
        height: displayedHeight + bleedYPx * 2,
        borderRadius: `${cornerRadiusPx + Math.max(bleedXPx, bleedYPx)}px`,
        background: getBackgroundForSide(side),
        color: cardDesign.textColor,
        boxShadow: "0 22px 50px rgba(15,23,42,0.22)",
        position: "relative",
        overflow: "hidden",
      }}
      ref={ref}
    >
      {cutLineVisible && (
        <>
          {guidesVisible && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: displayedWidth + bleedXPx * 2,
                height: displayedHeight + bleedYPx * 2,
                border: `1px solid ${bleedLineColor}`,
                borderRadius: cornerRadiusPx + Math.max(bleedXPx, bleedYPx),
                boxSizing: "border-box",
                pointerEvents: "none",
              }}
            />
          )}
          {/* Cut line (trim) */}
          <div
            style={{
              position: "absolute",
              left: contentOffsetX,
              top: contentOffsetY,
              width: displayedWidth,
              height: displayedHeight,
              border: `1px dashed ${cutLineColor}`,
              borderRadius: cornerRadiusPx,
              boxSizing: "border-box",
              pointerEvents: "none",
            }}
          />
          {guidesVisible && (
            <div
              style={{
                position: "absolute",
                left: contentOffsetX + safeXPx,
                top: contentOffsetY + safeYPx,
                width: Math.max(displayedWidth - safeXPx * 2, 0),
                height: Math.max(displayedHeight - safeYPx * 2, 0),
                border: `1px dashed ${safeLineColor}`,
                borderRadius: Math.max(cornerRadiusPx - safeXPx, 0),
                boxSizing: "border-box",
                pointerEvents: "none",
              }}
            />
          )}
        </>
      )}
      {showGrid && !previewMode && !exporting && (
        <div
          style={{
            position: "absolute",
            left: contentOffsetX,
            top: contentOffsetY,
            width: displayedWidth,
            height: displayedHeight,
            pointerEvents: "none",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "16px 16px, 16px 16px",
            mixBlendMode: "screen",
            opacity: 0.7,
            zIndex: 2,
          }}
        />
      )}
      {elements.map((element) => renderElement(element))}
    </div>
  );
  };

  return (
    <>
      <div
        style={{
          background: "#ffffff",
          border: "1px solid rgba(15,23,42,0.08)",
          borderRadius: "20px",
          padding: "24px 24px 28px",
          boxShadow: "0 24px 60px rgba(15,23,42,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          marginBottom: "24px",
          position: "relative",
        }}
        ref={previewWrapperRef}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
          ref={headerRowRef}
        >
          <span style={{ fontSize: "12px", letterSpacing: "0.14em", color: "#667085" }}>
            CARD PREVIEW
          </span>
            <span style={{ fontSize: "12px", color: "#98a2b3" }}>
              Card size: 86mm x 54mm • {cardDesign.resolution} DPI export
            </span>
          </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "14px",
            alignItems: "center",
            marginTop: "6px",
            fontSize: "12px",
            color: "#475467",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ display: "inline-block", width: "14px", height: "14px", border: `2px solid ${bleedLineColor}` }} />
            <span>Bleed (extra area, not in final cut)</span>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                display: "inline-block",
                width: "14px",
                height: "14px",
                border: "2px dashed rgba(148,163,184,0.9)",
              }}
            />
            <span>Cut line (final card size)</span>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                display: "inline-block",
                width: "14px",
                height: "14px",
                border: `2px dashed ${safeLineColor}`,
              }}
            />
            <span>Safe area (keep text/logos inside)</span>
          </span>
        </div>
        {showPlacementWarning && (
          <div
            style={{
              marginTop: "4px",
              padding: "8px 12px",
              borderRadius: "12px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#ef4444",
              fontSize: "12px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              maxWidth: "100%",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12" y2="17" />
            </svg>
            Danger zone: elements outside the safe area could be cut off during production.
          </div>
        )}
        {activeElement && toolbarPosition && (
          <div
            style={{
              position: "absolute",
              left: toolbarPosition.left,
              top: toolbarPosition.top,
              transform: "translate(-100%, 0)",
              background: "rgba(15,23,42,0.96)",
              color: "#ffffff",
              padding: "12px 14px",
              borderRadius: "14px",
              boxShadow: "0 18px 40px rgba(15,23,42,0.24)",
              border: "1px solid rgba(255,255,255,0.08)",
              minWidth: "280px",
              maxWidth: "360px",
              maxHeight: "calc(100% - 24px)",
              overflowY: "auto",
              zIndex: 5,
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            ref={toolbarRef}
          >
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={clearSelection}
                aria-label="Close quick edit"
                title="Close"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#cbd5e1",
                  cursor: "pointer",
                  fontSize: "16px",
                  padding: "4px",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px", letterSpacing: "0.08em", color: "#cbd5e1" }}>QUICK EDIT</span>
                <span style={{ fontWeight: 700, fontSize: "13px" }}>{getElementLabel(activeElement)}</span>
                <span style={{ fontSize: "12px", color: "#e2e8f0" }}>
                  {activeElement.side === "front" ? "Front" : "Back"} side
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => toggleLockElement(activeElement.id)}
                  style={{
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: activeElement.locked ? "#22c55e" : "transparent",
                    color: activeElement.locked ? "#0b1b0f" : "#ffffff",
                    borderRadius: "10px",
                    padding: "8px 10px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                  }}
                  aria-label={activeElement.locked ? "Unlock element" : "Lock element"}
                  title={activeElement.locked ? "Unlock" : "Lock"}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {activeElement.locked ? (
                      <>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M12 15v2" />
                      </>
                    ) : (
                      <>
                        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M12 15v2" />
                      </>
                    )}
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={duplicateSelection}
                  style={{
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(255,255,255,0.08)",
                    color: "#ffffff",
                    borderRadius: "10px",
                    padding: "8px 10px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                  }}
                  aria-label="Duplicate element"
                  title="Duplicate"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="9" y="9" width="10" height="10" rx="2" />
                    <rect x="5" y="5" width="10" height="10" rx="2" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const overlay = document.createElement("div");
                    overlay.style.position = "fixed";
                    overlay.style.inset = "0";
                    overlay.style.background = "rgba(15,23,42,0.55)";
                    overlay.style.zIndex = "9999";
                    overlay.style.display = "flex";
                    overlay.style.alignItems = "center";
                    overlay.style.justifyContent = "center";

                    const modal = document.createElement("div");
                    modal.style.background = "#0f172a";
                    modal.style.border = "1px solid rgba(255,255,255,0.1)";
                    modal.style.borderRadius = "14px";
                    modal.style.padding = "18px 20px";
                    modal.style.width = "320px";
                    modal.style.boxShadow = "0 24px 60px rgba(0,0,0,0.25)";
                    modal.style.color = "#e2e8f0";
                    modal.style.fontFamily = "inherit";

                    const title = document.createElement("div");
                    title.textContent = "Delete element?";
                    title.style.fontSize = "16px";
                    title.style.fontWeight = "700";
                    title.style.marginBottom = "6px";
                    modal.appendChild(title);

                    const body = document.createElement("div");
                    body.textContent = "This will remove the selected element from the card.";
                    body.style.fontSize = "13px";
                    body.style.color = "#cbd5e1";
                    body.style.marginBottom = "12px";
                    modal.appendChild(body);

                    const actions = document.createElement("div");
                    actions.style.display = "flex";
                    actions.style.gap = "10px";
                    actions.style.justifyContent = "flex-end";

                    const cancel = document.createElement("button");
                    cancel.textContent = "No";
                    cancel.style.border = "1px solid rgba(255,255,255,0.2)";
                    cancel.style.background = "transparent";
                    cancel.style.color = "#e2e8f0";
                    cancel.style.borderRadius = "10px";
                    cancel.style.padding = "8px 12px";
                    cancel.style.cursor = "pointer";
                    cancel.onclick = () => overlay.remove();

                    const confirm = document.createElement("button");
                    confirm.textContent = "Yes, delete";
                    confirm.style.border = "none";
                    confirm.style.background = "linear-gradient(135deg, #ef4444, #f97316)";
                    confirm.style.color = "#0f172a";
                    confirm.style.fontWeight = "700";
                    confirm.style.borderRadius = "10px";
                    confirm.style.padding = "8px 14px";
                    confirm.style.cursor = "pointer";
                    confirm.onclick = () => {
                      removeElement(activeElement.id);
                      clearSelection();
                      overlay.remove();
                    };

                    actions.appendChild(cancel);
                    actions.appendChild(confirm);
                    modal.appendChild(actions);

                    overlay.appendChild(modal);
                    document.body.appendChild(overlay);
                  }}
                  style={{
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(239,68,68,0.14)",
                    color: "#fecdd3",
                    borderRadius: "10px",
                    padding: "8px 10px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "40px",
                    height: "36px",
                  }}
                  aria-label="Remove element"
                  title="Remove"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
                {/* Layer controls temporarily hidden
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px" }}>
                  <div style={{ fontSize: "12px", color: "#cbd5e1" }}>Layer</div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => activeElement && moveElementLayer(activeElement.id, "backward")}
                      disabled={!activeElement}
                      style={{
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "rgba(255,255,255,0.06)",
                        color: "#ffffff",
                        padding: "6px 10px",
                        borderRadius: "10px",
                        cursor: activeElement ? "pointer" : "not-allowed",
                      }}
                      title="Move backward"
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => activeElement && moveElementLayer(activeElement.id, "forward")}
                      disabled={!activeElement}
                      style={{
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "rgba(255,255,255,0.06)",
                        color: "#ffffff",
                        padding: "6px 10px",
                        borderRadius: "10px",
                        cursor: activeElement ? "pointer" : "not-allowed",
                      }}
                      title="Move forward"
                    >
                      Up
                    </button>
                  </div>
                </div>
                */}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                marginTop: "8px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: "12px", color: "#cbd5e1" }}>Align</span>
              <button
                type="button"
                onClick={() => alignSelection({ horizontal: "left" })}
                disabled={activeElement.locked}
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "#ffffff",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "12px",
                  cursor: activeElement.locked ? "not-allowed" : "pointer",
                }}
                aria-label="Align left"
                title="Align left"
              >
                <AlignIcon variant="left" />
              </button>
              <button
                type="button"
                onClick={() => alignSelection({ horizontal: "center" })}
                disabled={activeElement.locked}
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "#ffffff",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "12px",
                  cursor: activeElement.locked ? "not-allowed" : "pointer",
                }}
                aria-label="Align center"
                title="Align center"
              >
                <AlignIcon variant="center" />
              </button>
              <button
                type="button"
                onClick={() => alignSelection({ horizontal: "right" })}
                disabled={activeElement.locked}
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "#ffffff",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "12px",
                  cursor: activeElement.locked ? "not-allowed" : "pointer",
                }}
                aria-label="Align right"
                title="Align right"
              >
                <AlignIcon variant="right" />
              </button>
              <button
                type="button"
                onClick={() => alignSelection({ vertical: "top" })}
                disabled={activeElement.locked}
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "#ffffff",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "12px",
                  cursor: activeElement.locked ? "not-allowed" : "pointer",
                }}
                aria-label="Align top"
                title="Align top"
              >
                <AlignIcon variant="top" />
              </button>
              <button
                type="button"
                onClick={() => alignSelection({ vertical: "middle" })}
                disabled={activeElement.locked}
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "#ffffff",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "12px",
                  cursor: activeElement.locked ? "not-allowed" : "pointer",
                }}
                aria-label="Align middle"
                title="Align middle"
              >
                <AlignIcon variant="middle" />
              </button>
              <button
                type="button"
                onClick={() => alignSelection({ vertical: "bottom" })}
                disabled={activeElement.locked}
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "#ffffff",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "12px",
                  cursor: activeElement.locked ? "not-allowed" : "pointer",
                }}
                aria-label="Align bottom"
                title="Align bottom"
              >
                <AlignIcon variant="bottom" />
              </button>
            </div>
            {showPlacementWarning && (
              <div
                style={{
                  marginTop: "6px",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  background: "rgba(255,122,0,0.1)",
                  color: "#ffb86c",
                  fontSize: "12px",
                  lineHeight: 1.4,
                }}
              >
                Placing items outside the safe area might lead to trimming when printed. Proceed carefully.
              </div>
            )}
            {activeElement.type === "text" && canShowIcon(activeElement) && (
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#cbd5e1", marginTop: "6px" }}>
                <input
                  type="checkbox"
                  checked={!!activeElement.showIcon}
                  disabled={activeElement.locked}
                  onChange={(event) =>
                    applyToSelection(
                      (el) => el.type === "text" && canShowIcon(el),
                      (el) => ({ ...el, showIcon: event.target.checked })
                    )
                  }
                  style={{ width: "16px", height: "16px" }}
                />
                Show icon for this field
              </label>
            )}
            {activeElement.type === "shape" && (
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#cbd5e1" }}>
                  Opacity
                  <input
                    type="range"
                    min={MIN_OPACITY}
                    max={MAX_OPACITY}
                    step={0.05}
                    value={activeElement.opacity ?? 1}
                    disabled={activeElement.locked}
                    onChange={(event) =>
                      applyToSelection(
                        (el) => el.type === "shape",
                        (el) => ({ ...el, opacity: clamp(parseFloat(event.target.value) || 1, MIN_OPACITY, MAX_OPACITY) })
                      )
                    }
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#cbd5e1" }}>
                  Shape variant
                  <select
                    value={activeElement.shapeVariant ?? "rectangle"}
                    disabled={activeElement.locked}
                    onChange={(event) =>
                      applyToSelection(
                        (el) => el.type === "shape",
                        (el) => ({ ...el, shapeVariant: event.target.value as CardElement["shapeVariant"] })
                      )
                    }
                    style={{
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.25)",
                      padding: "8px 10px",
                      background: "rgba(255,255,255,0.05)",
                      color: "#ffffff",
                    }}
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="circle">Circle</option>
                    <option value="square">Square</option>
                    <option value="triangle">Triangle</option>
                  </select>
                </label>
              </div>
            )}
            {activeElement.type === "border" && (
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#cbd5e1" }}>
                  Opacity
                  <input
                    type="range"
                    min={MIN_OPACITY}
                    max={MAX_OPACITY}
                    step={0.05}
                    value={activeElement.opacity ?? 1}
                    disabled={activeElement.locked}
                    onChange={(event) =>
                      applyToSelection(
                        (el) => el.type === "border",
                        (el) => ({ ...el, opacity: clamp(parseFloat(event.target.value) || 1, MIN_OPACITY, MAX_OPACITY) })
                      )
                    }
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#cbd5e1" }}>
                  Border color
                  <input
                    type="text"
                    value={activeElement.borderColor || "#0f172a"}
                    onChange={(event) =>
                      applyToSelection(
                        (el) => el.type === "border",
                        (el) => ({ ...el, borderColor: event.target.value })
                      )
                    }
                    placeholder="#000000"
                    disabled={activeElement.locked}
                    style={{
                      width: "100%",
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.25)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#ffffff",
                      padding: "8px 10px",
                      marginTop: "4px",
                    }}
                  />
                  <input
                    type="color"
                    value={activeElement.borderColor || "#0f172a"}
                    onChange={(event) =>
                      applyToSelection(
                        (el) => el.type === "border",
                        (el) => ({ ...el, borderColor: event.target.value })
                      )
                    }
                    disabled={activeElement.locked}
                    style={{
                      width: "100%",
                      height: "34px",
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.25)",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  />
                </label>
              </div>
            )}
            {selectionCount > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  marginTop: "8px",
                  fontSize: "12px",
                  color: "#cbd5e1",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Rotate (applies to all selected)</span>
                  <span>{Math.round(activeElement.rotation ?? 0)}°</span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={activeElement.rotation ?? 0}
                  onChange={(event) => setRotationForSelection(parseInt(event.target.value, 10))}
                  disabled={!anyUnlockedSelected}
                  style={{ width: "100%" }}
                />
              </div>
            )}
            {hasMultiSelection && (
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  marginTop: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: "12px", color: "#cbd5e1" }}>Tidy up</span>
                <button
                  type="button"
                  onClick={() => distributeSelection("horizontal")}
                  disabled={!canDistributeX}
                  style={{
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: canDistributeX ? "transparent" : "rgba(255,255,255,0.08)",
                    color: canDistributeX ? "#ffffff" : "rgba(255,255,255,0.5)",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    fontSize: "12px",
                    cursor: canDistributeX ? "pointer" : "not-allowed",
                  }}
                >
                  Space evenly (X)
                </button>
                <button
                  type="button"
                  onClick={() => distributeSelection("vertical")}
                  disabled={!canDistributeY}
                  style={{
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: canDistributeY ? "transparent" : "rgba(255,255,255,0.08)",
                    color: canDistributeY ? "#ffffff" : "rgba(255,255,255,0.5)",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    fontSize: "12px",
                    cursor: canDistributeY ? "pointer" : "not-allowed",
                  }}
                >
                  Space evenly (Y)
                </button>
              </div>
            )}
            {activeElement.type === "text" && (
              <>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px", fontSize: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1" }}>
                    <span>Font size</span>
                    <span>{ratioToPt(activeElement.fontSize ?? 0.05)} pt</span>
                  </div>
                  <input
                    type="range"
                    min={minFontRatio}
                    max={MAX_FONT_RATIO}
                    step={0.001}
                    value={activeElement.fontSize ?? 0.05}
                    disabled={activeElement.locked}
                    onChange={(event) => {
                      const next = clamp(parseFloat(event.target.value) || minFontRatio, minFontRatio, MAX_FONT_RATIO);
                      applyToSelection((el) => el.type === "text", (el) => ({ ...el, fontSize: next }));
                    }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#cbd5e1" }}>
                  Opacity
                  <input
                    type="range"
                    min={MIN_OPACITY}
                    max={MAX_OPACITY}
                    step={0.05}
                    value={activeElement.opacity ?? 1}
                    disabled={activeElement.locked}
                    onChange={(event) => {
                      const next = clamp(parseFloat(event.target.value) || 1, MIN_OPACITY, MAX_OPACITY);
                      applyToSelection(
                        (el) => el.type === "text",
                        (el) => ({ ...el, opacity: next })
                      );
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const next = (activeElement.fontWeight ?? DEFAULT_FONT_WEIGHT) === "700" ? ("400" as FontWeightOption) : ("700" as FontWeightOption);
                    applyToSelection(
                      (el) => el.type === "text",
                      (el) => ({ ...el, fontWeight: next })
                    );
                  }}
                  disabled={activeElement.locked}
                  aria-label="Toggle bold"
                  title="Bold"
                  style={{
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: (activeElement.fontWeight ?? DEFAULT_FONT_WEIGHT) === "700" ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.07)",
                    color: (activeElement.fontWeight ?? DEFAULT_FONT_WEIGHT) === "700" ? "#ffffff" : "rgba(255,255,255,0.85)",
                    borderRadius: "10px",
                    padding: "8px 10px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: activeElement.locked ? "not-allowed" : "pointer",
                    marginTop: "6px",
                    width: "40px",
                    height: "36px",
                    marginRight: "6px",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 900,
                      fontSize: "14px",
                      lineHeight: 1,
                      color: (activeElement.fontWeight ?? DEFAULT_FONT_WEIGHT) === "700" ? "#ffffff" : "rgba(255,255,255,0.85)",
                      opacity: (activeElement.fontWeight ?? DEFAULT_FONT_WEIGHT) === "700" ? 1 : 0.75,
                    }}
                  >
                    B
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = (activeElement.fontStyle ?? DEFAULT_FONT_STYLE) === "italic" ? ("normal" as FontStyleOption) : ("italic" as FontStyleOption);
                    applyToSelection(
                      (el) => el.type === "text",
                      (el) => ({ ...el, fontStyle: next })
                    );
                  }}
                  disabled={activeElement.locked}
                  aria-label="Toggle italic"
                  title="Italic"
                  style={{
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: (activeElement.fontStyle ?? DEFAULT_FONT_STYLE) === "italic" ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.07)",
                    color: (activeElement.fontStyle ?? DEFAULT_FONT_STYLE) === "italic" ? "#ffffff" : "rgba(255,255,255,0.85)",
                    borderRadius: "10px",
                    padding: "8px 10px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: activeElement.locked ? "not-allowed" : "pointer",
                    marginTop: "6px",
                    width: "40px",
                    height: "36px",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "14px",
                      lineHeight: 1,
                      color: (activeElement.fontStyle ?? DEFAULT_FONT_STYLE) === "italic" ? "#ffffff" : "rgba(255,255,255,0.85)",
                      opacity: (activeElement.fontStyle ?? DEFAULT_FONT_STYLE) === "italic" ? 1 : 0.75,
                      fontStyle: "italic",
                    }}
                  >
                    I
                  </span>
                </button>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#cbd5e1" }}>
                  Font family
                  <select
                    value={activeElement.fontFamily ?? cardDesign.fontFamily ?? "default"}
                    onChange={(event) =>
                      applyToSelection(
                        (el) => el.type === "text",
                        (el) => ({ ...el, fontFamily: event.target.value as FontOption })
                      )
                    }
                    disabled={activeElement.locked}
                    style={{
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#ffffff",
                      borderRadius: "10px",
                      padding: "8px 10px",
                    }}
                  >
                    {FONT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#cbd5e1" }}>
                  Text colour
                  <input
                    type="text"
                    value={activeElement.color || cardDesign.textColor}
                    onChange={(event) =>
                      applyToSelection(
                        (el) => el.type === "text",
                        (el) => ({ ...el, color: event.target.value })
                      )
                    }
                    disabled={activeElement.locked}
                    style={{
                      width: "100%",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#ffffff",
                      padding: "8px 10px",
                    }}
                  />
                  <input
                    type="color"
                    value={activeElement.color || cardDesign.textColor}
                    onChange={(event) =>
                      applyToSelection(
                        (el) => el.type === "text",
                        (el) => ({ ...el, color: event.target.value })
                      )
                    }
                    disabled={activeElement.locked}
                    style={{
                      width: "100%",
                      height: "32px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "transparent",
                    }}
                  />
                </label>
              </>
            )}
            {(activeElement.type === "image" || activeElement.type === "qr") && (
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px", fontSize: "12px", color: "#cbd5e1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <span>
                    Size{" "}
                    {activeElement.type === "image" && (
                      <span
                        style={{
                          marginLeft: 6,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          fontSize: "11px",
                        }}
                      >
                        {getMediaType(activeElement) === "logo" ? "Logo" : "Image"}
                      </span>
                    )}
                  </span>
                  <span>{Math.round(getElementWidth(activeElement) * cardWidthPx)} px</span>
                </div>
                {activeElement.type === "image" && (
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                    {getMediaType(activeElement) === "logo" ? "Logo selected (safe area bound)" : "Image selected (full card allowed)"}
                  </div>
                )}
                <input
                  type="range"
                  min={Math.round(mediaMinSliderPx)}
                  max={Math.round(mediaMaxSliderPxForElement(activeElement))}
                  step={1}
                  value={Math.round(getElementWidth(activeElement) * cardWidthPx)}
                  onChange={(event) =>
                    resizeSelection(parseFloat(event.target.value) / cardWidthPx, (el) =>
                      el.type === "qr" ||
                      (el.type === "image" &&
                        (!mixedImageSelection ? true : getMediaType(el) === getMediaType(activeElement)))
                    )
                  }
                  disabled={activeElement.locked || (mixedImageSelection && activeElement.type === "image")}
                />
                {activeElement.type === "qr" && (
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px", fontSize: "12px", color: "#cbd5e1" }}>
                    QR colour
                    <input
                      type="text"
                      value={activeElement.qrColor || "#000000"}
                      onChange={(event) =>
                        applyToSelection(
                          (el) => el.type === "qr",
                          (el) => ({ ...el, qrColor: event.target.value })
                        )
                      }
                      disabled={activeElement.locked}
                      style={{
                        width: "100%",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.05)",
                        color: "#ffffff",
                        padding: "8px 10px",
                      }}
                    />
                    <input
                      type="color"
                      value={activeElement.qrColor || "#000000"}
                      onChange={(event) =>
                        applyToSelection(
                          (el) => el.type === "qr",
                          (el) => ({ ...el, qrColor: event.target.value })
                        )
                      }
                      disabled={activeElement.locked}
                      style={{
                        width: "100%",
                        height: "32px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "transparent",
                      }}
                    />
                  </label>
                )}
                {activeElement.type === "image" && (
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px", fontSize: "12px", color: "#cbd5e1" }}>
                    Opacity
                    <input
                      type="range"
                      min={MIN_OPACITY}
                      max={MAX_OPACITY}
                      step={0.05}
                      value={activeElement.opacity ?? 1}
                      onChange={(event) =>
                        applyToSelection(
                          (el) =>
                            el.type === "image" &&
                            (!mixedImageSelection ? true : getMediaType(el) === getMediaType(activeElement)),
                          (el) => ({
                            ...el,
                            opacity: clamp(parseFloat(event.target.value) || 1, MIN_OPACITY, MAX_OPACITY),
                          })
                        )
                      }
                      disabled={activeElement.locked || (mixedImageSelection && activeElement.type === "image")}
                    />
                  </label>
                )}
              </label>
            )}
            {activeElement.type === "shape" && (
              <>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px", fontSize: "12px", color: "#cbd5e1" }}>
                  Fill
                  <input
                    type="color"
                    value={activeElement.backgroundColor || cardDesign.textColor}
                    onChange={(event) =>
                      applyToSelection(
                        (el) => el.type === "shape",
                        (el) => ({ ...el, backgroundColor: event.target.value })
                      )
                    }
                    disabled={activeElement.locked}
                    style={{
                      width: "100%",
                      height: "32px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "transparent",
                    }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#cbd5e1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Width</span>
                    <span>{Math.round(getElementWidth(activeElement) * cardWidthPx)} px</span>
                  </div>
                  <input
                    type="range"
                    min={Math.round(minElementSizePx)}
                    max={Math.round(maxElementSizePx)}
                    step={1}
                    value={Math.round(getElementWidth(activeElement) * cardWidthPx)}
                    onChange={(event) =>
                      resizeSelection(parseFloat(event.target.value) / cardWidthPx, (el) => el.type === "shape")
                    }
                    disabled={activeElement.locked}
                  />
                </label>
              </>
            )}
            {activeElement.type === "line" && (
              <>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px", fontSize: "12px", color: "#cbd5e1" }}>
                  Colour
                  <input
                    type="text"
                    value={activeElement.backgroundColor || cardDesign.textColor}
                    onChange={(event) =>
                      setElements((prev) =>
                        prev.map((el) =>
                          el.id === activeElement.id ? { ...el, backgroundColor: event.target.value } : el
                        )
                      )
                    }
                    disabled={activeElement.locked}
                    style={{
                      width: "100%",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#ffffff",
                      padding: "8px 10px",
                      marginBottom: "4px",
                    }}
                  />
                  <input
                    type="color"
                    value={activeElement.backgroundColor || cardDesign.textColor}
                    onChange={(event) =>
                      setElements((prev) =>
                        prev.map((el) =>
                          el.id === activeElement.id ? { ...el, backgroundColor: event.target.value } : el
                        )
                      )
                    }
                    disabled={activeElement.locked}
                    style={{
                      width: "100%",
                      height: "32px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "transparent",
                    }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#cbd5e1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Length</span>
                    <span>{Math.round(getElementWidth(activeElement) * cardWidthPx)} px</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={0.95}
                    step={0.01}
                    value={getElementWidth(activeElement)}
                    onChange={(event) => handleResizeElement(activeElement.id, parseFloat(event.target.value))}
                    disabled={activeElement.locked}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#cbd5e1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Thickness</span>
                    <span>{Math.round(getElementHeight(activeElement) * cardHeightPx)} px</span>
                  </div>
                  <input
                    type="range"
                    min={0.005}
                    max={0.05}
                    step={0.002}
                    value={getElementHeight(activeElement)}
                    onChange={(event) =>
                      setElements((prev) =>
                        prev.map((el) =>
                          el.id === activeElement.id
                            ? { ...el, height: clamp(parseFloat(event.target.value), 0.005, 0.05) }
                            : el
                        )
                      )
                    }
                    disabled={activeElement.locked}
                  />
                </label>
              </>
            )}
            {activeElement.type === "border" && (
              <>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px", fontSize: "12px", color: "#cbd5e1" }}>
                  Border colour
                  <input
                    type="color"
                    value={activeElement.borderColor || "#0f172a"}
                    onChange={(event) =>
                      setElements((prev) =>
                        prev.map((el) =>
                          el.id === activeElement.id ? { ...el, borderColor: event.target.value } : el
                        )
                      )
                    }
                    disabled={activeElement.locked}
                    style={{
                      width: "100%",
                      height: "32px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "transparent",
                    }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#cbd5e1" }}>
                  Border style
                  <select
                    value={activeElement.borderStyle ?? "solid"}
                    disabled={activeElement.locked}
                    onChange={(event) =>
                      applyToSelection(
                        (el) => el.type === "border",
                        (el) => ({ ...el, borderStyle: event.target.value as CardElement["borderStyle"] })
                      )
                    }
                    style={{
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.25)",
                      padding: "8px 10px",
                      background: "rgba(255,255,255,0.05)",
                      color: "#ffffff",
                    }}
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#cbd5e1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Thickness</span>
                    <span>{Math.round(activeElement.borderThickness ?? 2)} px</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={24}
                    step={1}
                    value={activeElement.borderThickness ?? 2}
                    onChange={(event) =>
                      setElements((prev) =>
                        prev.map((el) =>
                          el.id === activeElement.id
                            ? { ...el, borderThickness: parseInt(event.target.value, 10) }
                            : el
                        )
                      )
                    }
                    disabled={activeElement.locked}
                  />
                </label>
              </>
            )}
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "12px", letterSpacing: "0.12em", color: "#98a2b3" }}>
              FRONT
            </span>
            {renderCard("front", frontRef, frontElements)}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "12px", letterSpacing: "0.12em", color: "#98a2b3" }}>
              BACK
            </span>
            {renderCard("back", backRef, backElements)}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#ffffff",
          border: "1px solid rgba(15,23,42,0.08)",
          borderRadius: "20px",
          padding: "24px 24px 32px",
          boxShadow: "0 24px 60px rgba(15,23,42,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
          <label style={{ fontSize: "13px", color: "#475467", display: "flex", flexDirection: "column", gap: "6px" }}>
            Resolution
            <select
              value={cardDesign.resolution}
              onChange={(e) => updateCardDesign({ resolution: e.target.value as CardResolution })}
              style={{
                borderRadius: "10px",
                border: "1px solid #d0d5dd",
                padding: "10px 12px",
                fontSize: "14px",
              }}
            >
              {resolutionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span style={{ fontSize: "12px", color: "#6b7280" }}>
              Lower DPI may lead to diminished print detail
            </span>
          </label>
            <div style={{ fontSize: "13px", color: "#475467", display: "flex", flexDirection: "column", gap: "6px" }}>
              Orientation
              <div
                style={{
                  display: "inline-flex",
                  border: "1px solid #d0d5dd",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                {orientationOptions.map((option) => {
                  const selected = orientation === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateCardDesign({ orientation: option.value })}
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        border: "none",
                        background: selected ? "#000000" : "transparent",
                        color: selected ? "#ffffff" : "#0f172a",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <label style={{ fontSize: "13px", color: "#475467", display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={showGuidesOverlay}
                onChange={(e) => setShowGuidesOverlay(e.target.checked)}
                style={{ width: "16px", height: "16px" }}
              />
              Show bleed / safe guides
            </label>
            <label style={{ fontSize: "13px", color: "#475467", display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                style={{ width: "16px", height: "16px" }}
              />
              Show grid overlay
            </label>
          </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span style={{ fontSize: "13px", color: "#475467", fontWeight: 500 }}>Background fill</span>
            <div style={{ display: "flex", gap: "8px", marginBottom: "6px", fontSize: "12px", color: "#475467" }}>
              <button
                type="button"
                onClick={() => setSelectedElementSide("front")}
                style={{
                  border: "1px solid #d0d5dd",
                  background: selectedElementSide === "front" ? "#0f172a" : "#ffffff",
                  color: selectedElementSide === "front" ? "#ffffff" : "#0f172a",
                  borderRadius: "10px",
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Front
              </button>
              <button
                type="button"
                onClick={() => setSelectedElementSide("back")}
                style={{
                  border: "1px solid #d0d5dd",
                  background: selectedElementSide === "back" ? "#0f172a" : "#ffffff",
                  color: selectedElementSide === "back" ? "#ffffff" : "#0f172a",
                  borderRadius: "10px",
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Back
              </button>
            </div>
            <div style={{ display: "inline-flex", border: "1px solid #d0d5dd", borderRadius: "12px", overflow: "hidden" }}>
              {(["solid", "gradient2", "gradient3"] as BackgroundFillMode[]).map((mode) => {
                const isActive = backgroundMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      if (mode === "solid") {
                        setBackgroundForActiveSide("#0f172a");
                      } else if (mode === "gradient2") {
                        setBackgroundForActiveSide(buildGradient(DEFAULT_GRADIENT_TWO));
                      } else {
                        setBackgroundForActiveSide(buildGradient(DEFAULT_GRADIENT_THREE));
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      border: "none",
                      background: isActive ? "#000" : "transparent",
                      color: isActive ? "#fff" : "#0f172a",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {mode === "solid"
                      ? "Solid"
                      : mode === "gradient2"
                      ? "Gradient 2"
                      : "Gradient 3"}
                  </button>
                );
              })}
            </div>
            {backgroundMode === "solid" && (
              <>
                <input
                  type="text"
                  value={activeBackground}
                  onChange={(event) => setBackgroundForActiveSide(event.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid #d0d5dd",
                    padding: "10px 12px",
                    fontSize: "14px",
                  }}
                  placeholder="#000000"
                />
                <input
                  type="color"
                  value={activeBackground}
                  onChange={(event) => setBackgroundForActiveSide(event.target.value)}
                  style={{
                    width: "100%",
                    height: "36px",
                    borderRadius: "8px",
                    border: "1px solid #d0d5dd",
                    cursor: "pointer",
                  }}
                />
              </>
            )}
            {backgroundMode !== "solid" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>Quick presets</span>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {Object.entries(gradientCatalog).map(([label, stops]) => {
                        const gradientCss = buildGradient(stops);
                        const isActive = activeBackground === gradientCss;
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => setBackgroundForActiveSide(gradientCss)}
                            style={{
                              width: "90px",
                              height: "32px",
                              borderRadius: "8px",
                            border: isActive ? "2px solid #0f172a" : "1px solid #d0d5dd",
                            background: gradientCss,
                            color: "#fff",
                            fontSize: "11px",
                            fontWeight: 600,
                            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)",
                            cursor: "pointer",
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {activeGradientStops.map((stop, index) => (
                  <input
                    key={index}
                    type="color"
                    value={stop}
                    onChange={(event) => {
                      const updatedStops = [...activeGradientStops];
                      updatedStops[index] = event.target.value;
                      const targetStops =
                        backgroundMode === "gradient3"
                          ? updatedStops.slice(0, 3)
                          : updatedStops.slice(0, 2);
                      setBackgroundForActiveSide(buildGradient(targetStops));
                    }}
                    style={{
                      width: "100%",
                      height: "36px",
                      borderRadius: "8px",
                      border: "1px solid #d0d5dd",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <label style={{ fontSize: "13px", color: "#475467", display: "flex", flexDirection: "column", gap: "6px" }}>
            Text colour
            <input
              type="text"
              value={cardDesign.textColor}
              onChange={(e) => updateCardDesign({ textColor: e.target.value })}
              style={{
                width: "100%",
                borderRadius: "8px",
                border: "1px solid #d0d5dd",
                padding: "8px 10px",
              }}
              placeholder="#000000"
            />
            <input
              type="color"
              value={cardDesign.textColor}
              onChange={(e) => updateCardDesign({ textColor: e.target.value })}
              style={{
                width: "100%",
                height: "36px",
                border: "1px solid #d0d5dd",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            />
            <span style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>Font</span>
            <select
              value={cardDesign.fontFamily ?? "default"}
              onChange={(event) => updateCardDesign({ fontFamily: event.target.value as FontOption })}
              style={{
                border: "1px solid #d0d5dd",
                borderRadius: "8px",
                padding: "8px 10px",
                fontSize: "13px",
                marginTop: "4px",
              }}
            >
              <option value="sfpro">SF Pro</option>
              <option value="manrope">Manrope</option>
              <option value="-apple-system">Apple System</option>
              <option value="helveticas">Helvetica</option>
              <option value="arial">Arial</option>
              <option value="serif">Sans Serif</option>
              <option value="playfair">Playfair</option>
              <option value="times">Times New Roman</option>
              <option value="serif">Serif</option>
              <option value="mono">Monospace</option>
              <option value="courier">Courier New</option>
              <option value="pacifio">Pacifio</option>
              <option value="brush">Brush</option>
              <option value="cursive">Cursive</option>
              <option value="poppins">Poppins</option>
              <option value="avenir">Avenir</option>

            </select>
          </label>
        </div>

        <div style={{ display: "grid", gap: "12px" }}>
          <label style={{ fontSize: "13px", color: "#475467", display: "flex", flexDirection: "column", gap: "6px" }}>
            Headline
            <input
              type="text"
              value={cardDesign.headline}
              onChange={(e) => updateCardDesign({ headline: e.target.value })}
              placeholder="Your Headline Here"
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #d0d5dd",
                fontSize: "14px",
              }}
            />
          </label>

          <label style={{ fontSize: "13px", color: "#475467", display: "flex", flexDirection: "column", gap: "6px" }}>
            Tagline
            <input
              type="text"
              value={cardDesign.tagline || ""}
              onChange={(e) => updateCardDesign({ tagline: e.target.value })}
              placeholder="Your Tagline Here"
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #d0d5dd",
                fontSize: "14px",
              }}
            />
          </label>
        </div>

        <div style={{ borderTop: "1px solid #e5e5ea", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#475467" }}>Logos</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {logoAssets.length ? (
                logoAssets.map((entry, index) => {
                  return (
                  <div key={`logo-${index}`} style={assetCardStyle()}>
                      <img
                        src={entry.url}
                        alt={`Logo ${index + 1}`}
                        style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 8, border: "1px solid #d0d5dd" }}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Logo&nbsp;{index + 1}</p>
                      </div>
                    <div style={actionRowStyle}>
                      <button
                        type="button"
                        onClick={() => addImageElementFromLibrary(entry.url)}
                        style={{
                          border: "none",
                          background: "#0f172a",
                          color: "#ffffff",
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Add to card
                      </button>
                    </div>
                    {onRemoveAsset && (
                      <button
                        type="button"
                        onClick={() => onRemoveAsset(entry.url)}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#ff6b6b",
                          padding: "4px 0",
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Remove from library
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
                <p style={{ margin: 0, fontSize: 13, color: "#98a2b3" }}>No logos uploaded yet.</p>
              )}
            </div>
          </div>

          <div>
            <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#475467" }}>Additional images</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {imageAssets.length ? (
                imageAssets.map((entry, index) => {
                  return (
                    <div key={`image-${index}`} style={assetCardStyle()}>
                      <img
                        src={entry.url}
                        alt={`Image ${index + 1}`}
                        style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 8, border: "1px solid #d0d5dd" }}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Image {index + 1}</p>
                      </div>
                    <div style={actionRowStyle}>
                      <button
                        type="button"
                        onClick={() => addImageElementFromLibrary(entry.url)}
                        style={{
                          border: "none",
                          background: "#0f172a",
                          color: "#ffffff",
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Add to card
                      </button>
                      {cardDesign.logoUrl === entry.url && (
                        <button
                          type="button"
                          onClick={() => updateCardDesign({ logoUrl: null })}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#ff6b6b",
                            padding: "6px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          Clear active
                        </button>
                      )}
                    </div>
                    {onRemoveAsset && (
                      <button
                        type="button"
                        onClick={() => onRemoveAsset(entry.url)}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#ff6b6b",
                          padding: "4px 0",
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Remove from library
                      </button>
                    )}
                  </div>
                );
              })
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: "#98a2b3" }}>No additional images uploaded yet.</p>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: "#0f172a",
                cursor: "pointer",
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onUploadLogo(e, "logo")}
                disabled={uploadingLogo}
                style={{ display: "none" }}
              />
              <span
                style={{
                  padding: "10px 18px",
                  borderRadius: "999px",
                  border: "1px solid #d0d5dd",
                  background: uploadingLogo ? "#f5f5f7" : "#ffffff",
                  color: uploadingLogo ? "#98a2b3" : "#0f172a",
                }}
              >
                {uploadingLogo ? "Uploading…" : "Upload logo"}
              </span>
            </label>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: "#0f172a",
                cursor: "pointer",
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onUploadLogo(e, "image")}
                disabled={uploadingLogo}
                style={{ display: "none" }}
              />
              <span
                style={{
                  padding: "10px 18px",
                  borderRadius: "999px",
                  border: "1px solid #d0d5dd",
                  background: uploadingLogo ? "#f5f5f7" : "#ffffff",
                  color: uploadingLogo ? "#98a2b3" : "#0f172a",
                }}
              >
                {uploadingLogo ? "Uploading…" : "Upload image"}
              </span>
            </label>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid #e5e5ea",
            paddingTop: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#0f172a" }}>
                Select your layout side
              </p>
              <p style={{ margin: "4px 0 0", color: "#475467", fontSize: "13px" }}>
                Add elements directly on the {selectedElementSide} preview to reposition them.
              </p>
            </div>
            <div
              style={{
                padding: "4px",
                borderRadius: "999px",
                background: "#f5f5f7",
                display: "inline-flex",
                gap: "4px",
              }}
            >
              {["front", "back"].map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => setSelectedElementSide(side as CardSide)}
                  style={{
                    border: "none",
                    borderRadius: "999px",
                    padding: "6px 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: selectedElementSide === side ? "#000000" : "transparent",
                    color: selectedElementSide === side ? "#ffffff" : "#0f172a",
                  }}
                >
                  {side === "front" ? "Front" : "Back"}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
              alignItems: "end",
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#475467" }}>
              Text preset
              <select
                value={selectedPreset}
                onChange={(event) => setSelectedPreset(event.target.value as TextContentKey)}
                style={{
                  borderRadius: "10px",
                  border: "1px solid #d0d5dd",
                  padding: "10px 12px",
                  fontSize: "14px",
                }}
              >
                {TEXT_PRESET_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {selectedPreset === "custom" && (
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#475467" }}>
                Custom text
                <input
                  type="text"
                  value={customText}
                  onChange={(event) => setCustomText(event.target.value)}
                  placeholder="Type your label"
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #d0d5dd",
                    fontSize: "14px",
                  }}
                />
              </label>
            )}
            <button
              type="button"
              onClick={addTextElement}
              style={{
                border: "none",
                borderRadius: "12px",
                padding: "12px 18px",
                fontWeight: 600,
                cursor: "pointer",
                background: "#000000",
                color: "#ffffff",
              }}
            >
              + Add text
            </button>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={addLogoElement}
              style={{
                border: "1px solid #d0d5dd",
                borderRadius: "12px",
                padding: "10px 18px",
                background: "#ffffff",
                color: "#0f172a",
                cursor: "pointer",
              }}
            >
              + Add logo / image
            </button>
            <button
              type="button"
              onClick={addQrElement}
              style={{
                border: "1px solid #d0d5dd",
                borderRadius: "12px",
                padding: "10px 18px",
                background: "#ffffff",
                color: "#0f172a",
                cursor: cardElements.some((element) => element.type === "qr" && element.side === selectedElementSide)
                  ? "#98a2b3"
                  : "#0f172a",
              }}
              disabled={cardElements.some((element) => element.type === "qr" && element.side === selectedElementSide)}
            >
              + Add QR code
            </button>
            <button
              type="button"
              onClick={addShapeElement}
              style={{
                border: "1px solid #d0d5dd",
                borderRadius: "12px",
                padding: "10px 18px",
                background: "#ffffff",
                color: "#0f172a",
                cursor: "pointer",
              }}
            >
              + Add shape
            </button>
            <button
              type="button"
              onClick={addBorderElement}
              style={{
                border: "1px solid #d0d5dd",
                borderRadius: "12px",
                padding: "10px 18px",
                background: "#ffffff",
                color: "#0f172a",
                cursor: "pointer",
              }}
            >
              + Add border
            </button>
            <button
              type="button"
              onClick={addLineElement}
              style={{
                border: "1px solid #d0d5dd",
                borderRadius: "12px",
                padding: "10px 18px",
                background: "#ffffff",
                color: "#0f172a",
                cursor: "pointer",
              }}
            >
              + Add line
            </button>
          </div>

          <div
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: "12px",
              padding: "16px",
              background: "#f9fafb",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {selectedElements.length === 0 ? (
              <p style={{ margin: 0, color: "#475467", fontSize: "14px" }}>
                No elements on the {selectedElementSide} yet. Add a text block, logo, QR code, shape, or line to begin.
              </p>
            ) : (
              selectedElements.map((element) => (
                <div
                  key={element.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: "#ffffff",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                      {getElementLabel(element)}
                    </p>
                    {element.type === "text" && element.contentKey === "custom" && (
                      <input
                        type="text"
                        value={element.text || ""}
                        onChange={(event) => updateCustomText(element.id, event.target.value)}
                        placeholder="Edit custom text"
                        style={{
                          marginTop: "6px",
                          width: "100%",
                          borderRadius: "8px",
                          border: "1px solid #d0d5dd",
                          padding: "6px 8px",
                        }}
                      />
                    )}
                    {element.type === "text" && (
                      <label style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#6b7280" }}>
                        Text colour
                        <input
                          type="color"
                          value={element.color || cardDesign.textColor}
                          onChange={(event) =>
                            setElements((prev) =>
                              prev.map((el) =>
                                el.id === element.id ? { ...el, color: event.target.value } : el
                              )
                            )
                          }
                          disabled={element.locked}
                          style={{
                            width: "100%",
                            height: "32px",
                            borderRadius: "8px",
                            border: "1px solid #d0d5dd",
                          }}
                        />
                      </label>
                    )}
                    {element.type === "text" && (
                      <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6b7280" }}>
                          <span>Text size</span>
                          <span>{ratioToPt(element.fontSize ?? 0.05)} pt</span>
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <input
                            type="range"
                            min={minFontRatio}
                            max={MAX_FONT_RATIO}
                            step={0.001}
                            value={element.fontSize ?? 0.05}
                            onChange={(event) => {
                              const next = clamp(parseFloat(event.target.value) || minFontRatio, minFontRatio, MAX_FONT_RATIO);
                              setElements((prev) =>
                                prev.map((el) =>
                                  el.id === element.id
                                    ? {
                                        ...el,
                                        fontSize: next,
                                      }
                                    : el
                                )
                              );
                            }}
                            style={{ flex: 1 }}
                            disabled={element.locked}
                          />
                          <a
                            href="/help/physical-card-font-guide"
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: "12px", color: "#ff7a00", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
                          >
                            Font guide
                          </a>
                        </div>
                      </div>
                    )}
                    {(element.type === "image" || element.type === "qr") && (
                      <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6b7280" }}>
                          <span>Size</span>
                          <span>{Math.round(getElementWidth(element) * cardWidthPx)} px</span>
                        </div>
                        <input
                          type="range"
                          min={Math.round(mediaMinSliderPx)}
                          max={Math.round(mediaMaxSliderPx)}
                          step={1}
                          value={Math.round(getElementWidth(element) * cardWidthPx)}
                          onChange={(event) =>
                            handleResizeElement(element.id, parseFloat(event.target.value) / cardWidthPx)
                          }
                          style={{ width: "100%" }}
                          disabled={element.locked}
                        />
                        {element.type === "image" && (
                          <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "#6b7280" }}>
                            Opacity
                            <input
                              type="range"
                              min={MIN_OPACITY}
                              max={MAX_OPACITY}
                              step={0.05}
                              value={element.opacity ?? 1}
                              onChange={(event) => {
                                const next = clamp(parseFloat(event.target.value) || 1, MIN_OPACITY, MAX_OPACITY);
                                setElements((prev) =>
                                  prev.map((el) =>
                                    el.id === element.id
                                      ? {
                                          ...el,
                                          opacity: next,
                                        }
                                      : el
                                  )
                                );
                              }}
                              style={{ width: "100%" }}
                              disabled={element.locked}
                            />
                          </label>
                        )}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>Align Elements:</span>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => alignElement(element.id, { horizontal: "left" })}
                          disabled={element.locked}
                          style={{
                            border: "1px solid #d0d5dd",
                            background: "#fff",
                            borderRadius: "6px",
                            padding: "6px 8px",
                            fontSize: "12px",
                            cursor: element.locked ? "not-allowed" : "pointer",
                          }}
                          title="Left"
                        >
                          <AlignIcon variant="left" />
                        </button>
                        <button
                          type="button"
                          onClick={() => alignElement(element.id, { horizontal: "center" })}
                          disabled={element.locked}
                          style={{
                            border: "1px solid #d0d5dd",
                            background: "#fff",
                            borderRadius: "6px",
                            padding: "6px 8px",
                            fontSize: "12px",
                            cursor: element.locked ? "not-allowed" : "pointer",
                          }}
                          title="Center"
                        >
                          <AlignIcon variant="center" />
                        </button>
                        <button
                          type="button"
                          onClick={() => alignElement(element.id, { horizontal: "right" })}
                          disabled={element.locked}
                          style={{
                            border: "1px solid #d0d5dd",
                            background: "#fff",
                            borderRadius: "6px",
                            padding: "6px 8px",
                            fontSize: "12px",
                            cursor: element.locked ? "not-allowed" : "pointer",
                          }}
                          title="Right"
                        >
                          <AlignIcon variant="right" />
                        </button>
                      </div>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => alignElement(element.id, { vertical: "top" })}
                          disabled={element.locked}
                          style={{
                            border: "1px solid #d0d5dd",
                            background: "#fff",
                            borderRadius: "6px",
                            padding: "6px 8px",
                            fontSize: "12px",
                            cursor: element.locked ? "not-allowed" : "pointer",
                          }}
                          title="Top"
                        >
                          <AlignIcon variant="top" />
                        </button>
                        <button
                          type="button"
                          onClick={() => alignElement(element.id, { vertical: "middle" })}
                          disabled={element.locked}
                          style={{
                            border: "1px solid #d0d5dd",
                            background: "#fff",
                            borderRadius: "6px",
                            padding: "6px 8px",
                            fontSize: "12px",
                            cursor: element.locked ? "not-allowed" : "pointer",
                          }}
                          title="Middle"
                        >
                          <AlignIcon variant="middle" />
                        </button>
                        <button
                          type="button"
                          onClick={() => alignElement(element.id, { vertical: "bottom" })}
                          disabled={element.locked}
                          style={{
                            border: "1px solid #d0d5dd",
                            background: "#fff",
                            borderRadius: "6px",
                            padding: "6px 8px",
                            fontSize: "12px",
                            cursor: element.locked ? "not-allowed" : "pointer",
                          }}
                          title="Bottom"
                        >
                          <AlignIcon variant="bottom" />
                        </button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6b7280" }}>
                          <span>Rotate</span>
                          <span>{Math.round(element.rotation ?? 0)}°</span>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {[
                            { label: "Up", value: -90 },
                            { label: "Side", value: 0 },
                            { label: "Down", value: 90 },
                          ].map((option) => {
                            const active = Math.round(element.rotation ?? 0) === option.value;
                            return (
                              <button
                                key={option.label}
                                type="button"
                                onClick={() =>
                                  setElements((prev) =>
                                    prev.map((el) =>
                                      el.id === element.id ? { ...el, rotation: option.value } : el
                                    )
                                  )
                                }
                                disabled={element.locked}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "8px",
                                  border: active ? "2px solid #0f172a" : "1px solid #d0d5dd",
                                  background: active ? "#0f172a" : "#ffffff",
                                  color: active ? "#ffffff" : "#0f172a",
                                  fontSize: "12px",
                                  cursor: element.locked ? "not-allowed" : "pointer",
                                }}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    {element.type === "shape" && (
                      <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "12px", color: "#6b7280" }}>
                          Opacity
                          <input
                            type="range"
                            min={MIN_OPACITY}
                            max={MAX_OPACITY}
                            step={0.05}
                            value={element.opacity ?? 1}
                            onChange={(event) => {
                              const next = clamp(parseFloat(event.target.value) || 1, MIN_OPACITY, MAX_OPACITY);
                              setElements((prev) =>
                                prev.map((el) =>
                                  el.id === element.id
                                    ? {
                                        ...el,
                                        opacity: next,
                                      }
                                    : el
                                )
                              );
                            }}
                            style={{ width: "100%" }}
                            disabled={element.locked}
                          />
                        </label>
                        <label style={{ fontSize: "12px", color: "#6b7280" }}>
                          Color
                          <input
                            type="color"
                            value={element.backgroundColor || "#ffffff"}
                            onChange={(event) =>
                              setElements((prev) =>
                                prev.map((el) =>
                                  el.id === element.id ? { ...el, backgroundColor: event.target.value } : el
                                )
                              )
                            }
                            style={{
                              width: "100%",
                              height: "32px",
                              borderRadius: "8px",
                              border: "1px solid #d0d5dd",
                              marginTop: "4px",
                            }}
                          />
                        </label>
                        <label style={{ fontSize: "12px", color: "#6b7280" }}>
                          Variant
                          <select
                            value={element.shapeVariant ?? "rectangle"}
                            onChange={(event) => {
                              const variant = event.target.value as CardElement["shapeVariant"];
                              setElements((prev) =>
                                prev.map((el) => {
                                  if (el.id !== element.id) return el;
                                  const next = { ...el, shapeVariant: variant };
                                  if (variant === "square" || variant === "circle") {
                                    const size = clamp(getElementWidth(el), MIN_RESIZABLE_RATIO, MAX_RESIZABLE_RATIO);
                                    next.width = size;
                                    next.height = size;
                                  } else if (variant === "rectangle") {
                                    next.width = el.width ?? 0.25;
                                    next.height = el.height ?? 0.12;
                                  }
                                  return next;
                                })
                              );
                            }}
                            style={{
                              width: "100%",
                              border: "1px solid #d0d5dd",
                              borderRadius: "8px",
                              padding: "6px 8px",
                              marginTop: "4px",
                            }}
                          >
                            <option value="rectangle">Rectangle</option>
                            <option value="square">Square</option>
                            <option value="circle">Circle</option>
                            <option value="triangle">Triangle</option>
                          </select>
                        </label>
                      </div>
                    )}
                    {element.type === "shape" && (
                      (() => {
                        const variant = element.shapeVariant ?? "rectangle";
                        const showUniformSlider = variant === "square" || variant === "circle";
                        const showSeparateControls = variant === "rectangle" || variant === "triangle";
                        return (
                          <>
                            {showSeparateControls && (
                              <>
                        <label style={{ fontSize: "12px", color: "#6b7280" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Width</span>
                            <span>{Math.round(getElementWidth(element) * cardWidthPx)} px</span>
                          </div>
                        <input
                          type="range"
                          min={Math.round(minElementSizePx)}
                          max={Math.round(maxElementSizePx)}
                          step={1}
                          value={Math.round(getElementWidth(element) * cardWidthPx)}
                          onChange={(event) =>
                            handleResizeElement(element.id, parseFloat(event.target.value) / cardWidthPx)
                          }
                          style={{ width: "100%" }}
                        />
                                </label>
                        <label style={{ fontSize: "12px", color: "#6b7280" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Height</span>
                            <span>{Math.round(getElementHeight(element) * cardHeightPx)} px</span>
                          </div>
                          <input
                            type="range"
                            min={MIN_RESIZABLE_RATIO}
                            max={MAX_RESIZABLE_RATIO}
                            step={0.01}
                                    value={getElementHeight(element)}
                                    onChange={(event) =>
                                      setElements((prev) =>
                                        prev.map((el) =>
                                          el.id === element.id
                                            ? {
                                                ...el,
                                                height: clamp(
                                                  parseFloat(event.target.value),
                                                  MIN_RESIZABLE_RATIO,
                                                  MAX_RESIZABLE_RATIO
                                                ),
                                              }
                                            : el
                                        )
                                      )
                                    }
                                    style={{ width: "100%" }}
                                  />
                                </label>
                              </>
                            )}
                            {showUniformSlider && (
                              <label style={{ fontSize: "12px", color: "#6b7280" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span>{variant === "circle" ? "Diameter" : "Size"}</span>
                                  <span>{Math.round(getElementWidth(element) * cardWidthPx)} px</span>
                                </div>
                                <input
                                  type="range"
                                  min={MIN_RESIZABLE_RATIO}
                                  max={MAX_RESIZABLE_RATIO}
                                  step={0.01}
                                  value={getElementWidth(element)}
                                  onChange={(event) => {
                                    const size = clamp(parseFloat(event.target.value), MIN_RESIZABLE_RATIO, MAX_RESIZABLE_RATIO);
                                    setElements((prev) =>
                                      prev.map((el) =>
                                        el.id === element.id ? { ...el, width: size, height: size } : el
                                      )
                                    );
                                  }}
                                  style={{ width: "100%" }}
                                />
                              </label>
                            )}
                          </>
                        );
                      })()
                    )}
                    {element.type === "line" && (
                      <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "12px", color: "#6b7280" }}>
                          Color
                          <input
                            type="color"
                            value={element.backgroundColor || cardDesign.textColor}
                            onChange={(event) =>
                              setElements((prev) =>
                                prev.map((el) =>
                                  el.id === element.id ? { ...el, backgroundColor: event.target.value } : el
                                )
                              )
                            }
                            style={{
                              width: "100%",
                              height: "32px",
                              borderRadius: "8px",
                              border: "1px solid #d0d5dd",
                              marginTop: "4px",
                            }}
                          />
                        </label>
                        <label style={{ fontSize: "12px", color: "#6b7280" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Length</span>
                            <span>{Math.round(getElementWidth(element) * cardWidthPx)} px</span>
                          </div>
                          <input
                            type="range"
                            min={0.2}
                            max={0.95}
                            step={0.01}
                            value={getElementWidth(element)}
                            onChange={(event) => handleResizeElement(element.id, parseFloat(event.target.value))}
                            style={{ width: "100%" }}
                          />
                        </label>
                        <label style={{ fontSize: "12px", color: "#6b7280" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Thickness</span>
                            <span>{Math.round(getElementHeight(element) * cardHeightPx)} px</span>
                          </div>
                          <input
                            type="range"
                            min={0.005}
                            max={0.05}
                            step={0.002}
                            value={getElementHeight(element)}
                            onChange={(event) =>
                              setElements((prev) =>
                                prev.map((el) =>
                                  el.id === element.id
                                    ? {
                                        ...el,
                                        height: clamp(parseFloat(event.target.value), 0.005, 0.05),
                                      }
                                    : el
                                )
                              )
                            }
                            style={{ width: "100%" }}
                          />
                        </label>
                      </div>
                    )}
                    {element.type === "border" && (
                      <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "12px", color: "#6b7280" }}>
                          Opacity
                          <input
                            type="range"
                            min={MIN_OPACITY}
                            max={MAX_OPACITY}
                            step={0.05}
                            value={element.opacity ?? 1}
                            onChange={(event) => {
                              const next = clamp(parseFloat(event.target.value) || 1, MIN_OPACITY, MAX_OPACITY);
                              setElements((prev) =>
                                prev.map((el) =>
                                  el.id === element.id
                                    ? {
                                        ...el,
                                        opacity: next,
                                      }
                                    : el
                                )
                              );
                            }}
                            style={{ width: "100%" }}
                            disabled={element.locked}
                          />
                        </label>
                        <label style={{ fontSize: "12px", color: "#6b7280" }}>
                          Border colour
                          <input
                            type="text"
                            value={element.borderColor || "#0f172a"}
                            onChange={(event) =>
                              setElements((prev) =>
                                prev.map((el) =>
                                  el.id === element.id ? { ...el, borderColor: event.target.value } : el
                                )
                              )
                            }
                            style={{
                              width: "100%",
                              borderRadius: "8px",
                              border: "1px solid #d0d5dd",
                              padding: "6px 8px",
                              marginTop: "4px",
                              marginBottom: "4px",
                            }}
                            disabled={element.locked}
                          />
                          <input
                            type="color"
                            value={element.borderColor || "#0f172a"}
                            onChange={(event) =>
                              setElements((prev) =>
                                prev.map((el) =>
                                  el.id === element.id ? { ...el, borderColor: event.target.value } : el
                                )
                              )
                            }
                            style={{
                              width: "100%",
                              height: "32px",
                              borderRadius: "8px",
                              border: "1px solid #d0d5dd",
                              marginTop: "4px",
                            }}
                            disabled={element.locked}
                          />
                        </label>
                        <label style={{ fontSize: "12px", color: "#6b7280" }}>
                          Border style
                          <select
                            value={element.borderStyle ?? "solid"}
                            onChange={(event) => {
                              const style = event.target.value as CardElement["borderStyle"];
                              setElements((prev) =>
                                prev.map((el) =>
                                  el.id === element.id ? { ...el, borderStyle: style } : el
                                )
                              );
                            }}
                            style={{
                              width: "100%",
                              border: "1px solid #d0d5dd",
                              borderRadius: "8px",
                              padding: "6px 8px",
                              marginTop: "4px",
                            }}
                            disabled={element.locked}
                          >
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                          </select>
                        </label>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => toggleLockElement(element.id)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: element.locked ? "#16a34a" : "#475467",
                        cursor: "pointer",
                        fontSize: "16px",
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        {element.locked ? (
                          <>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            <rect x="5" y="11" width="14" height="10" rx="2" />
                            <path d="M12 15v2" />
                          </>
                        ) : (
                          <>
                            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                            <rect x="5" y="11" width="14" height="10" rx="2" />
                            <path d="M12 15v2" />
                          </>
                        )}
                      </svg>
                    </button>
                  <button
                    type="button"
                    onClick={() => removeElement(element.id)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#ff5c5c",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Remove
                  </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={handleSaveDesign}
            disabled={savingDesign}
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              border: "1px solid #d0d5dd",
              fontWeight: 600,
              cursor: savingDesign ? "wait" : "pointer",
              background: "#ffffff",
              color: "#0f172a",
              minWidth: "140px",
            }}
          >
            {savingDesign ? "Saving…" : "Save design"}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !physicalActivated}
            style={{
              padding: "12px 28px",
              borderRadius: "12px",
              border: "none",
              fontWeight: 700,
              cursor: saving ? "wait" : "pointer",
              background: physicalActivated ? "linear-gradient(135deg,#ff8b37,#ff6a00)" : "#d0d5dd",
              color: "#ffffff",
              boxShadow: physicalActivated ? "0 14px 28px rgba(255,106,0,0.25)" : "none",
              minWidth: "160px",
              transition: "all 0.2s ease",
              opacity: saving ? 0.85 : 1,
            }}
          >
            {saving ? "Exporting…" : "Export assets"}
          </button>
          <span style ={{ alignSelf: "center", color: "#6b7280", fontSize: "13px" }}>
            Exporting might take a few minutes depending on your design resolution.
          </span>
        </div>
      </div>
    </>
  );
}
