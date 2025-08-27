"use client";

import Pricing from "@/components/Pricing";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer"

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
