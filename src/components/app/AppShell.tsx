"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home, BookOpenText, Layers, Headphones, FileText, PenLine,
  Mic, GraduationCap, LogOut, Flame, Sparkles, Menu, X, Shield,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n/provider";
import { getProgress, pullFromServer, type Progress } from "@/lib/learn-store";
import { ContentProvider } from "@/lib/content/provider";
import { LocaleSwitcher } from "@/components/marketing/LocaleSwitcher";

const NAV_ICONS = {
  dashboard: Home,
  characters: Layers,
  vocabulary: BookOpenText,
  listening: Headphones,
  reading: FileText,
  writing: PenLine,
  speaking: Mic,
  exam: GraduationCap,
} as const;

const NAV_HREF = {
  dashboard: "/dashboard",
  characters: "/learn/characters",
  vocabulary: "/learn/vocabulary",
  listening: "/learn/listening",
  reading: "/learn/reading",
  writing: "/learn/writing",
  speaking: "/learn/speaking",
  exam: "/learn/exam",
} as const;

const NAV_KEYS = ["dashboard", "characters", "vocabulary", "listening", "reading", "writing", "speaking", "exam"] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const t = useT();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    function refresh() { setProgress(getProgress()); }
    refresh();
    window.addEventListener("hskgo:progress", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("hskgo:progress", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // On login, pull progress + SRS from the DB and merge into localStorage.
  useEffect(() => {
    if (user) void pullFromServer();
  }, [user]);

  // Show the Admin link only to admins.
  useEffect(() => {
    if (!user) return;
    fetch("/api/admin/whoami").then((r) => r.json()).then((d) => setIsAdmin(!!d.admin)).catch(() => {});
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        ...
      </div>
    );
  }

  const xp = progress?.xp ?? 0;
  const streak = progress?.streak ?? 0;

  function handleLogout() {
    logout();
    router.replace("/");
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-brand-foreground font-cn text-lg font-bold">汉</span>
              <span className="text-lg font-semibold tracking-tight">HSKGo</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium sm:flex">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              <span>{xp}</span>
              <span className="text-xs text-muted-foreground">{t.app.common.points}</span>
            </div>
            <div className="hidden items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium sm:flex">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              <span>{streak}</span>
              <span className="text-xs text-muted-foreground">{t.app.dashboard.streakDays}</span>
            </div>
            <LocaleSwitcher />
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium hover:bg-muted"
            >
              <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t.app.sidebar.logout}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <aside
          className={`${mobileOpen ? "block" : "hidden"} fixed inset-y-16 left-0 z-20 w-64 overflow-y-auto border-r border-border bg-background p-4 md:static md:block md:w-56 md:flex-shrink-0 md:border-0 md:p-0 md:pr-6`}
        >
          <nav className="space-y-1">
            {NAV_KEYS.map((key) => {
              const Icon = NAV_ICONS[key];
              const href = NAV_HREF[key];
              const active = pathname === href || (key !== "dashboard" && pathname?.startsWith(href));
              return (
                <Link
                  key={key}
                  href={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-brand/10 text-brand"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.app.sidebar[key]}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  pathname === "/admin"
                    ? "bg-brand/10 text-brand"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Shield className="h-4 w-4" /> Admin
              </Link>
            )}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <ContentProvider>{children}</ContentProvider>
        </main>
      </div>
    </div>
  );
}
