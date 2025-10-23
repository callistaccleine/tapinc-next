"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/ProductDetails.module.css";

type Product = {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  price: string;
  price_id: string | null;
  print_styles: string[] | null;
};

type ProductDetailsProps = {
  productId: number;
};

export default function ProductDetails({ productId }: ProductDetailsProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedPrint, setSelectedPrint] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

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
        setProduct(data);
        if (data.print_styles && data.print_styles.length > 0) {
          setSelectedPrint(data.print_styles[0]);
        }
      }
      setLoading(false);
    }

    fetchProduct();
  }, [productId]);

  // Checkout Handler
  const handleCheckout = async () => {
    if (!product?.price_id) {
      alert("No Stripe price ID found for this product.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price_id: product.price_id,
          quantity,
        }),
      });

      const data = await res.json();

      if (data.clientSecret) {
        router.push(`/checkout?client_secret=${data.clientSecret}`);
      } else {
        alert("Checkout failed. Please try again.");
        console.error(data.error);
      }
    } catch (err) {
      console.error("Error during checkout:", err);
      alert("Something went wrong. Please try again later.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading product...</div>;
  if (!product) return <div className={styles.error}>Product not found.</div>;

  // Example FAQs
  const faqs = [
    {
      question: "How long does shipping take?",
      answer: "Orders are processed within 2–3 business days and typically arrive in 5-7 business days depending on your region.",
    },
    {
      question: "Can I customize my TapInk card design?",
      answer: "Yes! Each TapInk card can be customized with your logo, name, and color scheme directly from your dashboard after purchase.",
    },
  ];

  return (
    <div className={styles.productPage}>
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
          <p className={styles.price}>${product.price}</p>

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
              disabled={isProcessing}
            >
              −
            </button>
            <span className={styles.qtyValue}>{quantity}</span>
            <button
              className={styles.qtyBtn}
              onClick={() => setQuantity((q) => q + 1)}
              disabled={isProcessing}
            >
              +
            </button>
          </div>

          {/* Add to Cart */}
          <button
            className={styles.addToCart}
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "ADD TO CART"}
          </button>

          <p className={styles.shippingNote}>Ships within 3–5 business days.</p>

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
