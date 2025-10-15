"use client";

import { QRCodeCanvas } from "qrcode.react";

export default function ProfileQRCode({ profileId }: { profileId: string }) {
  if (!profileId) return null;

  const profileUrl = `${window.location.origin}/user/${profileId}`;

  return (
    <div style={{ marginTop: "15px", textAlign: "center" }}>
      <QRCodeCanvas
        value={profileUrl}
        size={150} // size in pixels
        bgColor="#ffffff"
      fgColor="#000000"
        level="H" // high error correction
        includeMargin={true}
      />
      <p style={{ marginTop: "5px", fontSize: "14px", color: "#000" }}>Scan to view profile</p>
    </div>
  );
}
