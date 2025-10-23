"use client";

import Navbar from "@/components/hero/Navbar";
import Products from "@/components/products/Products";
import Footer from "@/components/hero/Footer";

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
