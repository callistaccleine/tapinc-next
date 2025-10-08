import styles from "../../styles/Footer.module.css";
import { FaLinkedin, FaInstagram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* Brand */}
        <div className={styles.footerBrand}>
          <h2>TapINK</h2>
          <div className={styles.footerSocials}>
            <a
              href="https://www.linkedin.com/company/tapinc"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaLinkedin size={22} />
            </a>
            <a
              href="https://www.instagram.com/tapinc_official"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram size={22} />
            </a>
          </div>
        </div>

        {/* Links */}
        <div className={styles.footerLinks}>
          <div className={styles.footerColumn}>
            <h4>Product</h4>
            <p>Product Overview</p>
            <p>Pricing</p>
          </div>
          <div className={styles.footerColumn}>
            <h4>Legal</h4>
            <p>Terms of use</p>
            <p>Privacy Policy</p>
            <p>Cookie Preferences</p>
          </div>
          <div className={styles.footerColumn}>
            <h4>Company</h4>
            <p>About</p>
            <p>Page</p>
            <p>Page</p>
          </div>
          <div className={styles.footerColumn}>
            <h4>Contact Us</h4>
            <p>+61 9428 2408</p>
            <p>tapinc.io.au@gmail.com</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
