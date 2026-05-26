import type { NextConfig } from "next";

// Security headers applied to every response. These are static (no per-request
// nonce), so they live in next.config rather than in proxy.ts.
const securityHeaders = [
  // Force HTTPS for two years, including subdomains. Harmless over plain HTTP
  // (browsers only honour it once served over TLS), so safe to ship.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Disallow framing entirely — clickjacking protection.
  { key: "X-Frame-Options", value: "DENY" },
  // Don't let browsers MIME-sniff responses away from their declared type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send only the origin on cross-origin navigations.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Lock down powerful features. The speaking module records audio, so the
  // microphone must stay allowed for our own origin; everything else is denied.
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
