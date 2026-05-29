"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { HanziDemo } from "@/components/hanzi/HanziDemo";
import { useT } from "@/lib/i18n/provider";

export function Hero() {
  const t = useT();
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,theme(colors.red.100/.6),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,theme(colors.red.950/.4),transparent_60%)]"
      />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28">
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            {t.hero.badge}
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {t.hero.title1}<br />
            <span className="text-brand">{t.hero.title2}</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            {t.hero.subtitle}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/start"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 text-base font-medium text-brand-foreground transition hover:opacity-90"
            >
              {t.hero.startFree}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#demo"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background px-6 text-base font-medium hover:bg-muted"
            >
              {t.hero.tryDemo}
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <div><span className="font-semibold text-foreground">11 092</span> {t.hero.words}</div>
            <div><span className="font-semibold text-foreground">3 000+</span> {t.hero.chars}</div>
            <div><span className="font-semibold text-foreground">9</span> {t.hero.levels}</div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <HanziDemo />
        </div>
      </div>
    </section>
  );
}
