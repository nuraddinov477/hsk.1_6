import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const lastModified = new Date();
  // Only public pages — the app and auth screens stay out of the sitemap.
  const routes = ["", "/login", "/register", "/legal/terms", "/legal/privacy"];
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified,
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.6,
  }));
}
