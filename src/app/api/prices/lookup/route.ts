import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_LIVE_SECRET_KEY;
const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: "2025-08-27.basil" })
  : null;

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 }
    );
  }

  try {
    const { price_ids: priceIds } = await req.json();

    if (!Array.isArray(priceIds) || priceIds.length === 0) {
      return NextResponse.json(
        { error: "price_ids must be a non-empty array" },
        { status: 400 }
      );
    }

    const uniqueIds = Array.from(
      new Set(
        priceIds.filter((id) => typeof id === "string" && id.trim().length > 0)
      )
    );

    const prices = await Promise.all(
      uniqueIds.map(async (priceId) => {
        try {
          const price = await stripe.prices.retrieve(priceId);
          return {
            id: price.id,
            currency: price.currency || "unknown",
            unit_amount: price.unit_amount,
          };
        } catch (err) {
          console.error("Failed to retrieve price", priceId, err);
          return null;
        }
      })
    );

    const data = prices
      .filter(
        (
          price
        ): price is { id: string; currency: string; unit_amount: number | null } =>
          Boolean(price)
      )
      .reduce<Record<string, { currency: string | null; unit_amount: number | null }>>(
        (acc, price) => {
          if (price) {
            acc[price.id] = {
              currency: price.currency,
              unit_amount: price.unit_amount,
            };
          }
          return acc;
        },
        {}
      );

    return NextResponse.json({ prices: data });
  } catch (err) {
    console.error("Price lookup error", err);
    return NextResponse.json({ error: "Failed to load prices" }, { status: 500 });
  }
}
