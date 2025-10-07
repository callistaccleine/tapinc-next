import React, { useState, useEffect } from "react";
import styles from "@/styles/ContactForm.module.css";

interface ContactFormProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ContactForm({ isOpen = true, onClose }: ContactFormProps) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<{ loading: boolean; ok: boolean | null; msg: string }>({
    loading: false,
    ok: null,
    msg: "",
  });
  const [showNotification, setShowNotification] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleClose = () => {
    console.log('Close button clicked'); // Debug log
    if (onClose) {
      console.log('Calling onClose function'); // Debug log
      onClose();
    } else {
      console.log('onClose function not provided'); // Debug log
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the overlay, not the modal content
    if (e.target === e.currentTarget) {
      console.log('Overlay clicked'); // Debug log
      handleClose();
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({ loading: false, ok: false, msg: "Please fill all fields." });
      return;
    }

    // Basic email validation
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
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      setStatus({ 
        loading: false, 
        ok: true, 
        msg: data.message || "Thanks! We'll be in touch." 
      });
      setForm({ name: "", email: "", message: "" });
      setShowNotification(true);

      // Auto-close modal after success
      setTimeout(() => {
        handleClose();
      }, 3000);

    } catch (err: any) {
      setStatus({
        loading: false,
        ok: false,
        msg: err.message || "Something went wrong. Please try again later.",
      });
    }
  };

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => setShowNotification(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div className={styles.modalOverlay} onClick={handleOverlayClick}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          {/* Close Button */}
          <button 
            className={styles.closeButton} 
            onClick={handleClose} 
            type="button"
            aria-label="Close modal"
          >
            ×
          </button>

          {/* Modal Header */}
          <div className={styles.modalHeader}>
            <h2>Contact Us</h2>
            <p>We'd love to hear from you. Send us a message!</p>
          </div>

          {/* Contact Form */}
          <form className={styles.contactForm} onSubmit={onSubmit} noValidate>
            <label className={styles.label}>
              <span>Name</span>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={onChange}
                required
                className={styles.input}
                placeholder="Your full name"
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
                placeholder="your.email@example.com"
              />
            </label>

            <label className={styles.label}>
              <span>Message</span>
              <textarea
                name="message"
                rows={4}
                value={form.message}
                onChange={onChange}
                required
                className={styles.textarea}
                placeholder="Tell us about your inquiry..."
              />
            </label>

            <button type="submit" disabled={status.loading} className={styles.button}>
              {status.loading ? "Sending..." : "Send Message"}
            </button>

            {/* Inline Error Messages */}
            {status.msg && !status.ok && (
              <p className={styles.error} style={{ marginTop: 8 }}>
                {status.msg}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Success Notification */}
      {showNotification && status.ok && (
        <div className={styles.notification}>
          <div className={styles.notificationContent}>
            <div className={styles.notificationIcon}>✓</div>
            <div className={styles.notificationText}>
              <strong>Message Sent!</strong>
              <p>{status.msg}</p>
            </div>
            <button 
              className={styles.notificationClose}
              onClick={() => setShowNotification(false)}
              type="button"
            >
              x
            </button>
          </div>
        </div>
      )}
    </>
  );
}