"use client";

import Pricing from "@/components/Pricing";
import Navbar from "@/components/hero/Navbar";
import Footer from "@/components/hero/Footer"

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
