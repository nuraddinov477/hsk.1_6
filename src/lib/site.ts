/**
 * Public base URL of the deployed site, used for metadata, robots and sitemap.
 * Prefers an explicit env var, falls back to Vercel's deploy URL, then localhost.
 */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
