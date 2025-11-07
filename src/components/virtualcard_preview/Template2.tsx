"use client";

import { useEffect, useState } from "react";
import { CardData } from "@/types/CardData";

const normalizeName = (name?: string) => {
  const formattedName = name?.trim() || "TapInk Contact";
  const [firstName = "", ...rest] = formattedName.split(/\s+/);
  const lastName = rest.join(" ");
  const structuredName = `${lastName};${firstName};;;`;
  return { formattedName, structuredName };
};

export default function Template2({ data }: { data: CardData }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 600);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSaveContact = () => {
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
  };

  const containerPadding = isMobile ? "28px 24px 36px" : "36px 32px 48px";

  return (
    <div
      style={{
        minHeight: "100vh",
        width: isMobile ? "100vw" : "min(480px, 100vw)",
        margin: isMobile ? "0" : "40px auto",
        borderRadius: isMobile ? "0" : "28px",
        boxShadow: isMobile ? "none" : "0 18px 48px rgba(15,23,42,0.12)",
        background: "#f9fafc",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontFamily:
          "'SF Pro Display', -apple-system, BlinkMacSystemFont, Helvetica, sans-serif",
        color: "#0f172a",
      }}
    >
      {/* Hero */}
      <div
        style={{
          position: "relative",
          width: "100%",
          padding: containerPadding,
          paddingBottom: isMobile ? "72px" : "84px",
          backgroundImage: data.headerBanner
            ? `url(${data.headerBanner})`
            : "linear-gradient(135deg, #1b1a2f 0%, #2b2dbd 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(160deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 60%)",
            mixBlendMode: "multiply",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "22px",
            color: "#fff",
          }}
        >
          {data.profilePic ? (
            <img
              src={data.profilePic}
              alt={data.name}
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "60px",
                objectFit: "cover",
                boxShadow: "0 18px 30px rgba(0,0,0,0.35)",
                border: "4px solid rgba(255,255,255,0.7)",
              }}
            />
          ) : (
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "60px",
                background: "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: "34px",
                boxShadow: "0 18px 30px rgba(0,0,0,0.35)",
                border: "4px solid rgba(255,255,255,0.2)",
              }}
            >
              {data.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}

        </div>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          padding: isMobile ? "28px 24px 0" : "36px 32px 0",
          display: "flex",
          flexDirection: "column",
          gap: "22px",
          background: "#ffffff",
          borderTopLeftRadius: isMobile ? "24px" : "0",
          borderTopRightRadius: isMobile ? "24px" : "0",
          marginTop: "-24px",
        }}
      >
        {/* Name & Title */}
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "#0f172a",
            }}
          >
            {data.name}
          </h2>
          {(data.title || data.company) && (
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "14px",
                color: "rgba(15,23,42,0.6)",
                letterSpacing: "-0.005em",
              }}
            >
              {[data.title, data.company && `@${data.company}`]
                .filter(Boolean)
                .join(" ")}
            </p>
          )}
        </div>

        {/* Bio */}
        {data.bio && (
          <p
            style={{
              fontSize: "15px",
              color: "rgba(15,23,42,0.7)",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {data.bio}
          </p>
        )}

        {/* Contact */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            padding: "18px",
            borderRadius: "18px",
            background: "#f5f7fb",
          }}
        >
          {data.email && (
            <a
              href={`mailto:${data.email}`}
              style={{
                textDecoration: "none",
                color: "#0f172a",
                fontSize: "14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ opacity: 0.65 }}>Email</span>
              <span style={{ fontWeight: 500 }}>{data.email}</span>
            </a>
          )}

          {data.phone && (
            <a
              href={`tel:${data.phone}`}
              style={{
                textDecoration: "none",
                color: "#0f172a",
                fontSize: "14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ opacity: 0.65 }}>Phone</span>
              <span style={{ fontWeight: 500 }}>{data.phone}</span>
            </a>
          )}

          {data.address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                data.address
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: "none",
                color: "#0f172a",
                fontSize: "14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ opacity: 0.65 }}>Address</span>
              <span style={{ fontWeight: 500, textAlign: "right" }}>
                {data.address}
              </span>
            </a>
          )}
        </div>

        {/* Socials */}
        {data.socials && data.socials.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            {data.socials.map((social, index) => (
              <a
                key={`${social.platform}-${index}`}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "10px 18px",
                  borderRadius: "999px",
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                  fontSize: "13px",
                  color: "#0f172a",
                  textDecoration: "none",
                  background: "#f8f9fc",
                }}
              >
                {social.platform}
              </a>
            ))}
          </div>
        )}

        {/* Links */}
        {data.links && data.links.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {data.links.map((link, index) => (
              <a
                key={`${link.title}-${index}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "14px 18px",
                  borderRadius: "16px",
                  border: "1px solid rgba(15, 23, 42, 0.05)",
                  background: "#ffffff",
                  boxShadow: "0 6px 18px rgba(15,23,42,0.05)",
                  fontSize: "14px",
                  color: "#2b2dbd",
                  textDecoration: "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{link.title}</span>
                <span style={{ fontSize: "12px", opacity: 0.6 }}>↗</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Save Contact */}
      <div
        style={{
          width: "100%",
          background: "#ffffff",
          padding: "24px 0 30px",
          textAlign: "center",
        }}
      >
        <button
          onClick={handleSaveContact}
          style={{
            background: "#0f172a",
            color: "#fff",
            fontWeight: 600,
            fontSize: "15px",
            border: "none",
            padding: "14px 38px",
            borderRadius: "999px",
            cursor: "pointer",
            boxShadow: "0 12px 30px rgba(15,23,42,0.16)",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            transition: "transform 0.25s ease, box-shadow 0.25s ease",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.transform =
              "translateY(-1px)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)")
          }
        >
          Save Contact
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "18px",
              height: "18px",
            }}
            aria-hidden="true"
          >
            <svg
              width="18"
              height="18"
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
          padding: "16px 0 26px",
          textAlign: "center",
          fontSize: "12px",
          color: "rgba(15,23,42,0.55)",
          borderTop: "1px solid rgba(15, 23, 42, 0.05)",
          background: "#ffffff",
        }}
      >
        © TapInk 2025 — All rights reserved.
      </footer>
    </div>
  );
}
