"use client";

import { useLocale } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/dictionary";

const OPTIONS: { code: Locale; label: string }[] = [
  { code: "uz", label: "UZ" },
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
];

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="inline-flex rounded-full border border-border bg-background p-0.5 text-xs font-medium">
      {OPTIONS.map((o) => {
        const active = o.code === locale;
        return (
          <button
            key={o.code}
            type="button"
            onClick={() => setLocale(o.code)}
            aria-pressed={active}
            className={`h-7 min-w-[2.25rem] rounded-full px-2 transition ${
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
