"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CartMode = "payment" | "subscription" | "addon";

export type CartItem = {
  uid: string;
  priceId: string;
  name: string;
  description?: string;
  image?: string | null;
  unitPrice?: string | number | null;
  quantity: number;
  mode: CartMode;
};

type AddItemInput = {
  priceId: string;
  name: string;
  description?: string;
  image?: string | null;
  unitPrice?: string | number | null;
  quantity?: number;
  mode: CartMode;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  addItem: (item: AddItemInput) => void;
  removeItem: (uid: string) => void;
  clearCart: () => void;
  updateQuantity: (uid: string, quantity: number) => void;
  checkout: () => Promise<void>;
  pending: boolean;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "tapink_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to parse cart", err);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error("Failed to persist cart", err);
    }
  }, [items]);

  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const addItem = ({ priceId, name, description, image, unitPrice, quantity = 1, mode }: AddItemInput) => {
    if (!priceId) return;
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.priceId === priceId &&
          item.mode === mode &&
          item.description === description
      );

      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      }

      return [
        ...prev,
        {
          uid: crypto.randomUUID(),
          priceId,
          name,
          description,
          image: image ?? null,
          unitPrice: unitPrice ?? null,
          quantity,
          mode,
        },
      ];
    });
  };

  const removeItem = (uid: string) => {
    setItems((prev) => prev.filter((item) => item.uid !== uid));
  };

  const clearCart = () => setItems([]);

  const updateQuantity = (uid: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((item) => (item.uid === uid ? { ...item, quantity } : item))
    );
  };

  const checkout = async () => {
    if (!items.length) return;
    const modes = Array.from(new Set(items.map((item) => item.mode)));

    if (modes.length > 1) {
      alert(
        "Please checkout subscription plans separately from physical products."
      );
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line_items: items.map((item) => ({
            price_id: item.priceId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start checkout session");
      }

      if (data.clientSecret) {
        router.push(
          `/checkout?client_secret=${encodeURIComponent(data.clientSecret)}`
        );
      } else {
        throw new Error("Missing checkout client secret");
      }
    } catch (err: any) {
      console.error("Cart checkout error", err);
      alert(err.message || "Unable to start checkout. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const value: CartContextValue = {
    items,
    count,
    addItem,
    removeItem,
    clearCart,
    updateQuantity,
    checkout,
    pending,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
};
