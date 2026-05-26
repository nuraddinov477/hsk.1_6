"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/provider";

/** Renders a localized legal document (terms or privacy) in a simple article shell. */
export function LegalArticle({ doc }: { doc: "terms" | "privacy" }) {
  const t = useT();
  const l = t.legal;
  const d = l[doc];

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <Link href="/" className="mb-8 inline-flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-brand-foreground font-cn text-lg font-bold">
          汉
        </span>
        <span className="text-lg font-semibold tracking-tight">HSKGo</span>
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">{d.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{l.updated}</p>

      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        {d.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <Link href="/" className="mt-10 inline-block text-sm font-medium text-brand hover:underline">
        ← {l.backHome}
      </Link>
    </main>
  );
}
