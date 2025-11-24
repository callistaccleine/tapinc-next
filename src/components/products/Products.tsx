/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/Products.module.css";
import LoadingSpinner from "@/components/LoadingSpinner";

type ProductRow = {
  id: number;
  title: string;
  price: number | string;
  badge?: string | null;
  image?: string | null;
  created_at?: string | null;
};

import Link from "next/link";

const productStories: Record<
  number,
  { tagline: string; description: string }
> = {
  1: {
    tagline: "Everyday, elevated",
    description:
      "Matte textures, softened edges, and a finish that dissolves into any setting.",
  },
  2: {
    tagline: "Purely digital",
    description:
      "An ethereal experience for teams that live online. Frictionless, luminous, effortless.",
  },
  3: {
    tagline: "Precision in metal",
    description:
      "Cold-forged sheen with sculpted accents made to be admired up close.",
  },
};

const getProductRoute = (id: number) => {
  switch (id) {
    case 1:
      return "/products/plastic";
    case 2:
      return "/products/digital";
    case 3:
      return "/products/metal";
    default:
      return `/products/${id}`;
  }
};

type CuratedProduct = ProductRow & {
  story: { tagline: string; description: string };
  displayImage?: string | null;
};

function ProductsCard({ product }: { product: CuratedProduct }) {
  return (
    <Link href={getProductRoute(product.id)} className={styles.cardLink}>
      <article className={styles.card}>
        <div className={styles.cardImageFrame}>
          <img
            src={product.displayImage || product.image || "/images/placeholder.png"}
            alt={product.title}
            className={styles.cardImage}
            loading="lazy"
          />
          {product.badge && (
            <span className={styles.cardBadge}>{product.badge}</span>
          )}
        </div>
        <div className={styles.cardContent}>
          <p className={styles.cardTagline}>{product.story.tagline}</p>
          <h3 className={styles.cardTitle}>{product.title}</h3>
          <p className={styles.cardDescription}>{product.story.description}</p>
          <div className={styles.cardFooter}>
            <span className={styles.cardAction}>
              Discover collection
              <svg
                viewBox="0 0 24 24"
                role="presentation"
                aria-hidden="true"
                className={styles.cardActionIcon}
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className={styles.cardWhisper}>
              Pricing shared during concierge checkout
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function Products() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", [1, 2, 3]);

      if (error) console.error("Error fetching products:", error);
      else setRows(data || []);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const curatedProducts = useMemo(() => {
    const plasticImage = rows.find((p) => p.id === 1)?.image;

    return rows.map((product, index) => {
      const story =
        productStories[product.id] || {
          tagline: "Limited release",
          description:
            "Crafted in small batches to preserve the artistry in every detail.",
        };

      return {
        ...product,
        story,
        displayImage:
          product.id === 2 && plasticImage ? plasticImage : product.image,
        order: index,
      };
    });
  }, [rows]);

  if (loading) {
    return <LoadingSpinner label="Loading products..." />;
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>Products</h1> 
          <p className={styles.heroSubtitle}>
            Explore the current lineup and pick the finish that suits the way you connect.
          </p>
          {/* <div className={styles.heroMeta}>
            <span>Curated edit · {curatedProducts.length} signatures</span>
          </div> */}
        </div>
      </section>

      <section className={styles.collectionIntro}>
        <p>Each profile comes paired with both a physical card and a living digital identity. Pricing is revealed privately once you begin checkout for now, simply choose the piece that resonates.</p>
      </section>

      <section className={styles.collectionGrid}>
        {curatedProducts.map((product) => (
          <ProductsCard key={product.id} product={product} />
        ))}
      </section>
    </div>
  );
}
