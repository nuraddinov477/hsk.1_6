import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { Modules } from "@/components/marketing/Modules";
import { Levels } from "@/components/marketing/Levels";
import { Demo } from "@/components/marketing/Demo";
import { Testimonials } from "@/components/marketing/Testimonials";
import { Pricing } from "@/components/marketing/Pricing";
import { Faq } from "@/components/marketing/Faq";
import { CTA } from "@/components/marketing/CTA";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Modules />
        <Levels />
        <Demo />
        <Testimonials />
        <Pricing />
        <Faq />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
