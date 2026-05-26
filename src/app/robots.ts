import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Authenticated areas shouldn't be indexed.
      disallow: ["/dashboard", "/learn"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
