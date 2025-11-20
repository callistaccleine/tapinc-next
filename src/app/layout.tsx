import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "TapInk — Smart Digital Business Cards",
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
        url: "https://tapink.com.au/images/Tapink-opengraph.png", 
        width: 1200,
        height: 630,
        alt: "TapInk logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TapInk — Smart Digital Business Cards",
    description:
      "Create instant, meaningful connections with TapInk digital business cards.",
    images: ["https://tapink.com.au/images/Tapink-opengraph.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#ff7a00" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:image" content="https://tapink.com.au/images/Tapink-opengraph.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="fb:app_id" content="1234567890" />
      </head>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
