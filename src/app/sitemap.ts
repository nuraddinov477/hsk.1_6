import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const lastModified = new Date();
  // Only public pages — the app and auth screens stay out of the sitemap.
  // `/landing` is the marketing page; `/` is a server-side redirect to login
  // or dashboard and shouldn't be crawled as content.
  const routes = ["/landing", "/login", "/start", "/legal/terms", "/legal/privacy"];
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified,
    changeFrequency: "monthly",
    priority: route === "/landing" ? 1 : 0.6,
  }));
}
