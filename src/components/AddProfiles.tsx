"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProfileCardOption from "./ProfileCardOption";
import styles from "@/styles/AddProfiles.module.css";
import Image from "next/image";
import businessCard from "@/../public/images/cards/businessCard.png";
import { supabase } from "@/lib/supabaseClient"; 

const AddProfiles = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const profileOptions = [
    {
      id: "custom",
      title: "Custom Cards",
      subtitle: "Physical NFC Card + Digital Profile",
      image: businessCard,
    },
    {
      id: "digital",
      title: "Virtual Card",
      subtitle: "Digital Profile Only",
      image: businessCard,
    },
  ];

  const handleQuantity = (delta: number) => {
    setQuantity((q) => Math.max(1, q + delta));
  };

  const handleCheckout = async () => {
    if (!selected) return;
    setLoading(true);

    // Get logged-in user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      alert("You must be logged in to add profiles");
      setLoading(false);
      return;
    }

    // Find profile option selected
    const option = profileOptions.find((o) => o.id === selected);
    if (!option) {
      setLoading(false);
      return;
    }

    //  Insert into profiles table
    const { error } = await supabase.from("profiles").insert([
      {
        user_id: user.id,             // link to auth user
        title: option.title,
        subtitle: option.subtitle,
        image_url: "/images/cards/businessCard.png", 
        quantity,
        plan: "free",                 
      },
    ]);

    if (error) {
      console.error("Error inserting profile:", error);
      alert("Failed to create profile.");
    } else {
      router.push("/design");
    }

    setLoading(false);
  };

  return (
    <div className={styles.addProfilesContainer}>
      <div className={styles.addProfilesHeader}>
        <h2>Add more profiles</h2>
        <p className={styles.subtext}>Select a profile type and quantity</p>
      </div>

      {profileOptions.map((option) => (
        <ProfileCardOption
          key={option.id}
          title={option.title}
          subtitle={option.subtitle}
          image={option.image}
          isSelected={selected === option.id}
          onClick={() => setSelected(option.id)}
        />
      ))}

      <div className={styles.quantityControls}>
        <div className={styles.quantityBox}>
          <button onClick={() => handleQuantity(-1)}>-</button>
          <span>{quantity}</span>
          <button onClick={() => handleQuantity(1)}>+</button>
        </div>

        <button
          disabled={!selected || loading}
          onClick={handleCheckout}
          className={`${styles.checkoutButton} ${
            selected ? styles.active : styles.disabled
          }`}
        >
          {loading ? "Saving..." : "Go to checkout"}
        </button>
      </div>
    </div>
  );
};

export default AddProfiles;
