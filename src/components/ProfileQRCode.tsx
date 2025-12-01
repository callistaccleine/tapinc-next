"use client";

import { QRCodeCanvas } from "qrcode.react";

type ProfileQRCodeProps = {
  profileId: string;
  displaySize?: number;
};

export default function ProfileQRCode({ profileId, displaySize = 220 }: ProfileQRCodeProps) {
  if (!profileId) return null;

  const profileUrl = `${window.location.origin}/user/${profileId}`;

  return (
    <div
      style={{
        width: displaySize,
        maxWidth: "100%",
        textAlign: "center",
      }}
    >
      <QRCodeCanvas
        value={profileUrl}
        size={512}
        bgColor="#ffffff"
        fgColor="#000000"
        level="H"
        includeMargin={true}
        style={{ width: "100%", height: "auto" }}
      />
    </div>
  );
}
