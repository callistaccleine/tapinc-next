"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProductsCard from "./ProductsCard";
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

export default function Products() {
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("best");
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const sortOptions: SortOption[] = [
    { value: "best", label: "Best selling" },
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "default", label: "Default" },
  ];

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const { data, error } = await supabase
          .from("products")
          .select("id, title, price, badge, image, created_at")
          .order("id", { ascending: true });

        if (error) throw error;
        setRows(data ?? []);
      } catch (e: any) {
        setErr(e.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    })();
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
      case "oldest":
        arr.sort((a, b) => (a.createdAtValue ?? Infinity) - (b.createdAtValue ?? Infinity));
        break;
      case "best": {
        const rank = (p: any) => (p.badge === "Best Seller" ? 2 : p.badge === "Popular" ? 1 : 0);
        arr.sort((a, b) => rank(b) - rank(a) || a.index - b.index);
        break;
      }
      default:
        arr.sort((a, b) => a.index - b.index);
    }
    return arr;
  }, [items, sortBy]);

  if (loading) return <div className={styles.productsPage}><p>Loading products…</p></div>;
  if (err) return <div className={styles.productsPage}><p style={{ color: "crimson" }}>{err}</p></div>;

  return (
    <div className={styles.productsPage}>
      <header className={styles.productsHeader}>
        <h1>Products</h1>
      </header>

      <div className={styles.productsToolbar}>
        <div className={styles.filterDropdown}>
          <button
            className={styles.filterButton}
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            aria-controls="filters-panel"
          >
            {showFilters ? "Filters" : " Filters"}
          </button>

          {showFilters && (
            <div id="filters-panel" className={styles.dropdownPanel}>
              <ul className={styles.optionList}>
                {sortOptions.map((opt) => (
                  <li
                    key={opt.value}
                    className={`${styles.optionItem} ${
                      sortBy === opt.value ? styles.selected : ""
                    }`}
                    onClick={() => setSortBy(opt.value)}
                  >
                    <input
                      type="checkbox"
                      checked={sortBy === opt.value}
                      readOnly
                    />
                    <span>{opt.label}</span>
                    {sortBy === opt.value && (
                      <button
                        className={styles.removeBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSortBy("default"); // reset filter
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className={styles.productsGrid}>
        {sorted.map((p) => (
          <ProductsCard
            key={p.id}
            id={p.id}
            image={p.image || ""}
            title={p.title}
            price={typeof p.price === "number" ? `$${p.price.toFixed(2)}` : p.price}
            badge={p.badge || ""}
          />
        ))}
      </div>
    </div>
  );
}
