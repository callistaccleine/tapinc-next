import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";



export const metadata = {
  title: "TapInk — Smart Digital Business Cards",
  description:
    "TapInk makes sharing your contact info seamless with NFC-powered digital cards.",
  icons: {
    icon: "/favicon.png", 
    shortcut: "/favicon.png",
    apple: "/favicon.png",
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
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="theme-color" content="#ff7a00" />
        <meta property="og:image" content="/images/features/Tapink-logo.png" />
        <meta property="og:title" content="TapINK — Smart Digital Business Cards" />
        <meta property="og:description" content="Create instant, meaningful connections with TapINK." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body
      >
        {children}
      </body>
    </html>
  );
}
