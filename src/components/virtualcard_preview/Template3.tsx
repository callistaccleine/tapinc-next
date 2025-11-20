"use client";

import { useEffect, useState } from "react";
import { CardData } from "@/types/CardData";

type Template3Props = {
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

export default function Template3({ data, onSaveContact }: Template3Props) {
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

  const containerWidth = isMobile ? "100vw" : "min(480px, 100vw)";
  const sectionPadding = isMobile ? "26px 22px" : "34px 30px";

  const infoRow = (
    label: string,
    value?: string,
    opts?: { href?: string; target?: string }
  ) =>
    value ? (
      <a
        key={label}
        href={opts?.href || "#"}
        target={opts?.target}
        rel={opts?.target === "_blank" ? "noopener noreferrer" : undefined}
        onClick={(e) => {
          if (!opts?.href) e.preventDefault();
        }}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 0",
          borderBottom: "1px solid rgba(15,23,42,0.08)",
          color: "#111827",
          textDecoration: "none",
          fontSize: "14px",
        }}
      >
        <span style={{ opacity: 0.55, letterSpacing: "0.08em" }}>
          {label.toUpperCase()}
        </span>
        <span
          style={{
            fontWeight: 500,
            textAlign: "right",
            marginLeft: "18px",
          }}
        >
          {value}
        </span>
      </a>
    ) : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        width: containerWidth,
        margin: isMobile ? "0" : "40px auto",
        borderRadius: isMobile ? "0" : "26px",
        overflow: "hidden",
        boxShadow: isMobile ? "none" : "0 24px 70px rgba(15,23,42,0.16)",
        background: "#f6f7f9",
        display: "flex",
        flexDirection: "column",
        fontFamily:
          "'SF Pro Display', -apple-system, BlinkMacSystemFont, Helvetica, sans-serif",
        color: "#0f172a",
      }}
    >
      {/* Executive Header */}
      <header
        style={{
          background: data.headerBanner
            ? `url(${data.headerBanner}) center / cover no-repeat`
            : "linear-gradient(135deg, #0e101a 0%, #1c2236 100%)",
          position: "relative",
          padding: sectionPadding,
          paddingBottom: isMobile ? "96px" : "110px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(160deg, rgba(14,16,26,0.8) 0%, rgba(28,34,54,0.55) 65%, rgba(28,34,54,0.3) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            color: "#eef1f6",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                letterSpacing: "0.18em",
                opacity: 0.6,
              }}
            >
              PROFILE
            </p>
            <h1
              style={{
                margin: "10px 0 4px",
                fontSize: "28px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              {data.name}
            </h1>
            {(data.title || data.company) && (
              <p
                style={{
                  margin: 0,
                  fontSize: "16px",
                  opacity: 0.75,
                }}
              >
                {[data.title, data.company && `@${data.company}`]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            )}
          </div>

          {data.profilePic ? (
            <img
              src={data.profilePic}
              alt={data.name}
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid rgba(255,255,255,0.5)",
                boxShadow: "0 18px 28px rgba(14,16,26,0.35)",
              }}
            />
          ) : (
            <div
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: "30px",
                border: "3px solid rgba(255,255,255,0.35)",
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
      </header>

      {/* Body */}
      <main
        style={{
          flex: 1,
          background: "#ffffff",
          padding: sectionPadding,
          display: "flex",
          flexDirection: "column",
          gap: "26px",
        }}
      >
        {/* Bio */}
        {data.bio && (
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              lineHeight: 1.7,
              color: "rgba(15,23,42,0.72)",
            }}
          >
            {data.bio}
          </p>
        )}

        {/* Contact Information */}
        <section
          style={{
            border: "1px solid rgba(15,23,42,0.08)",
            borderRadius: "18px",
            padding: isMobile ? "18px" : "22px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {infoRow("Email", data.email, { href: data.email && `mailto:${data.email}` })}
          {infoRow("Phone", data.phone, { href: data.phone && `tel:${data.phone}` })}
          {infoRow("Address", data.address, {
            href:
              data.address &&
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                data.address
              )}`,
            target: "_blank",
          })}
        </section>

        {/* Socials */}
        {data.socials && data.socials.length > 0 && (
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                letterSpacing: "0.16em",
                color: "rgba(15,23,42,0.45)",
              }}
            >
              SOCIAL
            </span>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              {data.socials.map((social, index) => (
                <a
                  key={`${social.platform}-${index}`}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "999px",
                    border: "1px solid rgba(15,23,42,0.1)",
                    background: "#f5f6f8",
                    color: "#0f172a",
                    fontSize: "13px",
                    letterSpacing: "-0.01em",
                    textDecoration: "none",
                  }}
                >
                  {social.platform}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Links */}
        {data.links && data.links.length > 0 && (
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                letterSpacing: "0.16em",
                color: "rgba(15,23,42,0.45)",
              }}
            >
              LINKS
            </span>
            {data.links.map((link, index) => (
              <a
                key={`${link.title}-${index}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "14px 18px",
                  borderRadius: "16px",
                  border: "1px solid rgba(15,23,42,0.08)",
                  background: "#fff",
                  boxShadow: "0 10px 22px rgba(15,23,42,0.06)",
                  textDecoration: "none",
                  color: "#0f172a",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "14px",
                }}
              >
                <span>{link.title}</span>
                <span style={{ fontSize: "12px", opacity: 0.55 }}>↗</span>
              </a>
            ))}
          </section>
        )}
      </main>

      {/* Save Contact */}
      <div
        style={{
          width: "100%",
          background: "#ffffff",
          padding: "22px 0 26px",
          textAlign: "center",
        }}
      >
        <button
          onClick={handleSaveContact}
          style={{
            background: "#111827",
            color: "#fff",
            fontWeight: 600,
            fontSize: "15px",
            border: "none",
            padding: "14px 46px",
            borderRadius: "999px",
            cursor: "pointer",
            boxShadow: "0 14px 32px rgba(17,24,39,0.2)",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            letterSpacing: "0.05em",
            transition: "transform 0.25s ease, box-shadow 0.25s ease",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.transform =
              "translateY(-2px)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)")
          }
        >
          Save Contact
          <span
            aria-hidden="true"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "18px",
              height: "18px",
            }}
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
          padding: "14px 0 24px",
          textAlign: "center",
          fontSize: "12px",
          color: "rgba(15,23,42,0.5)",
          borderTop: "1px solid rgba(15,23,42,0.06)",
          background: "#ffffff",
        }}
      >
        © TapInk 2025 — All rights reserved.
      </footer>
    </div>
  );
}
