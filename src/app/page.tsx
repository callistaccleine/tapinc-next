import Hero from "@/components/hero/Hero";
import HowItWorks from "@/components/hero/HowItWorks";
import Navbar from "@/components/hero/Navbar";
import Features from "@/components/hero/Features"
import Footer from "@/components/hero/Footer";
import CustomerReview from "@/components/hero/CustomerReview";
import CompanyList from "@/components/hero/CompanyList";
import Define from "@/components/Define";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <div id="next-section">
        <CompanyList />
      </div>
      <Define />
      <HowItWorks />
      <Features />
      <CustomerReview />
      <Footer />
    </main>
  );
}
