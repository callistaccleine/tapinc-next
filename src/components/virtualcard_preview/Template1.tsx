"use client";

import { useState, useEffect } from "react";

interface CardData {
  name: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  bio?: string;
  profilePic?: string;
  socials?: { platform: string; url: string }[];
  links?: { title: string; url: string }[];
}

export default function Template1({ data }: { data: CardData }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 600);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSaveContact = () => {
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${data.name}
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff", // unified white background
        borderRadius: "40px",
        boxShadow: "0 10px 35px rgba(0,0,0,0.06)",
        maxWidth: "480px",
        margin: "40px auto",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily:
          "'SF Pro Display', -apple-system, BlinkMacSystemFont, Helvetica, sans-serif",
        color: "#111",
      }}
    >
      {/* Header Gradient */}
      <div
        style={{
          width: "100%",
          height: "180px",
          background: "linear-gradient(135deg, #1b1a2f 0%, #2b2dbd 100%)",
          position: "relative",
        }}
      >
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
            }}
          />
        )}
      </div>

      {/* Info Section */}
      <div
        style={{
          width: "100%",
          padding: "60px 30px 20px",
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
          <p
            style={{
              margin: "10px 0",
              fontSize: "13px",
              color: "#444",
              borderBottom: "1px solid #eee",
              paddingBottom: "6px",
            }}
          >
            {data.address}
          </p>
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
          borderTop: "1px solid #f1f1f1",
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
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")
          }
        >
          Save Contact
        </button>
      </div>

      {/* Footer */}
      <footer
        style={{
          marginBottom: "20px",
          fontSize: "13px",
          color: "#999",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span>TapInk 2025</span>
        <a
          href="https://tapink.com.au"
          style={{
            background:
              "linear-gradient(135deg, #ff7a00 0%, #ff9502 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 600,
          }}
          target="_blank"
        >
          TapINK
        </a>
      </footer>
    </div>
  );
}
