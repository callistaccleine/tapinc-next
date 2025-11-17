import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_LIVE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: Request) {
  try {
    const { session_id: sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing Stripe session_id." },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product"],
    });

    const metadata = session.metadata ?? {};
    const planId = metadata.plan_id;
    const userId = metadata.user_id;

    let subscriptionUpdated = false;
    let planName: string | null = null;
    let planCategory: string | null = null;
    let orderId: string | null = null;

    if (planId && userId && session.status === "complete") {
      const { data: plan, error: planError } = await supabaseAdmin
        .from("plans")
        .select("id, name, category")
        .eq("id", planId)
        .single();

      if (planError) {
        console.error("Failed to locate plan:", planError);
      } else {
        planName = plan?.name ?? null;
        planCategory = plan?.category ?? null;

        const { data: existingSub, error: existingSubError } = await supabaseAdmin
          .from("subscriptions")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingSubError) {
          console.error("Failed checking existing subscription:", existingSubError);
        }

        if (existingSub?.id) {
          const { error: updateError } = await supabaseAdmin
            .from("subscriptions")
            .update({
              plan_id: planId,
              status: "active",
            })
            .eq("id", existingSub.id);

          if (updateError) {
            console.error("Failed to update subscription:", updateError);
          } else {
            subscriptionUpdated = true;
          }
        } else {
          const { error: insertError } = await supabaseAdmin
            .from("subscriptions")
            .insert({
              user_id: userId,
              plan_id: planId,
              status: "active",
            });

          if (insertError) {
            console.error("Failed to create subscription:", insertError);
          } else {
            subscriptionUpdated = true;
          }
        }

        if (subscriptionUpdated) {
          const { error: profilesError } = await supabaseAdmin
            .from("profiles")
            .update({ plan_id: planId })
            .eq("user_id", userId);

          if (profilesError) {
            console.error("Failed to sync profiles with plan:", profilesError);
          }
        }
      }
    }

    if (userId) {
      const orderNumber = session.id;
      const paymentStatus = session.payment_status ?? "paid";
      const fulfillmentStatus =
        session.status === "complete" ? "processing" : session.status ?? "pending";
      const customerName = session.customer_details?.name ?? null;
      const customerEmail = session.customer_details?.email ?? null;
      const shippingAddress = session.customer_details?.address
        ? JSON.stringify(session.customer_details.address)
        : null;
      const { data: existingOrder, error: existingOrderError } =
        await supabaseAdmin
          .from("orders")
          .select("id")
          .eq("order_number", orderNumber)
          .maybeSingle();

      if (existingOrderError) {
        console.error("Failed checking existing order:", existingOrderError);
      }

      if (existingOrder?.id) {
        orderId = existingOrder.id;
      } else {
        const { data: newOrder, error: orderInsertError } = await supabaseAdmin
          .from("orders")
          .insert({
            user_id: userId,
            order_number: orderNumber,
            status: fulfillmentStatus,
            payment_status: paymentStatus,
            customer_name: customerName,
            customer_email: customerEmail,
            shipping_address: shippingAddress,
          })
          .select("id")
          .single();

        if (orderInsertError) {
          console.error("Failed to log subscription order:", orderInsertError);
        } else {
          orderId = newOrder?.id ?? null;
        }
      }
    }

    if (orderId && planName) {
      const { data: existingItems, error: existingItemsError } =
        await supabaseAdmin
          .from("order_items")
          .select("id")
          .eq("order_id", orderId)
          .limit(1);

      if (existingItemsError) {
        console.error("Failed checking order items:", existingItemsError);
      }

      if (!existingItems?.length) {
        const amount = session.amount_total ? session.amount_total / 100 : 0;
        const { error: itemInsertError } = await supabaseAdmin
          .from("order_items")
          .insert({
            order_id: orderId,
            product_name: planName,
            product_image: "",
            quantity: 1,
            price: amount,
          });

        if (itemInsertError) {
          console.error("Failed to log subscription order item:", itemInsertError);
        }
      }
    }

    return NextResponse.json({
      status: session.status,
      customerEmail: session.customer_details?.email ?? null,
      subscriptionUpdated,
      planName,
      planCategory,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to process checkout session";
    console.error("process-checkout-session failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
