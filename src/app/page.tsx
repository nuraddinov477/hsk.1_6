import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

// Smart entry point. Anyone hitting the root URL is dispatched server-side:
//   signed in   → /dashboard (their learning hub)
//   anonymous   → /login     (so the very first thing visitors see is the
//                              email/password form, per product spec)
//
// The marketing site is kept reachable at /landing for direct links + SEO,
// but it's no longer the default landing experience.
export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  redirect(user ? "/dashboard" : "/login");
}
