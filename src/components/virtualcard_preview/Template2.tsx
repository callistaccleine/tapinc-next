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
      {/* Background from your SVG file */}
      <image href="/templates/template2_blank.svg" width="360" height="640" />

      {/* Profile Picture */}
      {data.profilePic && (
        <image
          href={data.profilePic}
          x="20"
          y="60"
          width="80"
          height="80"
          clipPath="circle(40px at 60px 100px)" 
        />
      )}

      {/* Name */}
      <text x="100" y="180" fontSize="22" fontFamily="sans-serif" fontWeight="bold" fill="#000">
        {data.name}
      </text>

      {/* Job Title */}
      <text x="110" y="210
      " fontSize="15" fontFamily="sans-serif" fill="#000">
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
        <text x="110" y="245" fontSize="15" fontFamily="sans-serif" fill="#333">
          {data.bio}
        </text>
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
