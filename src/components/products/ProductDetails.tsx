"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/context/CartContext";
import Notification from "@/components/Notification";
import styles from "@/styles/ProductDetails.module.css";

type Product = {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  price: string;                 
  price_id: string | null;       
  price_subs: string | null;     
  price_subscriptions: string | null; 
  print_styles: string[] | null;
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
  const [addons, setAddons] = useState<ProductAddon[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<Set<number>>(new Set());
  const [selectedPrint, setSelectedPrint] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);

  const { addItem } = useCart();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  // Load product
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", Number(productId))
        .single();

      if (error) console.error(error);
      else {
        setProduct(data);
        if (data.print_styles?.length > 0) {
          setSelectedPrint(data.print_styles[0]);
        }
      }
      setLoading(false);
    };
    load();
  }, [productId]);

  // Load addons
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
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

      const normalized =
        data
          ?.flatMap((row: { addon: ProductAddon[] | null }) => row.addon || [])
          .filter((addon): addon is ProductAddon => Boolean(addon)) ?? [];

      setAddons(normalized);
    };

    load();
  }, [productId]);

  // Check subscription
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setHasActiveSubscription(false);

      const { data } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      setHasActiveSubscription(Boolean(data));
    };

    check();
  }, []);

  const formatPrice = (value: string | number | null) => {
    if (!value) return null;
    const num = typeof value === "string" ? Number(value) : value;
    return num.toLocaleString("en-AU", {
      style: "currency",
      currency: "AUD",
    });
  };

  const toggleAddon = (id: number) => {
    setSelectedAddons((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  // Add to cart logic
  const handleAddToCart = () => {
    if (!product) return;

    const subActive = hasActiveSubscription === true;
    const stripePriceId = subActive ? product.price_subscriptions : product.price_id;
    const displayPrice = subActive ? product.price_subs : product.price;

    if (!stripePriceId) {
      setToast({ message: "Pricing unavailable.", type: "error" });
      return;
    }

    addItem({
      priceId: stripePriceId,
      name: product.title,
      description: selectedPrint ? `Printing style: ${selectedPrint}` : undefined,
      image: product.image,
      unitPrice: displayPrice,
      quantity,
      mode: subActive ? "subscription" : "payment",
    });

    addons.forEach((addon) => {
      if (selectedAddons.has(addon.id) && addon.price_id) {
        addItem({
          priceId: addon.price_id,
          name: addon.name,
          description: addon.description ?? undefined,
          unitPrice: addon.price,
          quantity: 1,
          mode: "addon",
        });
      }
    });

    setToast({ message: "Added to cart!", type: "success" });
  };

  if (loading) return <div className={styles.loading}>Loading product...</div>;
  if (!product) return <div className={styles.error}>Not found</div>;

  const faqs = [
    {
      question: "How long does shipping take?",
      answer: "Orders are processed within 2-3 business days and typically arrive within 5-7 business days.",
    },
    {
      question: "Can I customize my card design?",
      answer: "Yes, your TapInk card can be personalised with your logo, name, and colour scheme after purchase.",
    },
    {
      question: "Do you offer design services?",
      answer: "Yes, our design team can create a custom layout tailored to your brand. Contact us for pricing.",
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
        {/* LEFT */}
        <div className={styles.leftColumn}>
          <img
            src={product.image ?? "/images/placeholder.png"}
            className={styles.mainImage}
            alt={product.title}
          />
        </div>

        {/* RIGHT */}
        <div className={styles.rightColumn}>

          <Link href="/products" className={styles.backLink}>
            <ArrowLeft size={20} />
            Back to Products
          </Link>

          <h1 className={styles.title}>{product.title}</h1>

          {/* PREMIUM PRICING CARD */}
          <div className={styles.premiumPriceCard}>
            <div className={styles.priceRow}>

              {/* Standard price */}
              <p className={styles.standardPricePremium}>
                {formatPrice(product.price)}
              </p>

              {/* Subscriber price */}
              {product.price_subs && (
                <p className={styles.subscriberPricePremium}>
                  {formatPrice(product.price_subs)}
                  <span className={styles.subLabelPremium}>with subscription</span>

                  {/* Savings */}
                  <span className={styles.saveRibbon}>
                    Save {Math.round(
                      (1 - Number(product.price_subs) / Number(product.price)) * 100
                    )}%
                  </span>
                </p>
              )}
            </div>

            <div className={styles.premiumDivider}></div>

            <p className={styles.premiumFootnote}>
              Your subscriber discount will be applied automatically at checkout
              when your subscription is active.
            </p>
          </div>

          {/* Description */}
          {product.description && (
            <p className={styles.description}>{product.description}</p>
          )}

          {/* Printing Styles */}
          {(product.print_styles ?? []).length > 0 && (
            <div className={styles.optionSection}>
              <p className={styles.optionLabel}>Printing Style:</p>
              <div className={styles.optionButtons}>
                {product.print_styles?.map((style) => (
                  <button
                    key={style}
                    className={`${styles.optionBtn} ${
                      selectedPrint === style ? styles.optionActive : ""
                    }`}
                    onClick={() => setSelectedPrint(style)}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className={styles.quantityRow}>
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity((q) => q + 1)}>+</button>
          </div>

          {/* Addons */}
          {addons.length > 0 && (
            <div className={styles.addonSection}>
              <h3>Add-ons</h3>
              <ul className={styles.addonList}>
                {addons.map((addon) => (
                  <li key={addon.id} className={styles.addonItem}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedAddons.has(addon.id)}
                        onChange={() => toggleAddon(addon.id)}
                      />
                      <span className={styles.addonName}>{addon.name}</span>

                      {addon.price && (
                        <span className={styles.addonPrice}>
                          {formatPrice(addon.price)}
                        </span>
                      )}

                      {addon.description && (
                        <p className={styles.addonDescription}>
                          {addon.description}
                        </p>
                      )}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Add to cart */}
          <button className={styles.addToCart} onClick={handleAddToCart}>
            ADD TO CART
          </button>

          {/* FAQ */}
          <div className={styles.faqSection}>
            <h2>FAQ</h2>
            {faqs.map((faq, i) => (
              <div key={i} className={styles.faqItem}>
                <button onClick={() => setOpenFAQ(openFAQ === i ? null : i)}>
                  {faq.question}
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
  );
}
