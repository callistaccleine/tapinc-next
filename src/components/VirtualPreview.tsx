"use client";

import Image from "next/image";

type Link = {
  title: string;
  url: string;
};

type CardData = {
  name: string;
  title: string;
  phone: string;
  email: string;
  bio?: string;
  address?: string;
  links?: Link[];
  profilePic?: string;
  template?: string;
};

export default function VirtualPreview({ data }: { data: CardData }) {
  return (
    <div
      style={{
        position: "relative",
        width: "360px",
        height: "640px",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
      }}
    >
      {/* Background template */}
      {data.template && (
        <Image
          src={`/templates/${data.template}`}
          alt="Business Card Template"
          fill
          style={{ objectFit: "cover" }}
        />
      )}

      {/* Profile Picture */}
      {data.profilePic && (
        <Image
          src={data.profilePic}
          alt={data.name}
          width={80}
          height={80}
          style={{
            position: "absolute",
            top: "80px",
            left: "20px",
            borderRadius: "50%",
            border: "3px solid white",
          }}
        />
      )}

      {/* Name */}
      <div
        style={{
          position: "absolute",
          top: "290px",
          left: "20px",
          color: "#000",
        }}
      >
        <h2 style={{ margin: 0 }}>{data.name}</h2>
      </div>

      {/* Job Title */}
      <div
        style={{
          position: "absolute",
          top: "310px",
          left: "20px",
          color: "#000",
        }}
      >
        <p style={{ margin: 0 }}>{data.title}</p>
      </div>

      {/* Phone */}
      <div
        style={{
          position: "absolute",
          top: "360px",
          left: "20px",
          fontSize: "15px",
          color: "#000",
        }}
      >
        <p style={{ margin: 0 }}>{data.phone}</p>
      </div>

      {/* Email */}
      <div
        style={{
          position: "absolute",
          top: "380px",
          left: "20px",
          fontSize: "15px",
          color: "#000",
        }}
      >
        <p style={{ margin: 0 }}>{data.email}</p>
      </div>

      {/* Address */}
      {data.address && (
        <div
          style={{
            position: "absolute",
            top: "510px",
            left: "20px",
            fontSize: "15px",
            color: "#000",
          }}
        >
          <p style={{ margin: 0 }}>{data.address}</p>
        </div>
      )}

      {/* Bio */}
      {data.bio && (
        <div
          style={{
            position: "absolute",
            top: "480px",
            left: "20px",
            right: "20px",
            fontSize: "14px",
            color: "#000",
          }}
        >
          <p style={{ margin: 0 }}>{data.bio}</p>
        </div>
      )}

      {/* Links */}
      {data.links && data.links.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: "78px",
            left: "20px",
            right: "20px",
            fontSize: "14px",
            color: "#000",
          }}
        >
          {data.links.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginRight: "10px" }}
            >
              {link.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
