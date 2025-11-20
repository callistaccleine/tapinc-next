"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/context/CartContext";
import Notification from "@/components/Notification";
import styles from "@/styles/ProductDetails.module.css";

type SubscriptionPricing = {
  monthly?: string | number | null;
  monthly_price?: string | number | null;
  monthly_price_id?: string | null;
  yearly?: string | number | null;
  yearly_price?: string | number | null;
  yearly_price_id?: string | null;
};

type PriceOption = {
  key: "standard" | "monthly" | "yearly";
  label: string;
  value: string | number | null;
  priceId?: string | null;
};

type Product = {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  price: string;
  price_id: string | null;
  print_styles: string[] | null;
  price_subscriptions?: SubscriptionPricing | string | null;
};

type ProductAddon = {
  id: number;
  name: string;
  description?: string | null;
  price?: string | number | null;
  price_id: string | null;
};

type ProductDetailsProps = {
  productId: number;
};

export default function ProductDetails({ productId }: ProductDetailsProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedPrint, setSelectedPrint] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addons, setAddons] = useState<ProductAddon[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<Set<number>>(new Set());
  const { addItem } = useCart();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [priceMode, setPriceMode] = useState<"standard" | "monthly" | "yearly">("standard");

  // FAQ State (open/close)
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  // Fetch product data
  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", Number(productId))
        .single();

      if (error) {
        console.error("Error fetching product:", error.message || error);
      } else {
        let normalizedSubscriptions = data.price_subscriptions;
        if (typeof normalizedSubscriptions === "string") {
          try {
            normalizedSubscriptions = JSON.parse(normalizedSubscriptions);
          } catch {
            normalizedSubscriptions = null;
          }
        }

        setProduct({
          ...data,
          price_subscriptions: normalizedSubscriptions,
        });
        if (data.print_styles && data.print_styles.length > 0) {
          setSelectedPrint(data.print_styles[0]);
        }
      }
      setLoading(false);
    }

    fetchProduct();
  }, [productId]);

  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const { data, error } = await supabase
          .from("product_addons")
          .select(
            `
            addon:addon_id (
              id,
              name,
              description,
              price,
              price_id
            )
          `
          )
          .eq("product_id", Number(productId));

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching product add-ons:", error);
          return;
        }

        const normalized =
          data
            ?.flatMap((row: { addon: ProductAddon[] | null }) => row.addon || [])
            .filter((addon): addon is ProductAddon => Boolean(addon)) ?? [];
        setAddons(normalized);
      } catch (err) {
        console.error("Unexpected error loading add-ons:", err);
      }
    };

    fetchAddons();
  }, [productId]);

  const formatPrice = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number" && Number.isFinite(value)) {
      return value.toLocaleString("en-AU", {
        style: "currency",
        currency: "AUD",
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      });
    }
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed.toLocaleString("en-AU", {
        style: "currency",
        currency: "AUD",
        minimumFractionDigits: parsed % 1 === 0 ? 0 : 2,
      });
    }
    const stringValue = String(value).trim();
    return stringValue.startsWith("$") ? stringValue : `$${stringValue}`;
  };

  const toggleAddon = (addonId: number) => {
    setSelectedAddons((prev) => {
      const next = new Set(prev);
      if (next.has(addonId)) next.delete(addonId);
      else next.add(addonId);
      return next;
    });
  };

  const priceOptions = useMemo<PriceOption[]>(() => {
    if (!product) return [];
    const options: PriceOption[] = [
      {
        key: "standard",
        label: "One-time",
        value: product.price,
        priceId: product.price_id,
      },
    ];

    const monthlyPrice =
      (typeof product.price_subscriptions === "object" && product.price_subscriptions?.monthly) ??
      (typeof product.price_subscriptions === "object" && product.price_subscriptions?.monthly_price) ??
      null;
    const monthlyPriceId = 
      typeof product.price_subscriptions === "object" 
        ? product.price_subscriptions?.monthly_price_id 
        : null;
    if (monthlyPrice) {
      options.push({
        key: "monthly",
        label: "Monthly",
        value: monthlyPrice,
        priceId: monthlyPriceId,
      });
    }

    const yearlyPrice =
      (typeof product.price_subscriptions === "object" && product.price_subscriptions?.yearly) ??
      (typeof product.price_subscriptions === "object" && product.price_subscriptions?.yearly_price) ??
      null;
    const yearlyPriceId = 
      typeof product.price_subscriptions === "object" 
        ? product.price_subscriptions?.yearly_price_id 
        : null;
    if (yearlyPrice) {
      options.push({
        key: "yearly",
        label: "Yearly",
        value: yearlyPrice,
        priceId: yearlyPriceId,
      });
    }

    return options;
  }, [product]);

  useEffect(() => {
    if (!priceOptions.length) {
      setPriceMode("standard");
      return;
    }

    if (!priceOptions.find((opt) => opt.key === priceMode)) {
      setPriceMode(priceOptions[0].key);
    }
  }, [priceOptions, priceMode]);

  // Checkout Handler
  const handleAddToCart = () => {
    const selectedOption =
      priceOptions.find((opt) => opt.key === priceMode) ?? priceOptions[0];

    if (!selectedOption?.priceId) {
      setToast({ message: "Unable to add this pricing option right now.", type: "error" });
      return;
    }

    addItem({
      priceId: selectedOption.priceId,
      name: product?.title ?? "Unknown Product",
      description: selectedPrint ? `Printing style: ${selectedPrint}` : undefined,
      image: product?.image ?? null,
      unitPrice: selectedOption.value,
      quantity,
      mode: priceMode === "standard" ? "payment" : "subscription",
    });

    addons.forEach((addon) => {
      if (selectedAddons.has(addon.id) && addon.price_id) {
        addItem({
          priceId: addon.price_id,
          name: addon.name,
          description: addon.description ?? undefined,
          unitPrice: addon.price ?? null,
          quantity: 1,
          mode: "payment",
        });
      }
    });

    setToast({ message: "Added to cart", type: "success" });
  };

  if (loading) return <div className={styles.loading}>Loading product...</div>;
  if (!product) return <div className={styles.error}>Product not found.</div>;

  //FAQs
  const faqs = [
    {
      question: "How long does shipping take?",
      answer: "Orders are processed within 2-3 business days and typically arrive in 5-7 business days depending on your region.",
    },
    {
      question: "Can I customize my TapInk card design?",
      answer: "Yes! Each TapInk card can be customized with your logo, name, and color scheme directly from your dashboard after purchase.",
    },
    {
      question: "Can you help me design my card?",
      answer: "Yes, we offer professional card design services to help bring your brand to life. From clean minimal layouts to fully custom concepts, we tailor every design to your style. Contact us to discuss your vision, and we'll provide options and pricing based on the level of detail you're after.",
    },
  ];

  return (
    <div className={styles.productPage}>
      {toast && (
        <Notification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className={styles.container}>
        {/* LEFT SIDE — Image */}
        <div className={styles.leftColumn}>
          <div className={styles.mainImageWrapper}>
            <img
              src={product.image ?? "/images/placeholder.png"}
              alt={product.title}
              className={styles.mainImage}
            />
          </div>
        </div>

        {/* RIGHT SIDE — Info */}
        <div className={styles.rightColumn}>
          <Link href="/products" className={styles.backLink}>
            <ArrowLeft size={20} strokeWidth={2.5} />
            <span>Back to Products</span>
          </Link>

          <h1 className={styles.title}>{product.title}</h1>
          <div className={styles.priceBlock}>
            <div className={styles.priceToggle}>
              {priceOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`${styles.priceToggleBtn} ${
                    priceMode === option.key ? styles.priceToggleActive : ""
                  }`}
                  onClick={() => setPriceMode(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className={styles.price}>
              {formatPrice(
                priceOptions.find((opt) => opt.key === priceMode)?.value ??
                  product.price
              ) ?? "—"}
            </p>
            {priceMode !== "standard" &&
              priceOptions.some((opt) => opt.key === priceMode) && (
                <p className={styles.subscriptionCallout}>
                  {priceMode === "monthly"
                    ? "Monthly subscription pricing."
                    : "Yearly subscription pricing."}{" "}
                  <Link href="/pricing">See plans</Link>
                </p>
              )}
          </div>

          {product.description && (
            <p className={styles.description}>{product.description}</p>
          )}

          {/* Printing Styles */}
          {product.print_styles && product.print_styles.length > 0 && (
            <div className={styles.optionSection}>
              <p className={styles.optionLabel}>Printing Style:</p>
              <div className={styles.optionButtons}>
                {product.print_styles.map((styleName) => (
                  <button
                    key={styleName}
                    className={`${styles.optionBtn} ${
                      selectedPrint === styleName ? styles.optionActive : ""
                    }`}
                    onClick={() => setSelectedPrint(styleName)}
                  >
                    {styleName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className={styles.quantityRow}>
            <button
              className={styles.qtyBtn}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              -
            </button>
            <span className={styles.qtyValue}>{quantity}</span>
            <button
              className={styles.qtyBtn}
              onClick={() => setQuantity((q) => q + 1)}
            >
              +
            </button>
          </div>

          {addons.length > 0 && (
            <div className={styles.addonSection}>
              <h3>Add-ons</h3>
              <p className={styles.addonIntro}>
                Enhance your setup with optional add-ons. Each item is billed separately at checkout.
              </p>
              <ul className={styles.addonList}>
                {addons.map((addon) => (
                  <li key={addon.id} className={styles.addonItem}>
                    <label className={styles.addonLabel}>
                      <input
                        type="checkbox"
                        checked={selectedAddons.has(addon.id)}
                        onChange={() => toggleAddon(addon.id)}
                        disabled={!addon.price_id}
                      />
                      <div>
                        <div className={styles.addonHeader}>
                          <span className={styles.addonName}>{addon.name}</span>
                          {addon.price && addon.price_id && (
                            <span className={styles.addonPrice}>
                              {formatPrice(addon.price)}
                            </span>
                          )}
                        </div>
                        {addon.description && (
                          <p className={styles.addonDescription}>
                            {addon.description}
                          </p>
                        )}
                        {!addon.price_id && (
                          <p className={styles.addonDescription}>
                            This add-on is unavailable right now.
                          </p>
                        )}
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Add to Cart */}
          <button
            className={styles.addToCart}
            onClick={handleAddToCart}
          >
            ADD TO CART
          </button>

          {/* <p className={styles.shippingNote}>Ships within 3–5 business days.</p> */}

          {/* SHIPPING & FAQ Section */}
          <div className={styles.faqSection}>
            <h2 className={styles.faqTitle}>Details</h2>
            <div className={styles.faqList}>
              {faqs.map((faq, i) => (
                <div key={i} className={styles.faqItem}>
                  <button
                    className={styles.faqQuestion}
                    onClick={() =>
                      setOpenFAQ(openFAQ === i ? null : i)
                    }
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`${styles.chevron} ${
                        openFAQ === i ? styles.rotate : ""
                      }`}
                      size={18}
                    />
                  </button>
                  {openFAQ === i && (
                    <p className={styles.faqAnswer}>{faq.answer}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
