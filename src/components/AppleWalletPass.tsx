import type React from "react";

export interface WalletField {
  label: string;
  value: string;
}

export interface AppleWalletPassProps {
  logoUrl?: string;
  stripImageUrl?: string;
  organizationName?: string;
  primaryField?: WalletField;
  secondaryFields?: WalletField[];
  auxiliaryFields?: WalletField[];
  backgroundColor?: string;
  labelColor?: string;
  textColor?: string;
  accentColor?: string;
  borderColor?: string;
  cornerRadius?: number;
  showShadow?: boolean;
  qrContent?: React.ReactNode;
  barcodeMessage?: string;
  serialNumber?: string;
  walletButtonText?: string;
  walletButtonUrl?: string;
  onAddToWallet?: () => void;
  showWalletButton?: boolean;
}

/**
 * Lightweight, modular Apple Wallet–style pass renderer.
 * Drop this into any screen or canvas; pass data through props.
 */
const AppleWalletPass: React.FC<AppleWalletPassProps> = ({
  logoUrl,
  stripImageUrl,
  primaryField = { label: "NAME", value: "Jane Doe" },
  secondaryFields = [{ label: "COMPANY", value: "TapInk Inc." }],
  auxiliaryFields = [{ label: "TITLE", value: "Title" }],
  backgroundColor = "#0c0d11",
  labelColor = "#b8bec9",
  textColor = "#f8fafc",
  accentColor = "#d1b89b",
  borderColor,
  cornerRadius = 22,
  showShadow = true,
  qrContent,
  barcodeMessage = "https://tapink.com",
  serialNumber = "0000 1111 2222",
  walletButtonText = "Add to Wallet",
  walletButtonUrl,
  onAddToWallet,
  showWalletButton = true,
}) => {
  const softBorder = borderColor ?? "rgba(255,255,255,0.08)";
  const shadow = showShadow ? "0 20px 48px rgba(0,0,0,0.22)" : "none";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
      <div
        style={{
          width: 320,
          borderRadius: cornerRadius,
          overflow: "hidden",
          boxShadow: shadow,
          background: `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 40%), linear-gradient(145deg, ${backgroundColor} 0%, ${backgroundColor})`,
          color: textColor,
          fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          border: `1px solid ${softBorder}`,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0))",
            mixBlendMode: "soft-light",
          }}
        />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 16px",
          background: "rgba(255,255,255,0.02)",
          borderBottom: `1px solid ${softBorder}`,
        }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="TAPINK_ICON_WHTE.png"
            style={{ width: 34, height: 34, borderRadius: 9, objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "rgba(255,255,255,0.06)",
            }}
          />
        )}
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }} />
      </div>

      {/* Strip image / hero */}
      {stripImageUrl && (
        <div style={{ width: "100%", height: 250, background: "#111827" }}>
          <img
            src={stripImageUrl}
            alt="hero"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      )}

      {/* Fields */}
      <div style={{ padding: "16px 16px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Primary */}
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.18em", color: labelColor, textTransform: "uppercase" }}>
            {primaryField.label}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.02em" }}>{primaryField.value}</div>
        </div>

        {/* Secondary: Company */}
        {secondaryFields.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            {secondaryFields.slice(0, 1).map((field) => (
              <div key={field.label}>
                <div style={{ fontSize: 10, letterSpacing: "0.14em", color: labelColor, textTransform: "uppercase" }}>
                  {field.label}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.01em" }}>{field.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Title */}
        {auxiliaryFields.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            {auxiliaryFields.slice(0, 1).map((field) => (
              <div key={field.label}>
                <div style={{ fontSize: 10, letterSpacing: "0.14em", color: labelColor, textTransform: "uppercase" }}>
                  {field.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.01em" }}>{field.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Barcode / footer */}
        <div
          style={{
            padding: "14px 16px",
            borderTop: `1px solid ${softBorder}`,
            background: "rgba(255,255,255,0.02)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px",
            }}
          >
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 14,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {qrContent}
            </div>
          </div>
          <div style={{ fontSize: 11, color: labelColor, letterSpacing: "0.08em", textAlign: "center" }}>
            {serialNumber}
          </div>
        </div>
      </div>

      {showWalletButton && (
        <a
          href={walletButtonUrl}
          onClick={(e) => {
            if (onAddToWallet) {
              e.preventDefault();
              onAddToWallet();
            }
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderRadius: 12,
            background: "linear-gradient(135deg, #000000, #111827)",
            color: "#ffffff",
            textDecoration: "none",
            fontWeight: 700,
            letterSpacing: "0.08em",
            boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}></span>
          <span>{walletButtonText}</span>
        </a>
      )}
    </div>
  );
};

export default AppleWalletPass;
