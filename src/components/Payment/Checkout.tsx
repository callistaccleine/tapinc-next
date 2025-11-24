"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Checkout() {
  const searchParams = useSearchParams();
  const clientSecret = searchParams.get("client_secret");

  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
    if (!key) {
      console.error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
      return;
    }
  
    setStripePromise(loadStripe(key));
  }, []);

  if (!clientSecret) {
    return <LoadingSpinner label="Preparing checkout..." />;
  }

  if (!stripePromise) {
    return <LoadingSpinner label="Loading Stripe..." />;
  }

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ clientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
