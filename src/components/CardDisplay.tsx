import Image from "next/image";
import displayCard, { Card } from "./hero/DisplayCard";
import styles from "../styles/CardDisplay.module.css";

export default function CardDisplay() {
  return (
    <section className={styles.cardDisplaySection}>
      <h2 className={styles.cardDisplayTitle}>Select Your Cards</h2>
      <div className={styles.cardList}>
        {displayCard.map((card: Card, index: number) => (
          <div className={styles.cardContainer} key={index}>
            <h3 className={styles.cardName}>{card.title}</h3>
            <Image
              src={card.image}
              alt={card.title}
              width={300}
              height={200}
              className={styles.cardImage}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
