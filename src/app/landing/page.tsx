import { redirect } from "next/navigation";

// /landing is an old alias for the marketing site — kept around so any inbound
// links don't 404 — but the real homepage now lives at "/".
export default function LandingPage() {
  redirect("/");
}
