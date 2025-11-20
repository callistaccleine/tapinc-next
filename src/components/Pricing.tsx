"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import styles from "../styles/Pricing.module.css";
import ContactForm from "./ContactForm";
import { useCart } from "@/context/CartContext";
import Notification from "./Notification";

type Plan = {
  id: string | number;
  category: string;
  name: string;
  desc: string;
  price: number | null;
  period: string;
  features: string[];
  popular: boolean;
  action: "contact" | "link" | "products" | "checkout" | null;
  cta_label?: string;
  cta_url?: string;
  product_id?: string;
  price_id?: string;
  sort_order?: number;
  is_active?: boolean;
};

export default function Pricing() {
  const router = useRouter();
  const { addItem } = useCart();
  const [activeCategory, setActiveCategory] = useState<
    "free" | "individual" | "teams" | "enterprise" | "event"
  >("free");
  const [showContact, setShowContact] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleOpenContact = () => setShowContact(true);
  const handleCloseContact = () => setShowContact(false);

  // Load plans
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const { data, error } = await supabase
          .from("plans")
          .select(
            `
            id, category, name, desc, price, period, features,
            popular, action, cta_label, cta_url,
            product_id, price_id, sort_order, is_active
          `
          );

        if (error) throw error;
        setPlans((data as Plan[]) ?? []);
      } catch (e: any) {
        console.error(e);
        setErr(e.message || "Failed to load plans");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const norm = (s: string | null | undefined) =>
    String(s || "").trim().toLowerCase();

  const visiblePlans = useMemo(() => {
    return (plans ?? [])
      .filter(
        (p) => norm(p.category) === norm(activeCategory) && (p.is_active ?? true)
      )
      .sort(
        (a, b) =>
          Number(b.popular) - Number(a.popular) ||
          (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
          Number(a.id) - Number(b.id)
      );
  }, [plans, activeCategory]);

  const renderedPlans = useMemo(() => {
    return visiblePlans.map((p) => {
      const priceValue = p.price == null ? null : Number(p.price);
      const priceText =
        priceValue == null ? "Custom Quote" : `$${priceValue.toFixed(2)}`;
      const ctaText =
        p.cta_label || (p.action === "contact" ? "Contact Us" : "Get Started");

        const buttonAction = async () => {
          try {
            // check if user is logged in
            const {
              data: { user },
            } = await supabase.auth.getUser();
        
            // ✅ handle Free Plan separately
            if (norm(p.category) === "free") {
              if (!user) {
                router.push("/auth"); // redirect to login/signup
              } else {
                router.push("/dashboard"); // already logged in
              }
              return;
            }
        
            // if not logged in, block other actions
            if (!user) {
              router.push("/signup");
              return;
            }
        
            // handle plan actions
            if (p.action === "contact") return setShowContact(true);
        
            if (p.action === "link" && p.cta_url)
              return window.open(p.cta_url, "_blank", "noopener,noreferrer");
        
            // redirect to products
            if (p.action === "products") {
              router.push("/products");
              return;
            }
        
            // checkout flow
            if (p.action === "checkout" && p.price_id) {
              const res = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  price_id: p.price_id,
                  quantity: 1,
                  plan_id: p.id,
                  plan_category: p.category,
                  plan_name: p.name,
                  user_id: user.id,
                }),
              });
        
              const data = await res.json();
        
              if (!res.ok)
                throw new Error(data.error || "Failed to create checkout session");
        
              if (data.clientSecret) {
                router.push(
                  `/checkout?client_secret=${encodeURIComponent(data.clientSecret)}`
                );
              } else if (data.url) {
                window.location.href = data.url;
              } else {
                throw new Error("No checkout URL or client secret received");
              }
            } else if (!p.price_id) {
              console.warn("No price_id found for plan:", p.name);
              alert("This plan is not available for checkout. Please contact us.");
            }
          } catch (err: any) {
            console.error("Error in buttonAction:", err);
            alert(`Error: ${err.message}`);
          }
        };        

      return {
        id: p.id,
        name: p.name,
        desc: p.desc,
        priceText,
        priceValue,
        period: p.period,
        features: p.features || [],
        popular: p.popular,
        ctaText,
        buttonAction,
        priceId: p.price_id,
        action: p.action,
      };
    });
  }, [visiblePlans, router]);

  const handleAddPlanToCart = (plan: { id: string | number; name: string; desc: string; priceId?: string | null; priceValue?: number | null }) => {
    if (!plan.priceId) {
      setToast({ message: "This plan cannot be added right now.", type: "error" });
      return;
    }

    addItem({
      priceId: plan.priceId,
      name: plan.name,
      description: plan.desc,
      unitPrice: plan.priceValue ?? null,
      mode: "subscription",
      quantity: 1,
    });

    setToast({ message: `${plan.name} added to cart`, type: "success" });
  };

  return (
    <div className={styles.pricingContainer}>
      {toast && (
        <Notification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className={styles.pricingHeader}>
        <h1>Start free, upgrade as your grow</h1>
        <p>Experience the power of digital with no upfront cost, Start with our free plan and unlock advanced.</p>

        <div className={styles.pricingToggle}>
          {["free", "individual", "teams", "enterprise", "event"].map((cat) => (
            <button
              key={cat}
              className={`${styles.toggleButton} ${
                activeCategory === cat ? styles.toggleButtonActive : ""
              }`}
              onClick={() =>
                setActiveCategory(
                  cat as
                    | "free"
                    | "individual"
                    | "teams"
                    | "enterprise"
                    | "event"
                )
              }
              type="button"
            >
              {cat[0].toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading && <div>Loading plans...</div>}
      {err && <div style={{ color: "red" }}>Error: {err}</div>}

      <div className={styles.pricingGrid}>
        {renderedPlans.map((plan) => (
          <div
            key={plan.id}
            className={`${styles.pricingCard} ${
              plan.popular ? styles.popular : ""
            }`}
          >
            {plan.popular && (
              <div className={styles.popularBadge}>Most Popular</div>
            )}

            <div className={styles.planHeader}>
              <h3>{plan.name}</h3>
              <div className={styles.price}>
                <span className={styles.amount}>{plan.priceText}</span>
                <span className={styles.period}>/{plan.period}</span>
              </div>
            </div>

            <div className={styles.desc}>
              <span className={styles.descText}>{plan.desc}</span>
            </div>

            <ul className={styles.featuresList}>
              {plan.features.map((feature, i) => (
                <li key={i}>
                  <span className={styles.checkmark}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={styles.pricingButton}
              onClick={plan.buttonAction}
              type="button"
            >
              {plan.ctaText}
            </button>
            {plan.priceId && plan.action === "checkout" && (
              <button
                className={styles.addToCartButton}
                type="button"
                onClick={() =>
                  handleAddPlanToCart({
                    id: plan.id,
                    name: plan.name,
                    desc: plan.desc,
                    priceId: plan.priceId,
                    priceValue: plan.priceValue ?? null,
                  })
                }
              >
                Add to cart
              </button>
            )}
          </div>
        ))}
      </div>

      <div className={styles.pricingFooter}>
        <div>Need more information?</div>
        <button
          className={styles.linkButton}
          onClick={() => setShowContact(true)}
          type="button"
        >
          Contact us
        </button>
      </div>

      {/* Contact Form Modal */}
      {showContact && (
        <div className={styles.contactModal}>
          <ContactForm isModal={showContact} onClose={handleCloseContact} />
        </div>
      )}
    </div>
  );
}
