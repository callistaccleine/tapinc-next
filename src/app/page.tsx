import Auth from "@/components/Auth";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Navbar from "@/components/Navbar";
import Features from "@/components/Features"
import CardDisplay from "@/components/CardDisplay";
import Footer from "@/components/Footer";

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
