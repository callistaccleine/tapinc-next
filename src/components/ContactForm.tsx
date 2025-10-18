"use client";

import { useState } from "react";
import styles from "@/styles/ContactForm.module.css";

interface ContactFormProps {
  isModal?: boolean;
  onClose?: () => void;
}

export default function ContactForm({ isModal = false, onClose }: ContactFormProps) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [status, setStatus] = useState<{ loading: boolean; ok: boolean | null; msg: string }>({
    loading: false,
    ok: null,
    msg: "",
  });

  const categories = [
    "Billing & plans",
    "Connections",
    "Sign in & up",
    "Workspace managing",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({ loading: false, ok: false, msg: "Please fill all fields." });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setStatus({ loading: false, ok: false, msg: "Please enter a valid email address." });
      return;
    }

    setStatus({ loading: true, ok: null, msg: "" });

    try {
      const res = await fetch("/api/send-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, category: selectedCategory }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to send message.");

      setStatus({ loading: false, ok: true, msg: "Thanks! Your message has been sent." });
      setForm({ name: "", email: "", message: "" });
      setSelectedCategory(null);
    } catch (err: any) {
      console.error(err);
      setStatus({ loading: false, ok: false, msg: "Something went wrong. Please try again." });
    }
  };

  return (
    <div className={`${isModal ? styles.modalOverlay : ""}`}>
      <div className={`${isModal ? styles.modalContent : styles.contactSection}`}>
        {isModal && (
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        )}

        <h2 className={styles.title}>Contact Us</h2>
        <p className={styles.subtitle}>
          Reach out to us for any inquiry, feedback, or support request. We’re here to help!
        </p>

        <form onSubmit={onSubmit} className={styles.form}>
          <label>Name*</label>
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            value={form.name}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <label>Email*</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <div className={styles.categoryContainer}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`${styles.categoryButton} ${
                  selectedCategory === cat ? styles.activeCategory : ""
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <label>Message*</label>
          <textarea
            name="message"
            placeholder="Enter your message"
            value={form.message}
            onChange={handleChange}
            required
            className={styles.textarea}
          />

          <button type="submit" className={styles.submitBtn} disabled={status.loading}>
            {status.loading ? "Sending..." : "Send your request →"}
          </button>

          {status.msg && (
            <p
              className={`${styles.statusMsg} ${
                status.ok ? styles.successMsg : styles.errorMsg
              }`}
            >
              {status.msg}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
