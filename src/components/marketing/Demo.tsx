"use client";

import { HanziDemo } from "@/components/hanzi/HanziDemo";
import { Check } from "lucide-react";
import { useT } from "@/lib/i18n/provider";

export function Demo() {
  const t = useT();
  return (
    <section id="demo" className="border-b border-border/60 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 md:grid-cols-2 md:items-center">
        <div className="flex justify-center">
          <HanziDemo />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t.demo.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t.demo.subtitle}</p>
          <ul className="mt-6 space-y-3">
            {t.demo.points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-muted-foreground">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
