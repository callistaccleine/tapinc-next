"use client";

import type React from "react";
import { QRCodeCanvas } from "qrcode.react";

export interface AppleWalletPreviewProps {
  name: string;
  company: string;
  title: string;
  barcodeMessage: string;
  serialNumber: string;
  logoUrl?: string;
  stripImageUrl?: string;
  backgroundColor: string;
  textColor: string;
  labelColor: string;
}

const AppleWalletPreview: React.FC<AppleWalletPreviewProps> = ({
  name,
  company,
  title,
  barcodeMessage,
  serialNumber,
  logoUrl,
  stripImageUrl,
  backgroundColor,
  textColor,
  labelColor,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
      <div
        style={{
          width: 320,
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 16px 36px rgba(15,23,42,0.18)",
          background: backgroundColor,
          color: textColor,
          fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          border: "1px solid rgba(15,23,42,0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px 10px" }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="TapINK logo"
              style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(0,0,0,0.12)",
              }}
            />
          )}
        </div>

        <div style={{ height: 6 }} />

        <div style={{ padding: "14px 16px 10px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.16em", color: labelColor, textTransform: "uppercase" }}>
              Name
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.02em" }}>{name}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.14em", color: labelColor, textTransform: "uppercase" }}>
                Title
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{title || "Title"}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.14em", color: labelColor, textTransform: "uppercase" }}>
                Company
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{company || "Company"}</div>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "12px 16px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 12,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              padding: 6,
              border: "1px solid rgba(15,23,42,0.08)",
            }}
          >
            <QRCodeCanvas
              value={barcodeMessage}
              size={240}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H"
              includeMargin={false}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppleWalletPreview;
