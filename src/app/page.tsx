import Auth from "@/components/Auth";
import Hero from "@/components/hero/Hero";
import HowItWorks from "@/components/hero/HowItWorks";
import Navbar from "@/components/hero/Navbar";
import Features from "@/components/hero/Features"
import CardDisplay from "@/components/CardDisplay";
import Footer from "@/components/hero/Footer";

export default function Home() {
  return (
    <main>
      {/* <Auth/> */}
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <CardDisplay />
      <Footer />
    </main>
  );
}
