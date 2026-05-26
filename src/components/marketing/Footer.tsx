"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/provider";

export function Footer() {
  const t = useT();
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-brand-foreground font-cn text-lg font-bold">
              汉
            </span>
            <span className="text-lg font-semibold">HSKGo</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            {t.footer.tagline}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold">{t.footer.product}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><a href="#modules" className="hover:text-foreground">{t.nav.modules}</a></li>
            <li><a href="#levels" className="hover:text-foreground">{t.nav.levels}</a></li>
            <li><a href="#pricing" className="hover:text-foreground">{t.nav.pricing}</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">{t.footer.about}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/legal/privacy" className="hover:text-foreground">{t.footer.privacy}</Link></li>
            <li><Link href="/legal/terms" className="hover:text-foreground">{t.footer.terms}</Link></li>
            <li><a href="mailto:hello@hskgo.uz" className="hover:text-foreground">{t.footer.contact}</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">{t.footer.app}</h4>
          <p className="mt-3 text-sm text-muted-foreground">{t.footer.appText}</p>
        </div>
      </div>

      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} HSKGo. {t.footer.rights}
      </div>
    </footer>
  );
}
