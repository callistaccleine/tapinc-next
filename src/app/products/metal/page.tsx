"use client";
import ProductDetails from "@/components/products/ProductDetails";
import Navbar from "@/components/hero/Navbar";

export default function MetalCardPage() {
  return (
    <>
      <Navbar />
      <ProductDetails productId={3} />
    </>
  );
}
