"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Three-state theme. "system" follows the OS preference live; the other two
// pin the appearance regardless of OS. We persist to a cookie so the server
// can render the right colour scheme on first paint (no flash).
export type Theme = "light" | "dark" | "system";

const COOKIE_NAME = "theme";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

type Ctx = {
  theme: Theme;            // user's choice (raw)
  resolved: "light" | "dark"; // what's actually showing right now
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<Ctx | null>(null);

function readCookie(): Theme | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]+)`));
  if (!m) return null;
  const v = decodeURIComponent(m[1]);
  return v === "light" || v === "dark" || v === "system" ? v : null;
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyClass(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  // Helps the browser pick the right native scrollbar / form control colours.
  root.style.colorScheme = resolved;
}

export function ThemeProvider({
  initialTheme = "system",
  children,
}: {
  initialTheme?: Theme;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [resolved, setResolved] = useState<"light" | "dark">(() => {
    if (initialTheme === "dark") return "dark";
    if (initialTheme === "light") return "light";
    return systemPrefersDark() ? "dark" : "light";
  });

  // On mount: prefer the cookie (in case SSR didn't see it) and re-derive the
  // resolved theme. The anti-flash script in <head> has already applied the
  // correct class; this just brings React state in line with the DOM.
  useEffect(() => {
    const fromCookie = readCookie();
    if (fromCookie && fromCookie !== theme) setThemeState(fromCookie);
    const t = fromCookie ?? theme;
    const r = t === "dark" ? "dark" : t === "light" ? "light" : systemPrefersDark() ? "dark" : "light";
    setResolved(r);
    applyClass(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the user picks "system", track live OS changes.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const r = mq.matches ? "dark" : "light";
      setResolved(r);
      applyClass(r);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    if (typeof document !== "undefined") {
      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(t)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
    }
    const r = t === "dark" ? "dark" : t === "light" ? "light" : systemPrefersDark() ? "dark" : "light";
    setResolved(r);
    applyClass(r);
  }, []);

  const value = useMemo<Ctx>(() => ({ theme, resolved, setTheme }), [theme, resolved, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

// Inline script string that runs in <head> before paint to set the dark class.
// Reads the same cookie + matches the same logic as ThemeProvider so the SSR'd
// page renders in the right colour scheme with zero flash.
export const THEME_BOOT_SCRIPT = `(function(){try{
  var m = document.cookie.match(/(?:^|; )theme=([^;]+)/);
  var t = m ? decodeURIComponent(m[1]) : 'system';
  var dark = t === 'dark' || (t === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  var r = document.documentElement;
  if (dark) r.classList.add('dark'); else r.classList.remove('dark');
  r.style.colorScheme = dark ? 'dark' : 'light';
}catch(e){}})();`;
