import styles from "../../styles/Footer.module.css";
import { FaLinkedin, FaInstagram, FaTiktok } from "react-icons/fa";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className={styles.footerContainer}>
          {/* Main Navigation Columns */}
          <div className={styles.footerGrid}>
            <div className={styles.footerColumn}>
              <h4>Product</h4>
              <Link href="/overview">Product Overview</Link>
              <Link href="/features">Features</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/enterprise">Enterprise</Link>
            </div>

            <div className={styles.footerColumn}>
              <h4>Solutions</h4>
              <Link href="/business">For Business</Link>
              <Link href="/events">For Events</Link>
              <Link href="/personal">Personal Use</Link>
              <Link href="/integrations">Integrations</Link>
            </div>

            <div className={styles.footerColumn}>
              <h4>Resources</h4>
              <Link href="/support">Support</Link>
              <Link href="/documentation">Documentation</Link>
              <Link href="/blog">Blog</Link>
              <Link href="/guides">Guides</Link>
            </div>

            <div className={styles.footerColumn}>
              <h4>Company</h4>
              <Link href="/about">About TapInk</Link>
              <Link href="/careers">Careers</Link>
              <Link href="/press">Press Kit</Link>
              <Link href="/contact">Contact</Link>
            </div>

            <div className={styles.footerColumn}>
              <h4>Legal</h4>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/cookies">Cookie Policy</Link>
              <Link href="/security">Security</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.footerBottom}>
        <div className={styles.footerContainer}>
          <div className={styles.bottomContent}>
            <div className={styles.footerBrand}>
              <h2>TapInk</h2>
              <p>© 2025 TapInk. All rights reserved.</p>
            </div>

            <div className={styles.bottomLinks}>
              <Link href="/sitemap">Sitemap</Link>
              <span className={styles.divider}>|</span>
              <Link href="/accessibility">Accessibility</Link>
              <span className={styles.divider}>|</span>
              <a href="tel:+61 9428 2408">+61 9428 2408</a>
            </div>

            <div className={styles.footerSocials}>
              <a
                href="https://www.tiktok.com/@tapink_official"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Tiktok"
              >
                <FaTiktok size={20} />
              </a>
              <a
                href="https://www.instagram.com/tapink_official"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <FaInstagram size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}