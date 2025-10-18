import Hero from "@/components/hero/Hero";
import HowItWorks from "@/components/hero/HowItWorks";
import Navbar from "@/components/hero/Navbar";
import Features from "@/components/hero/Features"
import Footer from "@/components/hero/Footer";
import CustomerReview from "@/components/hero/CustomerReview";
import CompanyList from "@/components/hero/CompanyList";
import Benefit from "@/components/hero/Benefit";
import AboutUs from "@/components/AboutUs";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <div id="next-section">
        <CompanyList />
      </div>
      <AboutUs />
      <HowItWorks />
      <Features />
      <Benefit />
      <CustomerReview />
      <Footer />
    </main>
  );
}
