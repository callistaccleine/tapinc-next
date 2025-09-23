import React, { useState } from "react";
import styles from "@/styles/ContactForm.module.css";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<{ loading: boolean; ok: boolean | null; msg: string }>({
    loading: false,
    ok: null,
    msg: "",
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setStatus({ loading: false, ok: false, msg: "Please fill all fields." });
      return;
    }
    setStatus({ loading: true, ok: null, msg: "" });
    try {
      const res = await fetch("/api/send-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus({ loading: false, ok: true, msg: "Thanks! We'll be in touch." });
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus({
        loading: false,
        ok: false,
        msg: "Something went wrong. Please try again later.",
      });
    }
  };

  return (
    <form className={styles.contactForm} onSubmit={onSubmit} noValidate>
        <div className={styles.contactModal}>
        <label className={styles.label}>
            <span>Name</span>
            <input
            name="name"
            type="text"
            value={form.name}
            onChange={onChange}
            required
            className={styles.input}
            />
        </label>

        <label className={styles.label}>
            <span>Email</span>
            <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
            className={styles.input}
            />
        </label>

        <label className={styles.label}>
            <span>Message</span>
            <textarea
            name="message"
            rows={5}
            value={form.message}
            onChange={onChange}
            required
            className={styles.textarea}
            />
        </label>

        <button type="submit" disabled={status.loading} className={styles.button}>
            {status.loading ? "Sending..." : "Send"}
        </button>
      </div>

      {status.msg && (
        <p
          aria-live="polite"
          className={status.ok ? styles.success : styles.error}
          style={{ marginTop: 8 }}
        >
          {status.msg}
        </p>
      )}
    </form>
  );
}