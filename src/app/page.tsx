import Auth from "@/components/Auth";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <main>
      {/* <Auth/> */}
      <Navbar />
      <Hero />
      <HowItWorks />
    </main>
  );
}
