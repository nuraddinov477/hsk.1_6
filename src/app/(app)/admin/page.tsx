"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, Users as UsersIcon, ToggleLeft, Upload, History, ArrowRight } from "lucide-react";
import { RESOURCES } from "./resources";

// Admin home — Django-style model overview. One card per resource with a live
// row count, plus quick links to the system sections (stats / flags / import
// / logs / users).

type Counts = Record<string, number>;

const SYSTEM_LINKS = [
  { href: "/admin/stats",  label: "Statistika",      icon: BarChart3 },
  { href: "/admin/users",  label: "Foydalanuvchilar", icon: UsersIcon },
  { href: "/admin/flags",  label: "Funksiya sozlamalari", icon: ToggleLeft },
  { href: "/admin/import", label: "Ko'p kontent yuklash", icon: Upload },
  { href: "/admin/logs",   label: "Faoliyat tarixi", icon: History },
];

export default function AdminHome() {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    fetch("/api/admin/counts").then((r) => r.ok ? r.json() : null).then(setCounts).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin paneli</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kontent qo&apos;shish, foydalanuvchilarni boshqarish, statistika ko&apos;rish.
        </p>
      </header>

      {/* System shortcuts */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tizim</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SYSTEM_LINKS.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.href}
                href={s.href}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-background p-4 transition hover:border-brand/40 hover:shadow-sm"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-medium">{s.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-brand" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Resources */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Kontent modellari</h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Model</th>
                <th className="w-24 px-4 py-3 text-right">Yozuvlar</th>
                <th className="w-32 px-4 py-3 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {RESOURCES.map((r) => {
                const Icon = r.icon;
                const count = counts ? counts[r.name] : null;
                return (
                  <tr key={r.name} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/admin/${r.name}`} className="inline-flex items-center gap-2.5 font-medium hover:text-brand">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {r.label}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {count === null ? <span className="text-muted-foreground">…</span> : count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/${r.name}/new`} className="text-xs font-medium text-brand hover:underline">
                        + Yangi
                      </Link>
                      <span className="mx-2 text-muted-foreground">·</span>
                      <Link href={`/admin/${r.name}`} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                        Ko&apos;rish
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
