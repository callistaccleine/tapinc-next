"use client";

import Image, { StaticImageData } from "next/image";
import styles from "@/styles/CardDisplay.module.css";

interface ProfileCardOptionProps {
  title: string;
  subtitle: string;
  image: StaticImageData;
  isSelected: boolean;
  onClick: () => void;
}

const ProfileCardOption = ({ title, subtitle, image, isSelected, onClick }: ProfileCardOptionProps) => {
  return (
    <div
      onClick={onClick}
      className={`${styles.profileCardOption} ${isSelected ? styles.selected : ""}`}
    >
      <div className={styles.title}>{title}</div>
      <div className={styles.subtitle}>{subtitle}</div>
      <Image src={image} alt={title} className={styles.cardImage} />
    </div>
  );
};

export default ProfileCardOption;
