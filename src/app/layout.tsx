import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TapInk — Smart Digital Business Cards",
  description:
    "TapInk makes sharing your contact info seamless with NFC-powered digital cards.",
  metadataBase: new URL("https://tapink.co"),
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "TapInk — Smart Digital Business Cards",
    description:
      "Create instant, meaningful connections with TapInk.",
    url: "https://tapink.co",
    siteName: "TapInk",
    images: [
      {
        url: "/images/Tapink-logo.png",
        width: 1024,
        height: 1024,
        alt: "TapInk logo",
      },
    ],
    type: "website",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#ff7a00" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body
      >
        {children}
      </body>
    </html>
  );
}
