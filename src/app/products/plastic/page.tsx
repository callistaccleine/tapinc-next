"use client";
import ProductDetails from "@/components/products/ProductDetails";
import Navbar from "@/components/hero/Navbar";

export default function PlasticCardPage() {
  return (
    <>
      <Navbar />
      <ProductDetails productId={1} />
    </>
  );
}
