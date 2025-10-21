"use client";

import { CardData } from "@/types/CardData";

export default function Template1({ data }: { data: CardData }) {
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

    // Detect Safari/iOS
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS || isSafari) {
      // For iOS/Safari: Direct navigation to blob URL
      window.location.href = url;
    } else {
      // Standard download for other browsers
      const link = document.createElement("a");
      link.href = url;
      link.download = `${data.name.replace(/\s+/g, "_")}.vcf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Cleanup after delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div style={{ position: "relative", width: "360px", height: "640px" }}>
      <svg
        width="360"
        height="640"
        viewBox="0 0 360 640"
        xmlns="http://www.w3.org/2000/svg"
        style={{ borderRadius: "20px", overflow: "hidden" }}
      >
        {/* Define clip path for circular profile picture */}
        <defs>
          <clipPath id="circleClip">
            <circle cx="65" cy="242" r="45" />
          </clipPath>
          <clipPath id="headerClip">
            <path d="M 0 20 Q 0 0, 20 0 L 340 0 Q 360 0, 360 20 L 360 250 L 0 250 Z" />
          </clipPath>
        </defs>

        {/* Background from your SVG file */}
        <image href="/templates/template1_blank.svg" width="360" height="640" />

        {/* Header Banner - covers the dark grey area at top */}
        {data.headerBanner && (
          <image
            href={data.headerBanner}
            x="0"
            y="0"
            width="360"
            height="250"
            clipPath="url(#headerClip)"
            preserveAspectRatio="xMidYMid slice"
          />
        )}

        {/* Profile Picture - circular clipped, overlays on top of header */}
        {data.profilePic && (
          <image
            href={data.profilePic}
            x="20"
            y="198"
            width="90"
            height="90"
            clipPath="url(#circleClip)"
            preserveAspectRatio="xMidYMid slice"
          />
        )}

        {/* Name */}
        <text x="20" y="308" fontSize="20" fontFamily="sans-serif" fontWeight="bold" fill="#000">
          {data.name}
        </text>

        {/* Job Title */}
        <text x="20" y="330" fontSize="15" fontFamily="sans-serif" fill="#000">
          {data.title} {data.company ? `@${data.company}` : ""}
        </text>

        {/* Phone */}
        <text x="20" y="360" fontSize="15" fontFamily="sans-serif" fill="#000">
          {data.phone}
        </text>

        {/* Email */}
        <text x="20" y="390" fontSize="15" fontFamily="sans-serif" fill="#000">
          {data.email}
        </text>

        {/* Bio */}
        {data.bio && (
          <text x="20" y="490" fontSize="13" fontFamily="sans-serif" fill="#333">
            {data.bio}
          </text>
        )}

        {/* Address */}
        {data.address && (
          <text x="20" y="525" fontSize="13" fontFamily="sans-serif" fill="#333">
            {data.address}
          </text>
        )}

        {/* Socials */}
        {data.socials && data.socials.length > 0 && (
          <g>
            {data.socials.map((social, i) => {
              const iconPath = `/icons/${social.platform.toLowerCase()}.svg`;
              return (
                <a
                  key={i}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <image
                    href={iconPath}
                    x={35 + i * 63}
                    y="425"
                    width="20"
                    height="20"
                  />
                </a>
              );
            })}
          </g>
        )}

        {/* Links */}
        {data.links && data.links.length > 0 && (
          <g>
            {data.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <text
                  x="20"
                  y={560 + i * 20}
                  fontSize="12"
                  fill="blue"
                  textDecoration="underline"
                >
                  {link.title}
                </text>
              </a>
            ))}
          </g>
        )}

        {/* Button -ClickableRect */}
        <rect
          x="100"
          y="590"
          width="160"
          height="35"
          fill="transparent"
          onClick={handleSaveContact}
          style={{ cursor: "pointer" }}
        />
        <text 
          x="125" 
          y="612" 
          fontSize="15" 
          fontFamily="sans-serif" 
          fill="#fff"
          style={{ pointerEvents: "none" }}
        >
          Save Contact
        </text>
      </svg>
    </div>
  );
}