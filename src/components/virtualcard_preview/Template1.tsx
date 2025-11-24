"use client";

import { useState, useEffect } from "react";
import { CardData } from "@/types/CardData";

type Template1Props = {
  data: CardData;
  onSaveContact?: () => void | Promise<void>;
};

const normalizeName = (name?: string) => {
  const formattedName = name?.trim() || "TapInk Contact";
  const [firstName = "", ...rest] = formattedName.split(/\s+/);
  const lastName = rest.join(" ");
  const structuredName = `${lastName};${firstName};;;`;
  return { formattedName, structuredName };
};

export default function Template1({ data, onSaveContact }: Template1Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 600);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSaveContact = async () => {
    const { formattedName, structuredName } = normalizeName(data.name);
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${formattedName}
N:${structuredName}
TITLE:${data.title || ""}
ORG:${data.company || ""}
TEL;TYPE=WORK,VOICE:${data.phone || ""}
EMAIL;TYPE=PREF,INTERNET:${data.email || ""}
ADR;TYPE=WORK:;;${data.address || ""};;;;
NOTE:${data.bio || ""}
END:VCARD`;

    const blob = new Blob([vCard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.name.replace(/\s+/g, "_")}.vcf`;
    a.click();
    URL.revokeObjectURL(url);

    try {
      await onSaveContact?.();
    } catch (err) {
      console.error("Failed to track save contact event", err);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: isMobile ? "100vw" : "min(480px, 100vw)",
        background: "#fff",
        borderRadius: isMobile ? "0" : "32px",
        boxShadow: isMobile ? "none" : "0 10px 35px rgba(0,0,0,0.06)",
        margin: isMobile ? "0" : "40px auto",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        boxSizing: "border-box",
        fontFamily:
          "'SF Pro Display', -apple-system, BlinkMacSystemFont, Helvetica, sans-serif",
        color: "#111",
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          width: "100%",
          height: "180px",
          backgroundImage: data.headerBanner
            ? `url(${data.headerBanner})`
            : "linear-gradient(135deg, #1b1a2f 0%, #2b2dbd 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          position: "relative",
          overflow: "visible",
        }}
      >
        {data.headerBanner && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 100%)",
            }}
          />
        )}
        {data.profilePic && (
          <img
            src={data.profilePic}
            alt={data.name}
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              border: "3px solid #fff",
              position: "absolute",
              bottom: "-45px",
              left: "40px",
              objectFit: "cover",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
              zIndex: 1,
            }}
          />
        )}
      </div>

      {/* Info Section */}
      <div
        style={{
          width: "100%",
          padding: isMobile ? "60px 20px 28px" : "60px 30px 28px",
          boxSizing: "border-box",
        }}
      >
        <h2
          style={{
            margin: "0",
            fontSize: "22px",
            fontWeight: 700,
            textAlign: "left",
          }}
        >
          {data.name}
        </h2>

        <p
          style={{
            color: "#555",
            margin: "4px 0 0",
            fontSize: "14px",
            textAlign: "left",
          }}
        >
          {data.title}
          {data.company && ` @${data.company}`}
        </p>

        {data.phone && (
          <p
            style={{
              margin: "10px 0 0",
              fontSize: "14px",
              color: "#333",
              textAlign: "left",
            }}
          >
            {data.phone}
          </p>
        )}

        {data.email && (
          <p
            style={{
              margin: "4px 0 12px",
              fontSize: "14px",
              color: "#333",
              textAlign: "left",
            }}
          >
            {data.email}
          </p>
        )}

        {/* Socials */}
        {data.socials && data.socials.length > 0 && (
          <div
            style={{
              marginTop: "18px",
              display: "flex",
              justifyContent: "flex-start",
              gap: "14px",
            }}
          >
            {data.socials.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "#f0f0f0",
                  borderRadius: "50%",
                  width: "44px",
                  height: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.25s ease",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background =
                    "#e5e5e5")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background =
                    "#f0f0f0")
                }
              >
                <img
                  src={`/icons/${s.platform.toLowerCase()}.svg`}
                  alt={s.platform}
                  width="20"
                  height="20"
                />
              </a>
            ))}
          </div>
        )}

        {/* Bio */}
        {data.bio && (
          <p
            style={{
              marginTop: "25px",
              fontSize: "14px",
              color: "#333",
              borderBottom: "1px solid #eee",
              paddingBottom: "10px",
            }}
          >
            {data.bio}
          </p>
        )}

        {/* Address */}
        {data.address && (
          <a
            style={{
              margin: "10px 0",
              fontSize: "13px",
              color: "#2b2dbd",
              borderBottom: "1px solid #eee",
              paddingBottom: "6px",
              textDecoration: "none",
              display: "inline-block",
            }}
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              data.address
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {data.address}
          </a>
        )}

        {/* Links */}
        {data.links &&
          data.links.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                fontSize: "13px",
                color: "#2b2dbd",
                textDecoration: "none",
                marginTop: "5px",
                borderBottom: "1px solid #eee",
                paddingBottom: "6px",
              }}
            >
              {link.title}
            </a>
          ))}
      </div>

      {/* Save Contact Button */}
      <div
        style={{
          width: "100%",
          background: "#fff",
          padding: "30px 0 40px",
          textAlign: "center",
        }}
      >
        <button
          onClick={handleSaveContact}
          style={{
            background: "linear-gradient(135deg, #4a52ff, #3b3eff)",
            color: "#fff",
            fontWeight: 600,
            fontSize: "16px",
            border: "none",
            padding: "14px 42px",
            borderRadius: "30px",
            cursor: "pointer",
            boxShadow: "0 6px 14px rgba(59,62,255,0.25)",
            transition: "transform 0.25s ease, box-shadow 0.25s ease",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")
          }
        >
          Save Contact
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "20px",
              height: "20px",
            }}
            aria-hidden="true"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 12L20 4L12 20L10.5 13.5L4 12Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        </button>
      </div>

      {/* Footer */}
      <footer
        style={{
          width: "100%",
          padding: "24px 0 30px",
          fontSize: "13px",
          color: "#999",
          textAlign: "center",
          borderTop: "1px solid #f1f1f1",
        }}
      >
        <span>© TapInk 2025 — All rights reserved.</span>
      </footer>
    </div>
  );
}
