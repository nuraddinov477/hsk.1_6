"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { dictionaries, DEFAULT_LOCALE, LOCALES, type Locale, type AppDict } from "./dictionary";

const COOKIE_NAME = "locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: AppDict;
};

const LocaleContext = createContext<Ctx | null>(null);

function readCookieLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  const val = decodeURIComponent(match[1]) as Locale;
  return LOCALES.includes(val) ? val : null;
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const fromCookie = readCookieLocale();
    if (fromCookie && fromCookie !== locale) setLocaleState(fromCookie);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof document !== "undefined") {
      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(l)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
    }
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}

export function useT(): AppDict {
  return useLocale().t;
}

export { DEFAULT_LOCALE, LOCALES };
export type { Locale };
