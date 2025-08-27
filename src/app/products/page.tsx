"use client";

import Navbar from "@/components/Navbar";
import Products from "@/components/Products";
import Footer from "@/components/Footer";

export default function ProductPage() {
  return (
    <>
      <Navbar />
      <main>
        <Products />
      </main>
      <Footer />
    </>
  );
}
