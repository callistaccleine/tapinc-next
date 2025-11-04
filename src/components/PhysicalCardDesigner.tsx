"use client";

import { ChangeEvent, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { CardData } from "@/types/CardData";
import { toPng } from "html-to-image";

const CARD_MM_WIDTH = 86;
const CARD_MM_HEIGHT = 54;
const CARD_BORDER_RADIUS = 22;
const PREVIEW_MAX_WIDTH = 360;

const mmToPx = (mm: number, dpi: number) => (mm * dpi) / 25.4;

export type CardResolution = "150" | "300" | "600";

export type CardDesignSettings = {
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  headline: string;
  tagline?: string;
  logoUrl?: string | null;
  resolution: CardResolution;
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
  accentColor: "#ff7a00",
  textColor: "#ffffff",
  headline: "",
  tagline: "",
  logoUrl: null,
  resolution: "300",
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
  onUploadLogo,
  uploadingLogo,
}: PhysicalCardDesignerProps) {
  const dpi = Number(cardDesign.resolution || "300");
  const cardWidthPx = mmToPx(CARD_MM_WIDTH, dpi);
  const cardHeightPx = mmToPx(CARD_MM_HEIGHT, dpi);
  const previewScale = Math.min(0.74, PREVIEW_MAX_WIDTH / cardWidthPx);
  const displayedWidth = cardWidthPx * previewScale;
  const displayedHeight = cardHeightPx * previewScale;
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const pixelRatio = displayedWidth > 0 ? cardWidthPx / displayedWidth : 1;
  const headlineText = cardDesign.headline?.trim() ?? "";
  const taglineText = cardDesign.tagline?.trim() ?? "";

  const qrValue =
    profileUrl || (previewData.email ? `mailto:${previewData.email}` : "https://tapink.com.au");

  const frontCard = (
    <div
      style={{
        width: displayedWidth,
        maxWidth: "100%",
        height: displayedHeight,
        borderRadius: `${CARD_BORDER_RADIUS}px`,
        background: cardDesign.backgroundColor,
        color: cardDesign.textColor,
        padding: "28px",
        boxShadow: "0 22px 50px rgba(15,23,42,0.22)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        overflow: "hidden",
      }}
      ref={frontRef}
    >
      {cardDesign.logoUrl && (
        <img
          src={cardDesign.logoUrl}
          alt="Card logo"
          style={{
            position: "absolute",
            top: "24px",
            right: "24px",
            width: displayedWidth * 0.2,
            height: displayedWidth * 0.2,
            objectFit: "contain",
            filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.25))",
          }}
        />
      )}

      <div>
        <div
          style={{
            width: displayedWidth * 0.24,
            height: 6,
            background: cardDesign.accentColor,
            borderRadius: "999px",
            marginBottom: "18px",
          }}
        />
        {headlineText && (
          <h2
            style={{
              margin: 0,
              fontSize: displayedWidth * 0.12,
              fontWeight: 600,
              letterSpacing: "-0.015em",
            }}
          >
            {headlineText}
          </h2>
        )}
        {taglineText && (
          <p
            style={{
              margin: "6px 0 0",
              fontSize: displayedWidth * 0.06,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              opacity: 0.75,
            }}
          >
            {taglineText}
          </p>
        )}
      </div>
    </div>
  );

  const backCard = (
    <div
      style={{
        width: displayedWidth,
        maxWidth: "100%",
        height: displayedHeight,
        borderRadius: `${CARD_BORDER_RADIUS}px`,
        background: cardDesign.backgroundColor,
        color: cardDesign.textColor,
        padding: "28px",
        boxShadow: "0 22px 50px rgba(15,23,42,0.22)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
      ref={backRef}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
        }}
      >
        <div style={{ display: "grid", gap: "8px", fontSize: "12px" }}>
          <div>
            <p style={{ margin: 0, opacity: 0.6 }}>NAME</p>
            <p style={{ margin: "2px 0 0", fontWeight: 500 }}>
              {previewData.name || "Your Name"}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, opacity: 0.6 }}>ROLE</p>
            <p style={{ margin: "2px 0 0", fontWeight: 500 }}>
              {[previewData.title, previewData.company]
                .filter(Boolean)
                .join(" • ") || "Title • Company"}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, opacity: 0.6 }}>PHONE</p>
            <p style={{ margin: "2px 0 0", fontWeight: 500 }}>
              {previewData.phone || "000 000 000"}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, opacity: 0.6 }}>EMAIL</p>
            <p style={{ margin: "2px 0 0", fontWeight: 500 }}>
              {previewData.email || "hello@tapink.com"}
            </p>
          </div>
        </div>
        <QRCodeCanvas
          value={qrValue}
          size={Math.min(displayedWidth, displayedHeight) * 0.28}
          bgColor="transparent"
          fgColor={cardDesign.textColor}
          level="H"
          includeMargin={false}
        />
      </div>
      <div
        style={{
          width: "100%",
          height: "48px",
          borderRadius: "999px",
          background: cardDesign.accentColor,
          opacity: 0.22,
        }}
      />
    </div>
  );

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
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
      setSaving(false);
    }
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
            {frontCard}
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
            {backCard}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#ffffff",
          border: "1px solid rgba(15,23,42,0.08)",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "0 20px 45px rgba(15,23,42,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <label
            style={{
              fontSize: "13px",
              color: "#475467",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            Resolution
            <select
              value={cardDesign.resolution}
              onChange={(e) =>
                updateCardDesign({ resolution: e.target.value as CardResolution })
              }
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #d0d5dd",
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
          <label style={{ fontSize: "13px", color: "#475467", display: "flex", flexDirection: "column", gap: "6px" }}>
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
          </label>
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
              <input type="file" accept="image/*" onChange={onUploadLogo} style={{ display: "none" }} />
              <span
                style={{
                  padding: "8px 14px",
                  borderRadius: "999px",
                  border: "1px solid #d0d5dd",
                  background: "#f5f6f8",
                }}
              >
                {uploadingLogo ? "Uploading…" : "Upload logo"}
              </span>
              <span style={{ fontSize: "12px", color: "#98a2b3" }}>PNG/SVG • 2MB max</span>
            </label>
          )}
        </div>
      </div>

      <div style={{ marginTop: "8px", fontSize: "13px", color: "#475467" }}>
        Customise the card colours and copy, then click save to update your physical card design.
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          background: "#000000",
          color: "#ffffff",
          border: "none",
          padding: "12px 26px",
          borderRadius: "10px",
          fontWeight: 500,
          cursor: "pointer",
          marginTop: "16px",
          alignSelf: "flex-start",
          opacity: saving ? 0.75 : 1,
          pointerEvents: saving ? "none" : "auto",
        }}
      >
        {saving
          ? "Saving design..."
          : physicalActivated
          ? "Update Card Design"
          : "Save & Activate Physical Card"}
      </button>
    </>
  );
}
