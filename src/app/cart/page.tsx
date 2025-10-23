"use client";

import { useCart } from "@/context/CartContext";
import styles from "@/styles/Cart.module.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, checkout, pending } = useCart();
  const router = useRouter();
  const [priceMap, setPriceMap] = useState<
    Record<string, { unit_amount: number | null; currency: string | null }>
  >({});
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    const priceIds = Array.from(new Set(items.map((item) => item.priceId).filter(Boolean)));
    if (!priceIds.length) {
      setPriceMap({});
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/prices/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ price_ids: priceIds }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load prices");
        if (!cancelled) {
          setPriceMap(data.prices || {});
        }
      } catch (err) {
        console.error("Failed to load cart prices", err);
        if (!cancelled) setPriceMap({});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items]);

  const formatPrice = (
    info?: { unit_amount: number | null; currency: string | null },
    quantity = 1
  ) => {
    if (!info || typeof info.unit_amount !== "number") return "—";
    const value = (info.unit_amount * quantity) / 100;
    const currency = info.currency ? info.currency.toUpperCase() : "AUD";
    return value.toLocaleString("en-AU", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    });
  };

  const { subtotalCents, subtotalCurrency } = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const info = priceMap[item.priceId];
        if (!info || typeof info.unit_amount !== "number") return acc;
        acc.subtotalCents += info.unit_amount * item.quantity;
        if (!acc.subtotalCurrency && info.currency) {
          acc.subtotalCurrency = info.currency;
        }
        return acc;
      },
      { subtotalCents: 0, subtotalCurrency: "aud" as string | null }
    );
  }, [items, priceMap]);

  if (navigating) {
    return <LoadingSpinner label="Returning to products…" />;
  }

  return (
    <div className={styles.cartPage}>
      <div className={styles.cartTopActions}>
        <button
          type="button"
          className={styles.closeBtn}
          aria-label="Close cart"
          onClick={() => {
            setNavigating(true);
            router.push("/products");
          }}
        >
          ×
        </button>
      </div>
      <div className={styles.cartHeader}>
        <h1>Your cart</h1>
        {items.length > 0 && (
          <button type="button" onClick={clearCart} className={styles.clearBtn}>
            Clear cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Your cart is empty.</p>
          <div className={styles.emptyLinks}>
            <Link href="/products">Browse products</Link>
            <Link href="/pricing">Explore plans</Link>
          </div>
        </div>
      ) : (
        <div className={styles.cartBody}>
          <ul className={styles.itemList}>
            {items.map((item) => {
              const priceInfo = priceMap[item.priceId];
              return (
                <li key={item.uid} className={styles.itemRow}>
                <div className={styles.itemInfo}>
                  {item.image && (
                    <div className={styles.itemImage}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt={item.name} />
                    </div>
                  )}
                  <div>
                    <h3>{item.name}</h3>
                    {item.description && <p>{item.description}</p>}
                    <span className={styles.badge}>
                      {item.mode === "subscription"
                        ? "Subscription"
                        : item.mode === "addon"
                        ? "Add-on"
                        : "Product"}
                    </span>
                  </div>
                </div>
                <div className={styles.itemControls}>
                  <div className={styles.itemPrice}>
                    {formatPrice(priceInfo)}
                  </div>
                  <div className={styles.qtyControls}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.uid, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.uid, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.uid)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );})}
          </ul>

          <div className={styles.cartSummary}>
            <div>
              <span>Subtotal</span>
              <strong>
                {formatPrice(
                  {
                    unit_amount: subtotalCents,
                    currency: subtotalCurrency,
                  },
                  1
                )}
              </strong>
            </div>
            <button
              type="button"
              className={styles.checkoutBtn}
              onClick={checkout}
              disabled={pending}
            >
              {pending ? "Processing…" : "Checkout"}
            </button>
          </div>
        </div>
      )}
      </div>
  );
}
