import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_LIVE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN ?? "http://localhost:3000";

export async function POST(req: Request) {
  const body = await req.json();

  try {
    // If your price is recurring, use subscription mode, otherwise use payment
    const priceId = body.price_id;
    const quantity = body.quantity || 1;

    // Fetch price details to decide mode
    const price = await stripe.prices.retrieve(priceId);

    const isRecurring = !!price.recurring;
    const mode = isRecurring ? "subscription" : "payment";

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      mode,
      line_items: [
        {
          price: priceId,
          quantity,
        },
      ],
      return_url: `${DOMAIN}/orders/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
