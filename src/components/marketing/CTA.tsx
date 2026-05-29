"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n/provider";

export function CTA() {
  const t = useT();
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-foreground text-background">
          <div
            aria-hidden
            className="absolute -right-10 -top-10 font-cn text-[16rem] font-bold leading-none text-background/5"
          >
            学
          </div>
          <div className="relative p-10 md:p-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t.cta.title}
            </h2>
            <p className="mt-4 max-w-xl text-lg text-background/70">
              {t.cta.subtitle}
            </p>
            <Link
              href="/start"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 text-base font-medium text-brand-foreground transition hover:opacity-90"
            >
              {t.cta.button}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
