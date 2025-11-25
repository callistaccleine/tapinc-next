"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
const CARD_BORDER_RADIUS = 22;
const PREVIEW_MAX_WIDTH = 360;

const mmToPx = (mm: number, dpi: number) => (mm * dpi) / 25.4;

export type CardResolution = "150" | "300" | "600";
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

type CardElementType = "text" | "image" | "qr";

const MIN_FONT_SCALE = 0.5;
const MAX_FONT_SCALE = 1;
const DEFAULT_FONT_SCALE = 0.7;
const clampFontScale = (value: number) =>
  Math.min(
    MAX_FONT_SCALE,
    Math.max(MIN_FONT_SCALE, Number.isFinite(value) ? value : DEFAULT_FONT_SCALE)
  );

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
  imageUrl?: string | null;
};

const DEFAULT_CARD_ELEMENTS: CardElement[] = [
  {
    id: "front-headline",
    type: "text",
    side: "front",
    x: 0.08,
    y: 0.58,
    width: 0.84,
    height: 0.18,
    fontSize: 0.12,
    textAlign: "left",
    contentKey: "headline",
  },
  {
    id: "front-tagline",
    type: "text",
    side: "front",
    x: 0.08,
    y: 0.75,
    width: 0.84,
    height: 0.12,
    fontSize: 0.06,
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
    width: 0.46,
    height: 0.12,
    fontSize: 0.07,
    textAlign: "left",
    contentKey: "name",
  },
  {
    id: "back-role",
    type: "text",
    side: "back",
    x: 0.08,
    y: 0.25,
    width: 0.46,
    height: 0.1,
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
    width: 0.46,
    height: 0.1,
    fontSize: 0.05,
    textAlign: "left",
    contentKey: "phone",
  },
  {
    id: "back-email",
    type: "text",
    side: "back",
    x: 0.08,
    y: 0.5,
    width: 0.46,
    height: 0.1,
    fontSize: 0.05,
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
  backgroundColor: string;
  // accentColor: string;
  textColor: string;
  headline: string;
  tagline?: string;
  logoUrl?: string | null;
  resolution: CardResolution;
  elements?: CardElement[];
  fontScale?: number;
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
  // accentColor: "#ff7a00",
  textColor: "#ffffff",
  headline: "",
  tagline: "",
  logoUrl: null,
  resolution: "300",
  elements: [],
  fontScale: DEFAULT_FONT_SCALE,
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
  physicalActivated: boolean;
  onSave: (payload: CardExportPayload) => Promise<void> | void;
  onSaveDesign: () => Promise<void> | void;
  onUploadLogo: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  uploadingLogo: boolean;
};

const resolutionOptions: { label: string; value: CardResolution }[] = [
  { label: "150 DPI", value: "150" },
  { label: "300 DPI (Recommended)", value: "300" },
  { label: "600 DPI", value: "600" },
];

export function PhysicalCardDesigner({
  cardDesign,
  updateCardDesign,
  previewData,
  profileUrl,
  physicalActivated,
  onSave,
  onSaveDesign,
  onUploadLogo,
  uploadingLogo,
}: PhysicalCardDesignerProps) {
  const fontScale = clampFontScale(cardDesign.fontScale ?? DEFAULT_FONT_SCALE);
  const updateFontScale = (value: number) => {
    updateCardDesign({ fontScale: clampFontScale(value) });
  };
  const resetFontScale = () => updateCardDesign({ fontScale: DEFAULT_FONT_SCALE });
  const dpi = Number(cardDesign.resolution || "300");
  const cardWidthPx = mmToPx(CARD_MM_WIDTH, dpi);
  const cardHeightPx = mmToPx(CARD_MM_HEIGHT, dpi);
  const previewScale = Math.min(0.74, PREVIEW_MAX_WIDTH / cardWidthPx);
  const displayedWidth = cardWidthPx * previewScale;
  const displayedHeight = cardHeightPx * previewScale;
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ id: string; side: CardSide; offsetX: number; offsetY: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingDesign, setSavingDesign] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedElementSide, setSelectedElementSide] = useState<CardSide>("front");
  const [selectedPreset, setSelectedPreset] = useState<TextContentKey>("headline");
  const [customText, setCustomText] = useState("TapInk");
  const pixelRatio = displayedWidth > 0 ? cardWidthPx / displayedWidth : 1;
  const cardElements = cardDesign.elements ?? [];

  const qrValue =
    profileUrl || (previewData.email ? `mailto:${previewData.email}` : "https://tapink.com.au");

  useEffect(() => {
    if (!cardElements.length) {
      updateCardDesign({ elements: cloneDefaultElements() });
    }
  }, [cardElements.length, updateCardDesign]);

  const setElements = (updater: (prev: CardElement[]) => CardElement[]) => {
    const next = updater(cardDesign.elements ?? []);
    updateCardDesign({ elements: next });
  };

  const getElementWidth = (element: CardElement) => {
    if (typeof element.width === "number") return element.width;
    if (element.type === "qr") return 0.28;
    if (element.type === "image") return 0.22;
    return 0.82;
  };

  const getElementHeight = (element: CardElement) => {
    if (typeof element.height === "number") return element.height;
    if (element.type === "qr") return getElementWidth(element);
    if (element.type === "image") return 0.22;
    const fontSize = element.fontSize ?? 0.07;
    return fontSize * 1.6;
  };

  const getTextValue = (element: CardElement) => {
    switch (element.contentKey) {
      case "headline":
        return cardDesign.headline?.trim() || "TapInk";
      case "tagline":
        return cardDesign.tagline?.trim() || "Digital Business Cards";
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

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>, element: CardElement) => {
    if (exporting) return;
    const targetRef = element.side === "front" ? frontRef : backRef;
    const cardEl = targetRef.current;
    if (!cardEl) return;
    const rect = cardEl.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const left = (element.x ?? 0) * rect.width;
    const top = (element.y ?? 0) * rect.height;

    dragState.current = {
      id: element.id,
      side: element.side,
      offsetX: pointerX - left,
      offsetY: pointerY - top,
    };

    const handleMove = (moveEvent: PointerEvent) => {
      if (!dragState.current) return;
      const activeRef = dragState.current.side === "front" ? frontRef : backRef;
      const activeEl = activeRef.current;
      if (!activeEl) return;
      const activeRect = activeEl.getBoundingClientRect();
      const posX = moveEvent.clientX - activeRect.left - dragState.current.offsetX;
      const posY = moveEvent.clientY - activeRect.top - dragState.current.offsetY;
      const widthRatio = getElementWidth(element);
      const heightRatio = getElementHeight(element);
      const nextX = clamp(posX / activeRect.width, 0, Math.max(0, 1 - widthRatio));
      const nextY = clamp(posY / activeRect.height, 0, Math.max(0, 1 - heightRatio));

      setElements((prev) =>
        prev.map((item) =>
          item.id === dragState.current?.id
            ? {
                ...item,
                x: nextX,
                y: nextY,
              }
            : item
        )
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

  const renderElement = (element: CardElement) => {
    const widthRatio = getElementWidth(element);
    const heightRatio = getElementHeight(element);
    const widthPx = widthRatio * displayedWidth;
    const heightPx = heightRatio * displayedHeight;
    const left = (element.x ?? 0) * displayedWidth;
    const top = (element.y ?? 0) * displayedHeight;
    const showGuides = !exporting;

  const baseStyle: CSSProperties = {
      position: "absolute",
      left,
      top,
      width: widthPx,
      height: heightPx,
      display: element.type === "image" ? "flex" : "block",
      alignItems: element.type === "image" ? "center" : undefined,
      justifyContent: element.type === "image" ? "center" : undefined,
      cursor: showGuides ? "grab" : "default",
      border: showGuides ? "1px dashed rgba(255,255,255,0.35)" : "none",
      borderRadius: element.type === "text" ? 8 : 10,
      padding: element.type === "text" ? "4px 6px" : 0,
      boxSizing: "border-box",
      userSelect: "none",
      touchAction: "none",
    };

    if (element.type === "text") {
      const fontSize = (element.fontSize ?? 0.05) * displayedWidth * fontScale;
      const textAlign = element.textAlign ?? "left";
      return (
        <div
          key={element.id}
          style={baseStyle}
          onPointerDown={(event) => startDrag(event, element)}
        >
          <div
            style={{
              color: element.color || cardDesign.textColor,
              fontSize,
              textAlign,
              fontWeight: 600,
              width: "100%",
              lineHeight: 1.2,
              whiteSpace: "pre-wrap",
            }}
          >
            {getTextValue(element)}
          </div>
        </div>
      );
    }

    if (element.type === "image") {
      const src = element.imageUrl ?? cardDesign.logoUrl;
      return (
        <div
          key={element.id}
          style={{ ...baseStyle, border: showGuides ? "1px dashed rgba(255,255,255,0.35)" : "none" }}
          onPointerDown={(event) => startDrag(event, element)}
        >
          {src ? (
            <img
              src={src}
              alt="Card image"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <span style={{ fontSize: 12, color: cardDesign.textColor, opacity: 0.6 }}>
              Upload a logo to display
            </span>
          )}
        </div>
      );
    }

    return (
      <div
        key={element.id}
        style={{ ...baseStyle, display: "flex", alignItems: "center", justifyContent: "center" }}
        onPointerDown={(event) => startDrag(event, element)}
      >
        <QRCodeCanvas
          value={qrValue}
          size={Math.min(widthPx, heightPx)}
          bgColor="transparent"
          fgColor={cardDesign.textColor}
          level="H"
          includeMargin={false}
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
  const selectedElements = useMemo(
    () => cardElements.filter((element) => element.side === selectedElementSide),
    [cardElements, selectedElementSide]
  );

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
        imageUrl: cardDesign.logoUrl || null,
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

  const removeElement = (id: string) => {
    setElements((prev) => prev.filter((element) => element.id !== id));
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
    if (element.contentKey && element.contentKey !== "custom") {
      const preset = TEXT_PRESET_OPTIONS.find((option) => option.value === element.contentKey);
      return preset?.label || "Text";
    }
    return "Custom text";
  };

  const renderCard = (
    side: CardSide,
    ref: RefObject<HTMLDivElement | null>,
    elements: CardElement[]
  ) => (
    <div
      style={{
        width: displayedWidth,
        maxWidth: "100%",
        height: displayedHeight,
        borderRadius: `${CARD_BORDER_RADIUS}px`,
        background: cardDesign.backgroundColor,
        color: cardDesign.textColor,
        boxShadow: "0 22px 50px rgba(15,23,42,0.22)",
        position: "relative",
        overflow: "hidden",
      }}
      ref={ref}
    >
      {elements.map((element) => renderElement(element))}
    </div>
  );

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
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
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
          </label>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
          }}
        >
          <label style={{ fontSize: "13px", color: "#475467", display: "flex", flexDirection: "column", gap: "6px" }}>
            Background colour
            <input
              type="color"
              value={cardDesign.backgroundColor}
              onChange={(e) => updateCardDesign({ backgroundColor: e.target.value })}
              style={{
                width: "100%",
                height: "36px",
                border: "1px solid #d0d5dd",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            />
          </label>
          {/* <label style={{ fontSize: "13px", color: "#475467", display: "flex", flexDirection: "column", gap: "6px" }}>
            Accent colour
            <input
              type="color"
              value={cardDesign.accentColor}
              onChange={(e) => updateCardDesign({ accentColor: e.target.value })}
              style={{
                width: "100%",
                height: "36px",
                border: "1px solid #d0d5dd",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            />
          </label> */}
          <label style={{ fontSize: "13px", color: "#475467", display: "flex", flexDirection: "column", gap: "6px" }}>
            Text colour
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
          </label>
        </div>

        <div style={{ display: "grid", gap: "12px" }}>
          <label style={{ fontSize: "13px", color: "#475467", display: "flex", flexDirection: "column", gap: "6px" }}>
            Headline
            <input
              type="text"
              value={cardDesign.headline}
              onChange={(e) => updateCardDesign({ headline: e.target.value })}
              placeholder="TapInk"
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #d0d5dd",
                fontSize: "14px",
              }}
            />
          </label>

          <label style={{ fontSize: "13px", color: "#475467", display: "flex", flexDirection: "column", gap: "6px" }}>
            Tagline (optional)
            <input
              type="text"
              value={cardDesign.tagline || ""}
              onChange={(e) => updateCardDesign({ tagline: e.target.value })}
              placeholder="Digital Business Card"
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #d0d5dd",
                fontSize: "14px",
              }}
            />
          </label>
        </div>

        <div style={{ borderTop: "1px solid #e5e5ea", paddingTop: "16px" }}>
          <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#475467" }}>Logo</p>
          {cardDesign.logoUrl ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img
                src={cardDesign.logoUrl}
                alt="Logo preview"
                style={{ width: "64px", height: "64px", objectFit: "contain", borderRadius: "8px", border: "1px solid #d0d5dd" }}
              />
              <button
                type="button"
                onClick={() => updateCardDesign({ logoUrl: null })}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#ff6b6b",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Remove logo
              </button>
            </div>
          ) : (
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
                onChange={onUploadLogo}
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
          )}
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
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#0f172a" }}>
                Typography scale
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#475467" }}>
                Adjust all text sizes on the physical card preview.
              </p>
            </div>
            <button
              type="button"
              onClick={resetFontScale}
              disabled={Math.abs(fontScale - 1) < 0.001}
              style={{
                border: "none",
                borderRadius: "999px",
                padding: "8px 16px",
                background: "#f3f4f6",
                color: "#111827",
                fontWeight: 600,
                cursor: Math.abs(fontScale - 1) < 0.001 ? "not-allowed" : "pointer",
                opacity: Math.abs(fontScale - 1) < 0.001 ? 0.6 : 1,
              }}
            >
              Reset
            </button>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="range"
              min={MIN_FONT_SCALE}
              max={MAX_FONT_SCALE}
              step={0.01}
              value={fontScale}
              onChange={(event) => updateFontScale(parseFloat(event.target.value))}
              style={{
                flex: 1,
                appearance: "none",
                height: 6,
                borderRadius: 999,
                background: "#f3f4f6",
                outline: "none",
              }}
            />
            <span style={{ minWidth: 64, textAlign: "right", fontWeight: 600 }}>
              {Math.round(fontScale * 100)}%
            </span>
          </div>

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
                Drag & drop layout
              </p>
              <p style={{ margin: "4px 0 0", color: "#475467", fontSize: "13px" }}>
                Drag elements directly on the {selectedElementSide} preview to reposition them.
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
                No elements on the {selectedElementSide} yet. Add a text block, logo, or QR code to begin.
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
                  </div>
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
              fontWeight: 600,
              cursor: saving ? "wait" : "pointer",
              background: physicalActivated ? "#000000" : "#d0d5dd",
              color: "#ffffff",
              boxShadow: "0 12px 24px rgba(15,23,42,0.18)",
              minWidth: "160px",
            }}
          >
            {saving ? "Exporting…" : "Export assets"}
          </button>
        </div>
      </div>
    </>
  );
}
