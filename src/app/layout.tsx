import { Metadata } from "next/types";

export const metadata: Metadata = {
  title: "TapInk - Smart Digital Business Cards",
  description:
    "TapInk makes sharing your contact info seamless with NFC-powered digital cards.",
  metadataBase: new URL("https://tapink.com.au"),
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "TapInk — Smart Digital Business Cards",
    description:
      "Create instant, meaningful connections with TapInk.",
    url: "https://tapink.com.au",
    siteName: "TapInk",
    images: [
      {
        url: "/images/Tapink-opengraph.png", 
        width: 1200,
        height: 630,
        alt: "TapInk - Smart Digital Business Cards",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TapInk - Smart Digital Business Cards",
    description:
      "Create instant, meaningful connections with TapInk digital business cards.",
    images: ["/images/Tapink-opengraph.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}