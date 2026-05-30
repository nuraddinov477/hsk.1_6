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

// Site entry. Whoever lands here — anonymous or signed-in — sees the marketing
// landing. From here, "Kirish" takes them to /login (already-signed-in users
// are bounced straight to /dashboard by the middleware) and "Boshlash" /
// "Ro'yxatdan o'ting" takes them into the onboarding wizard.
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
