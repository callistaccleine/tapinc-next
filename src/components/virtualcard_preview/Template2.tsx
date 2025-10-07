"use client";

import { CardData } from "@/types/CardData";

export default function Template2({ data }: { data: CardData }) {
    const vCard = `BEGIN:VCARD
    VERSION:3.0
    FN:${data.name}
    TITLE:${data.title || ""}
    TEL;TYPE=WORK,VOICE:${data.phone || ""}
    EMAIL;TYPE=PREF,INTERNET:${data.email || ""}
    ADR;TYPE=WORK:;;${data.address || ""};;;; 
    NOTE:${data.bio || ""}
    END:VCARD`;
    
    const blob = new Blob([vCard], { type: "text/vcard" });
    const vCardUrl = URL.createObjectURL(blob);
    
  return (
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
          <circle cx="175" cy="115" r="45" />
        </clipPath>
        <clipPath id="headerClip">
          <path d="M0,0 
                   H360
                   V150 
                   Q180,90 0,150
                   Z" />
        </clipPath>
      </defs>

      {/* Background from your SVG file */}
      <image href="/templates/template2_blank.svg" width="360" height="640" />

      {/* Header Banner - covers the dark grey area at top */}
      {data.headerBanner && (
        <image
          href={data.headerBanner}
          x="0"
          y="0"
          width="360"
          height="160"
          clipPath="url(#headerClip)"
          preserveAspectRatio="xMidYMid slice"
        />
      )}

      {/* Profile Picture - circular clipped, overlays on top of header */}
      {data.profilePic && (
        <image
          href={data.profilePic}
          x="130"
          y="70"
          width="90"
          height="90"
          clipPath="url(#circleClip)"
          preserveAspectRatio="xMidYMid slice"
        />
      )}

      {/* Name */}
      <text x="180" y="190" fontSize="22" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle" fill="#000">
        {data.name}
      </text>

      {/* Job Title */}
      <text x="180" y="220
      " fontSize="15" fontFamily="sans-serif" textAnchor="middle" fill="#000">
        {data.title}
      </text>

      {/* Phone */}
      <text x="20" y="415" fontSize="15" fontFamily="sans-serif" fill="#000">
        {data.phone}
      </text>

      {/* Email */}
      <text x="20" y="390" fontSize="15" fontFamily="sans-serif" fill="#000">
        {data.email}
      </text>

      {/* Bio */}
      {data.bio && (
        <text x="180" y="250" fontSize="15" fontFamily="sans-serif"  textAnchor="middle" fill="#333">
          {data.bio}
        </text>
      )}

      {/* Socials */}
      {data.socials && data.socials.length > 0 && (
        <g>
            {data.socials.slice(0, 2).map((social, i) => {
                return (
                    <a
                        key={i}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        >
                        {/* Icon */}
                        <text
                            x ="20"
                            y={485 + i * 30}
                            fontSize="13"
                            fontFamily="sans-serif"
                            fill="blue"
                            textDecoration="underline"
                        >
                            {social.url}
                        </text>
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
                y={572 + i * 20}
                fontSize="13"
                fill="blue"
                textDecoration="underline"
              >
                {link.title}
              </text>
            </a>
          ))}
        </g>
      )}

      {/* Button */}
      <a href={vCardUrl} download={`${data.name}.vcf`} target="_blank">
        {/* <rect x="110" y="590" width="140" height="30" rx="6" fill="#007AFF" /> */}
        <text x="128" y="292" fontSize="15" fontFamily="sans-serif" fill="#fff">
            Save Contact
        </text>
      </a>
    </svg>
  );
}
