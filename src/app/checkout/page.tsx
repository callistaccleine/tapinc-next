"use client";

import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";

const stripePromise = loadStripe(process.env.STRIPE_SECRET_KEY!);

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const data = await res.json();
    return data.clientSecret;
  }, [orderId]);

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
