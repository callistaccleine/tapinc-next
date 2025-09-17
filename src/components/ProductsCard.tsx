"use client";

import { useRouter } from "next/navigation";
import styles from "@/styles/ProductsCard.module.css";

type ProductsCardProps = {
  id: number;
  image: string;
  title: string;
  price: string | number;
  badge?: string;
};

export default function ProductsCard({ id, image, title, price, badge }: ProductsCardProps) {

  return (
    <article className={styles.productsCard} role="group" aria-label={`${title} card`}>
      <div className={styles.productsMedia}>
        <img src={image} alt={title} className={styles.productsImage} loading="lazy" />
      </div>

      <header className={styles.productsMeta}>
        <div className={styles.productsHeaders}>
          <h3 className={styles.productsTitle}>{title}</h3>
          {badge && <span className={styles.productsBadge}>{badge}</span>}
        </div>
        <span className={styles.productsPrice}>{price}</span>
      </header>
    </article>
  );
}
