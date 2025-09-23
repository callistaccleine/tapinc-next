"use client";

import Image from "next/image";

type CardData = {
  name: string;
  title: string;
  phone: string;
  email: string;
  bio?: string;
  address?: string;
  links?: string[];
  profilePic?: string;
};

export default function VirtualPreview({ data }: { data: CardData }) {
  return (
    <div
      style={{
        position: "relative",
        width: "360px", // mobile width
        height: "640px", // aspect ratio of template
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
      }}
    >
      {/* Background template */}
      <Image
        src="/templates/template1.svg"
        alt="Business Card Template"
        fill
        style={{ objectFit: "cover" }}
      />

      {/* Profile Picture */}
      {data.profilePic && (
        <Image
          src={data.profilePic}
          alt={data.name}
          width={80}
          height={80}
          style={{
            position: "absolute",
            top: "100px",
            left: "20px",
            borderRadius: "50%",
            border: "3px solid white",
          }}
        />
      )}

      {/* Name & Job Title */}
      <div
        style={{
          position: "absolute",
          top: "200px",
          left: "20px",
          color: "#000",
        }}
      >
        <h2 style={{ margin: 0 }}>{data.name}</h2>
        <p style={{ margin: 0 }}>{data.title}</p>
      </div>

      {/* Contact Info */}
      <div
        style={{
          position: "absolute",
          bottom: "100px",
          left: "20px",
          right: "20px",
          fontSize: "14px",
          lineHeight: "1.5",
        }}
      >
        <p>{data.phone}</p>
        <p>{data.email}</p>
        {data.address && <p>{data.address}</p>}
        {data.links && data.links.length > 0 && (
          <p>
            {data.links.map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginRight: "10px" }}
              >
                {link}
              </a>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}
