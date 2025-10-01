"use client";

import { CardData } from "@/types/CardData";

export default function Template3({ data }: { data: CardData }) {
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
      <image href="/templates/template3_blank.svg" width="360" height="640" />

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
      <text x="20" y="250" fontSize="22" fontFamily="sans-serif" fontWeight="bold" fill="#000">
        {data.name}
      </text>

      {/* Job Title */}
      <text x="20" y="270
      " fontSize="17" fontFamily="sans-serif" fill="#000">
        {data.title}
      </text>

      {/* Phone */}
      <text x="50" y="395" fontSize="15" fontFamily="sans-serif" fill="#000">
        {data.phone}
      </text>

      {/* Email */}
      <text x="50" y="355" fontSize="15" fontFamily="sans-serif" fill="#000">
        {data.email}
      </text>

      {/* Bio */}
      {data.bio && (
        <text x="20" y="300" fontSize="15" fontFamily="sans-serif" fill="#333">
          {data.bio}
        </text>
      )}

      {/* Socials */}
      {data.socials && data.socials.length > 0 && (
        <g>
            {data.socials.slice(0, 2).map((social, i) => {
                // pick the right icon file based on platform name
                const iconPath = `/icons/${social.platform.toLowerCase()}.svg`;
                return (
                    <a
                        key={i}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        >
                        {/* Icon */}
                        <image
                            href={iconPath}
                            x={28 + i * 61}
                            y="445"
                            width="24"
                            height="24"
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
                x="15"
                y={550 + i * 20}
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
        <text x="135" y="609" fontSize="15" fontFamily="sans-serif" fill="#fff">
            Save Contact
        </text>
      </a>
    </svg>
  );
}
