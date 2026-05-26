"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useT } from "@/lib/i18n/provider";

const PLAN_META = [
  { key: "free",    price: "0 so'm",        cadenceKey: "forever",  href: "/register",                highlight: false },
  { key: "pro",     price: "79 000 so'm",   cadenceKey: "perMonth", href: "/register?plan=pro",       highlight: true  },
  { key: "premium", price: "149 000 so'm",  cadenceKey: "perMonth", href: "/register?plan=premium",   highlight: false },
] as const;

const LOCALIZED_PRICES: Record<string, Record<"free" | "pro" | "premium", string>> = {
  uz: { free: "0 so'm",   pro: "79 000 so'm",  premium: "149 000 so'm" },
  ru: { free: "0 сум",    pro: "79 000 сум",   premium: "149 000 сум" },
  en: { free: "$0",       pro: "$9",           premium: "$19" },
};

import { useLocale } from "@/lib/i18n/provider";

export function Pricing() {
  const t = useT();
  const { locale } = useLocale();
  const prices = LOCALIZED_PRICES[locale];

  return (
    <section id="pricing" className="border-b border-border/60 bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.pricing.title}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t.pricing.subtitle}</p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PLAN_META.map((p) => {
            const plan = t.pricing.plans[p.key];
            const cadence = p.cadenceKey === "forever" ? t.pricing.forever : t.pricing.perMonth;
            return (
              <div
                key={p.key}
                className={`relative rounded-3xl border p-7 ${
                  p.highlight ? "border-brand bg-background shadow-2xl shadow-red-500/10" : "border-border bg-background"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-medium text-brand-foreground">
                    {t.pricing.mostPopular}
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight">{prices[p.key]}</span>
                  <span className="text-sm text-muted-foreground">/ {cadence}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>

                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={p.href}
                  className={`mt-7 inline-flex h-11 w-full items-center justify-center rounded-full px-5 text-sm font-medium transition ${
                    p.highlight ? "bg-brand text-brand-foreground hover:opacity-90" : "border border-border bg-background hover:bg-muted"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
