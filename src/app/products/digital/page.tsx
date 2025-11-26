"use client";
import ProductDetails from "@/components/products/ProductDetails";
import Navbar from "@/components/hero/Navbar";

export default function DigitalCardPage() {
  return (
    <>
      <Navbar />
      <ProductDetails productId={2} />
    </>
  );
}
