import Image from "next/image";
import styles from "../styles/Features.module.css";

interface FeatureCardProps {
  image: string;
  title: string;
  description: string;
}

export default function FeatureCard({ image, title, description }: FeatureCardProps) {
  return (
    <div className={styles.featureCard}>
      <Image
        src={image}
        alt={title}
        width={400}
        height={160}
        className={styles.featureImage}
      />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
