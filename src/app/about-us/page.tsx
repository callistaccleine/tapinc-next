"use client";

import AboutUs from "@/components/AboutUs";
import Navbar from "@/components/hero/Navbar";
import Footer from "@/components/hero/Footer"

export default function AboutUsPage() {
  return (
    <>
      <Navbar />
      <main>
        <AboutUs />
      </main>
      <Footer />
    </>
  );
}
