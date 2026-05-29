"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/provider";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  const t = useT();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-brand-foreground font-cn text-lg font-bold">
            汉
          </span>
          <span className="text-lg font-semibold tracking-tight">HSKGo</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          <a href="#modules" className="hover:text-foreground">{t.nav.modules}</a>
          <a href="#levels" className="hover:text-foreground">{t.nav.levels}</a>
          <a href="#demo" className="hover:text-foreground">{t.nav.try}</a>
          <a href="#pricing" className="hover:text-foreground">{t.nav.pricing}</a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LocaleSwitcher />
          <Link
            href="/login"
            className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block"
          >
            {t.nav.login}
          </Link>
          <Link
            href="/start"
            className="inline-flex h-9 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
          >
            {t.nav.startFree}
          </Link>
        </div>
      </div>
    </header>
  );
}
