import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
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

// Site entry point. Anonymous visitors see the marketing landing here; signed-in
// users are forwarded to their learning hub. /login is reached via the navbar
// "Kirish" button or the inline "Ro'yxatdan o'ting" / "Boshlash" CTAs.
export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

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
