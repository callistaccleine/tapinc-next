"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/Products.module.css";

type ProductRow = {
  id: number;
  title: string;
  price: number | string;
  badge?: string | null;
  image?: string | null;
  created_at?: string | null;
};

type SortOption = {
  value: string;
  label: string;
};

function ProductsCard({ id, image, title, price, badge }: ProductRow) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`${styles.card}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.imageContainer}>
        <img src={image || ""} alt={title} className={styles.image} />
        {badge && <div className={styles.badge}>{badge}</div>}
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.price}>
          {typeof price === "number" ? `$${price}` : price}
        </p>

        <button
          className={`${styles.addBtn} ${isHovered ? styles.addBtnVisible : styles.addBtnHidden}`}
        >
          Add to Bag
        </button>
      </div>
    </div>
  );
}

export default function Products() {
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("best");
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  const sortOptions: SortOption[] = [
    { value: "best", label: "Best Selling" },
    { value: "newest", label: "Newest" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
  ];

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

  const items = useMemo(() => {
    const parsePrice = (s: number | string): number | null => {
      if (typeof s === "number") return s;
      const n = Number(String(s).replace(/[^0-9.]/g, ""));
      return Number.isFinite(n) ? n : null;
    };

    const parseDate = (d?: string | null): number | null => {
      if (!d) return null;
      const t = Date.parse(d);
      return Number.isFinite(t) ? t : null;
    };

    return rows.map((p, index) => ({
      ...p,
      index,
      priceValue: parsePrice(p.price),
      createdAtValue: parseDate(p.created_at),
    }));
  }, [rows]);

  const sorted = useMemo(() => {
    const arr = [...items];
    switch (sortBy) {
      case "price-asc":
        arr.sort((a, b) => (a.priceValue ?? Infinity) - (b.priceValue ?? Infinity));
        break;
      case "price-desc":
        arr.sort((a, b) => (b.priceValue ?? -Infinity) - (a.priceValue ?? -Infinity));
        break;
      case "newest":
        arr.sort((a, b) => (b.createdAtValue ?? 0) - (a.createdAtValue ?? 0));
        break;
      case "best": {
        const rank = (p: any) =>
          p.badge === "Best Seller" ? 2 : p.badge === "Popular" ? 1 : 0;
        arr.sort((a, b) => rank(b) - rank(a) || a.index - b.index);
        break;
      }
      default:
        arr.sort((a, b) => a.index - b.index);
    }
    return arr;
  }, [items, sortBy]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading products...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Hero Header */}
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Products</h1>
        <p className={styles.headerSubtitle}>
          Discover our curated collection of premium products
        </p>
      </header>

      {/* Toolbar */}
      <div className={styles.toolbarContainer}>
        <div className={styles.toolbar}>
          <p className={styles.toolbarText}>{sorted.length} products</p>

          <div className={styles.sortWrapper}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={styles.sortButton}
            >
              <span>Sort by: {sortOptions.find((o) => o.value === sortBy)?.label}</span>
              <svg
                className={`${styles.arrowIcon} ${showFilters ? styles.arrowRotate : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showFilters && (
              <>
                <div className={styles.overlay} onClick={() => setShowFilters(false)} />
                <div className={styles.dropdown}>
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSortBy(opt.value);
                        setShowFilters(false);
                      }}
                      className={`${styles.dropdownItem} ${
                        sortBy === opt.value ? styles.activeDropdownItem : ""
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className={styles.gridContainer}>
        {sorted.map((p) => (
          <ProductsCard
            key={p.id}
            id={p.id}
            image={p.image || ""}
            title={p.title}
            price={p.priceValue || 0}
            badge={p.badge || ""}
          />
        ))}
      </div>
    </div>
  );
}
