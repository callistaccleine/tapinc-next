"use client";

import Checkout from "@/components/Payment/Checkout";
import { Suspense } from "react";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading Checkout...</div>}>
      <Checkout />
    </Suspense>
  );
}
