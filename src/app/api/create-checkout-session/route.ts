import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_LIVE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN ?? "http://localhost:3000";

export async function POST(req: Request) {
  const body = await req.json();

  try {
    const priceId = body.price_id;
    if (!priceId) {
      return NextResponse.json(
        { error: "Missing Stripe price_id." },
        { status: 400 }
      );
    }

    const quantity = Number(body.quantity) || 1;

    const metadata: Record<string, string> = {};
    if (body.plan_id) metadata.plan_id = String(body.plan_id);
    if (body.plan_category) metadata.plan_category = String(body.plan_category);
    if (body.plan_name) metadata.plan_name = String(body.plan_name);
    if (body.user_id) metadata.user_id = String(body.user_id);

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
      metadata: Object.keys(metadata).length ? metadata : undefined,
      return_url: `${DOMAIN}/orders/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Stripe error";
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
