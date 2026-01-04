import Link from "next/link";
import styles from "@/styles/TermsOfService.module.css";

export default function TermsOfService() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>TapINK Pty Ltd — Terms of Service</h1>
        <p className={styles.updated}>Last updated: October 2025</p>
      </header>

      <p className={styles.paragraph}>
        These Terms of Service (“Terms”), together with our{" "}
        <Link href="/privacy" className={styles.link}>
          [Privacy Policy]
        </Link>{" "}
        and{" "}
        <Link href="/policies/refund-policy" className={styles.link}>
          [Refund Policy]
        </Link>
        , govern your use of TapINK&apos;s website, products, and services. Please read them carefully
        before using or purchasing from TapINK.
      </p>

      <section className={styles.section}>
        <h2>1. Introduction</h2>
        <p className={styles.paragraph}>
          These Terms apply to your use of TapINK&apos;s websites located at https://tapink.com.au
          (“Sites”), your purchase of TapINK products, and access to TapINK&apos;s associated services
          and platform (“Platform”).
        </p>
        <p className={styles.paragraph}>
          By accessing or using the Sites, purchasing products, or creating an account, you agree to
          be bound by these Terms. If you do not agree, you must not access or use the Sites, Platform,
          or our products and services.
        </p>
        <p className={styles.paragraph}>
          “TapINK”, “we”, “us” or “our” refers to TAP INK Pty Ltd (ACN 673 414 634), an Australian
          company registered in Victoria. “You” or “your” refers to the individual, organisation, or
          entity using our Sites, Products, or Services.
        </p>
        <p className={styles.paragraph}>
          We reserve the right to update or amend these Terms at any time without notice. Continued use
          of our Sites or Services constitutes acceptance of any revised Terms.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. Interpretation</h2>
        <p className={styles.paragraph}>In these Terms:</p>
        <ul className={styles.list}>
          <li>
            “Account” means a registered user account created manually or automatically for access to
            TapINK&apos;s Platform or Services.
          </li>
          <li>
            “Agreement” refers collectively to these Terms, the Privacy Policy, and any other related
            policies.
          </li>
          <li>“Australian Consumer Law” means Schedule 2 of the Competition and Consumer Act 2010 (Cth).</li>
          <li>“Business Day” means Monday to Friday, 9:00am–5:00pm AEST, excluding public holidays.</li>
          <li>“Delivery Cost” refers to the cost associated with delivery of our physical products.</li>
          <li>
            “Intellectual Property Rights” means all existing and future rights (whether registered or
            not) in intellectual property including copyright, trademarks, trade names, logos, software,
            designs, and confidential information.
          </li>
          <li>“NFC Technology” means Near Field Communication technology embedded in our TapINK Cards.</li>
          <li>“Order” means a purchase request placed for TapINK products or services through our Sites.</li>
          <li>
            “Platform” means the TapINK web dashboard that allows management of digital profiles and
            cards.
          </li>
          <li>
            “Products” refers to our NFC-enabled TapINK Cards, digital business cards, or related
            accessories.
          </li>
          <li>
            “Profile” refers to the digital profile created via the TapINK Platform that contains your
            contact, business, or social information.
          </li>
          <li>
            “Services” refers to TapINK&apos;s online and physical services provided through the Platform,
            including customer support, hosting, and ongoing profile functionality.
          </li>
          <li>
            “You” refers to any user, purchaser, or organisation accessing the Sites or Services.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>3. Site and Platform Use</h2>
        <p className={styles.paragraph}>
          You agree to use the Sites and Platform only for their intended purpose and in accordance with
          applicable laws. You must not:
        </p>
        <ul className={styles.list}>
          <li>Engage in fraudulent, unlawful, or abusive conduct;</li>
          <li>Copy, modify, or reverse-engineer any part of the Sites or Platform;</li>
          <li>Use automated systems (e.g., bots or scrapers) to access or overload our systems;</li>
          <li>Upload or transmit malicious code, spam, or offensive material; or</li>
          <li>Infringe the rights or privacy of others.</li>
        </ul>
        <p className={styles.paragraph}>
          TapINK reserves the right to suspend or terminate access to your Account or Platform where
          misuse, violation of these Terms, or unlawful activity is detected.
        </p>
        <p className={styles.paragraph}>
          We make no guarantee that the Sites or Services will be error-free, uninterrupted, or compatible
          with all devices. You are responsible for maintaining your equipment and internet connection.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. Orders and Payments</h2>
        <p className={styles.paragraph}>
          Orders for TapINK products or services may be placed through our Sites. An Order is not binding
          until confirmed by TapINK in writing.
        </p>
        <p className={styles.paragraph}>
          Payment must be made in full at the time of purchase using accepted payment methods displayed on
          the Sites. Prices are in Australian Dollars (AUD) and may include applicable GST.
        </p>
        <p className={styles.paragraph}>
          We reserve the right to refuse or cancel any Order, including in cases of suspected fraud,
          product unavailability, or error. In such cases, any funds paid will be refunded promptly.
        </p>
        <p className={styles.paragraph}>
          Payment processing may be handled by third-party providers (e.g., Stripe or Shopify), and you
          agree to comply with their terms of service.
        </p>
      </section>

      <section className={styles.section}>
        <h2>5. Account and Profile Information</h2>
        <p className={styles.paragraph}>
          You are responsible for ensuring that your account details and profile information are accurate
          and up to date. TapINK accepts no liability for delays, errors, or losses arising from incorrect
          or incomplete information provided by you.
        </p>
        <p className={styles.paragraph}>
          You must keep your login credentials secure and notify TapINK immediately if you suspect
          unauthorised access. You are responsible for all actions performed through your account.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Delivery and Ownership</h2>
        <p className={styles.paragraph}>
          Delivery costs are displayed at checkout and vary by destination and order size. Estimated
          delivery times are provided as a guide only.
        </p>
        <p className={styles.paragraph}>
          Ownership and risk in TapINK physical products transfer to you upon delivery. TapINK is not
          responsible for delays, damages, or losses caused by courier services once products have been
          dispatched.
        </p>
      </section>

      <section className={styles.section}>
        <h2>7. Platform Access and Renewal</h2>
        <p className={styles.paragraph}>
          Where you hold multiple TapINK Cards under one account (e.g., business plans), you may be
          charged an annual platform utilisation fee for continued access to TapINK&apos;s dashboard
          services.
        </p>
        <p className={styles.paragraph}>
          This fee renews automatically each year unless cancelled at least 10 days prior to renewal.
          Failure to pay may result in restricted platform access, although your cards will remain
          functional for sharing purposes.
        </p>
      </section>

      <section className={styles.section}>
        <h2>8. Refunds and Replacements</h2>
        <p className={styles.paragraph}>
          We comply with the Australian Consumer Law and provide refunds, replacements, or repairs where
          required by law.
        </p>
        <p className={styles.paragraph}>
          Refunds are not available once your card design or profile has entered the printing or production
          process, except in cases of product fault or damage not caused by misuse.
        </p>
        <p className={styles.paragraph}>
          Requests for faulty or incorrect items must be made within 10 business days of delivery by
          contacting hello@tapink.com.au.
        </p>
      </section>

      <section className={styles.section}>
        <h2>9. Intellectual Property</h2>
        <p className={styles.paragraph}>
          All content on the Sites and Platform, including design, code, logos, and graphics, is owned by
          TapINK or its licensors. You may not reproduce, distribute, or adapt any part without prior
          written consent.
        </p>
        <p className={styles.paragraph}>
          By uploading content to your TapINK profile, you grant TapINK a non-exclusive, royalty-free
          licence to host and display that content for the purpose of providing our services.
        </p>
      </section>

      <section className={styles.section}>
        <h2>10. Indemnity</h2>
        <p className={styles.paragraph}>
          You agree to indemnify and hold TapINK and its employees, directors, and contractors harmless
          from any loss, damage, liability, or expense (including legal fees) arising from your breach of
          these Terms or unlawful use of the Sites, Products, or Platform.
        </p>
      </section>

      <section className={styles.section}>
        <h2>11. Limitation of Liability</h2>
        <p className={styles.paragraph}>
          To the fullest extent permitted by law, TapINK excludes all implied warranties and is not liable
          for any indirect, consequential, or special loss (including loss of profits, data, or goodwill)
          arising out of your use of the Sites or Services.
        </p>
        <p className={styles.paragraph}>
          Where liability cannot be excluded, TapINK&apos;s maximum liability is limited to the cost of the
          product or service supplied.
        </p>
      </section>

      <section className={styles.section}>
        <h2>12. Privacy</h2>
        <p className={styles.paragraph}>
          TapINK respects your privacy and handles your personal information in accordance with the Privacy
          Act 1988 (Cth) and our{" "}
          <Link href="https://tapink.com.au/privacy-policy" className={styles.link}>
            [Privacy Policy]
          </Link>
          , available at https://tapink.com.au/privacy-policy.
        </p>
      </section>

      <section className={styles.section}>
        <h2>13. Termination</h2>
        <p className={styles.paragraph}>Either party may terminate these Terms at any time:</p>
        <ul className={styles.list}>
          <li>You may terminate by written notice to TapINK at hello@tapink.com.au.</li>
          <li>TapINK may terminate or suspend access if you breach these Terms or engage in unlawful conduct.</li>
        </ul>
        <p className={styles.paragraph}>Outstanding fees remain payable up to the date of termination.</p>
      </section>

      <section className={styles.section}>
        <h2>14. Governing Law</h2>
        <p className={styles.paragraph}>
          These Terms are governed by the laws of Victoria, Australia, and the parties submit to the
          exclusive jurisdiction of its courts.
        </p>
      </section>

      <section className={styles.section}>
        <h2>15. Contact Information</h2>
        <p className={styles.paragraph}>For questions, concerns, or support:</p>
        <ul className={styles.contactList}>
          <li>📧 hello@tapink.com.au</li>
          <li>📍 TapINK Pty Ltd, Melbourne, VIC, Australia</li>
        </ul>
      </section>
    </div>
  );
}
