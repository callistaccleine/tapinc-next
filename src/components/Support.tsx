"use client";

import ContactForm from "@/components/ContactForm";
import styles from "@/styles/Support.module.css";
import { useState } from "react";

export default function Support() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I edit my TapInk profile?",
      answer:
        "You can log in to your dashboard and click on 'Edit Profile' to change your personal details, links, or design templates.",
    },
    {
      question: "How can I reset my password?",
      answer:
        "Go to the login page and click on 'Forgot password?'. Follow the instructions sent to your registered email.",
    },
    {
      question: "Can I use TapInk without a subscription?",
      answer:
        "Yes! You can start with our free plan. Upgrade anytime for more advanced analytics and customization features.",
    },
    {
      question: "Do you offer custom NFC cards for teams?",
      answer:
        "Yes, we do offer custom NFC cards for teams or businesses. Contact our sales team using the form above.",
    },
    {
      question: "What if I'm not good at designing my card",
      answer:
        "No worries, Our professional designers can help you create a polished, eye-catching card that suits your style.",
    },
  ];

  return (
    <main className={styles.helpContainer}>
      {/* =========================
          CONTACT SUPPORT SECTION
      ========================== */}
      <section className={styles.contactSection}>
        <div className={styles.contactLeft}>
          <div className={styles.contactIntro}>
            <h1 className={styles.title}>Contact Us</h1>
            <p className={styles.subtitle}>
              Need help using TapInk? Sign in so we can assist you better.  
              If that's not possible, simply send us your request below.
            </p>
          </div>
          <div className={styles.contactCardWrapper}>
            <ContactForm isModal={false} layout="embedded" />
          </div>
        </div>
      </section>
 
      {/* =========================
          FAQ SECTION
      ========================== */}
      <section className={styles.faqSection}>
        <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
        <div className={styles.faqList}>
          {faqs.map((faq, i) => (
            <div key={i} className={styles.faqItem}>
              <button
                className={styles.faqQuestion}
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
              >
                {faq.question}
                <span className={styles.toggleIcon}>
                  {openFAQ === i ? "-" : "+"}
                </span>
              </button>
              {openFAQ === i && <p className={styles.faqAnswer}>{faq.answer}</p>}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
