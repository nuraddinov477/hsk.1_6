"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home, BarChart3, Users as UsersIcon, ToggleLeft, Upload, History, ShieldAlert, ChevronRight,
} from "lucide-react";
import { RESOURCES } from "./resources";
import { AdminSearch } from "./AdminSearch";

// Django-style admin chrome. Left sidebar groups: System (stats/flags/import/
// logs), Users, Content (one entry per Resource). The "Home" link returns to
// the model overview. We keep the global AppShell sidebar visible too — the
// app sidebar is for end-user navigation; this admin sidebar is for operator
// navigation within the admin section.

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [admin, setAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/whoami").then((r) => r.json()).then((d) => setAdmin(!!d.admin)).catch(() => setAdmin(false));
  }, []);

  if (admin === null) {
    return <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>;
  }
  if (!admin) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-background p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-orange-500" />
        <h1 className="mt-4 text-lg font-semibold">Kirish taqiqlangan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bu bo&apos;lim faqat administratorlar uchun.
        </p>
      </div>
    );
  }

  const SYSTEM: NavItem[] = [
    { href: "/admin",        label: "Bosh sahifa", icon: Home },
    { href: "/admin/stats",  label: "Statistika",  icon: BarChart3 },
    { href: "/admin/flags",  label: "Sozlamalar",  icon: ToggleLeft },
    { href: "/admin/import", label: "Ko'p yuklash", icon: Upload },
    { href: "/admin/logs",   label: "Faoliyat tarixi", icon: History },
  ];
  const USERS: NavItem[] = [
    { href: "/admin/users",  label: "Foydalanuvchilar", icon: UsersIcon },
  ];

  return (
    <div className="space-y-5">
      {/* Admin command bar */}
      <div className="flex items-center justify-between gap-3">
        <AdminSearch />
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Admin sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="space-y-5">
            <NavGroup title="Tizim" items={SYSTEM} pathname={pathname ?? ""} />
            <NavGroup title="Hisoblar" items={USERS} pathname={pathname ?? ""} />
            <NavGroup
              title="Kontent"
              items={RESOURCES.map((r) => ({
                href: `/admin/${r.name}`, label: r.label, icon: r.icon,
              }))}
              pathname={pathname ?? ""}
            />
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

function NavGroup({ title, items, pathname }: {
  title: string; items: NavItem[]; pathname: string;
}) {
  return (
    <div>
      <h3 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <nav className="space-y-0.5">
        {items.map((it) => {
          // Match exact for /admin, prefix for others (so /admin/lessons/new
          // still highlights "Darslar").
          const active = it.href === "/admin" ? pathname === "/admin" : pathname.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-brand/10 font-medium text-brand"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {it.label}
              {active && <ChevronRight className="ml-auto h-3.5 w-3.5" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
