import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/provider";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n/dictionary";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider, THEME_BOOT_SCRIPT, type Theme } from "@/lib/theme/provider";
import { siteUrl } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "HSKGo — Xitoy tilini o'rganamiz",
  description:
    "Ieroglif yozish, talaffuz, kunlik mashq va sinov imtihonlar bilan HSK 1–9 ga oson tayyorlanasiz.",
  keywords: ["HSK", "xitoy tili", "ieroglif", "HSK 1", "HSK 6", "xitoy tili darslari"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value as Locale | undefined;
  const locale: Locale = cookieLocale && LOCALES.includes(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const cookieTheme = cookieStore.get("theme")?.value as Theme | undefined;
  const theme: Theme = cookieTheme === "light" || cookieTheme === "dark" || cookieTheme === "system" ? cookieTheme : "system";
  // SSR-best-effort dark class: if user pinned "dark" we render dark immediately.
  // For "system"/"light"/no-cookie we render light and let the boot script flip
  // to dark before paint when the OS prefers dark — that prevents both flashes
  // (white in dark mode, dark in light mode).
  const initialDark = theme === "dark";

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased${initialDark ? " dark" : ""}`}
      style={{ colorScheme: initialDark ? "dark" : "light" }}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider initialTheme={theme}>
          <LocaleProvider initialLocale={locale}>
            <AuthProvider>{children}</AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
