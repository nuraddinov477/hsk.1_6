"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BarChart3, Users as UsersIcon, ToggleLeft, Upload, History, ArrowRight,
  Activity, Zap, GraduationCap, ShieldX, AlertTriangle, Plus,
} from "lucide-react";
import { RESOURCES } from "./resources";
import { Sparkline } from "./charts";

// Admin home — at-a-glance dashboard. Live KPI strip + per-resource cards
// (count + 14-day sparkline + last added) + recent activity preview + alert
// callouts when something needs attention.

type Counts = Record<string, { count: number; spark: number[]; lastAdded: string | null }>;
type Stats = {
  totals: {
    users: number; blockedUsers: number; adminUsers: number;
    sessionsToday: number; activeNow: number; examsTaken: number;
  };
  recentEvents: { type: string; payload: unknown; createdAt: string; email: string }[];
};

const SYSTEM_LINKS = [
  { href: "/admin/stats",  label: "Statistika",          icon: BarChart3 },
  { href: "/admin/users",  label: "Foydalanuvchilar",    icon: UsersIcon },
  { href: "/admin/flags",  label: "Funksiya sozlamalari", icon: ToggleLeft },
  { href: "/admin/import", label: "Ko'p kontent yuklash", icon: Upload },
  { href: "/admin/logs",   label: "Faoliyat tarixi",     icon: History },
];

const EVENT_LABELS: Record<string, string> = {
  vocab_learned:     "so'z o'rganildi",
  character_learned: "ieroglif o'rganildi",
  lesson_completed:  "dars tugatildi",
  exam_submitted:    "imtihon topshirildi",
  xp_gained:         "XP olindi",
  session_start:     "sessiya boshlandi",
  session_end:       "sessiya tugadi",
};

function relativeTime(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)     return "hozir";
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)} daq oldin`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} soat oldin`;
  if (diff < 30 * 86_400_000) return `${Math.floor(diff / 86_400_000)} kun oldin`;
  return new Date(iso).toLocaleDateString();
}

function Kpi({ icon: Icon, label, value, accent }: { icon: typeof UsersIcon; label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${accent ?? "bg-brand/10 text-brand"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export default function AdminHome() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const [c, s] = await Promise.all([
        fetch("/api/admin/counts").then((r) => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/admin/stats").then((r) => r.ok ? r.json() : null).catch(() => null),
      ]);
      if (!alive) return;
      if (c) setCounts(c);
      if (s) setStats(s);
    }
    void load();
    const t = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const totals = stats?.totals;
  const blocked = totals?.blockedUsers ?? 0;
  const showAlert = blocked > 0;

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin paneli</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kontent qo&apos;shish, foydalanuvchilarni boshqarish, statistika ko&apos;rish.
          </p>
        </div>
        {stats && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            jonli · 30 s&apos;da yangilanadi
          </span>
        )}
      </header>

      {/* ── Alerts callout ───────────────────────────────────────────── */}
      {showAlert && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-600">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Diqqat talab qiladi</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              <b>{blocked}</b> ta foydalanuvchi bloklangan.{" "}
              <Link href="/admin/users" className="text-brand hover:underline">Ko&apos;rish →</Link>
            </p>
          </div>
        </div>
      )}

      {/* ── KPI strip ────────────────────────────────────────────────── */}
      {totals && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Kpi icon={UsersIcon}     label="Foydalanuvchilar" value={totals.users} />
          <Kpi icon={Activity}      label="Hozir onlayn"     value={totals.activeNow}     accent="bg-green-500/10 text-green-600" />
          <Kpi icon={Zap}           label="Bugungi sessiya"  value={totals.sessionsToday} />
          <Kpi icon={GraduationCap} label="Imtihonlar"       value={totals.examsTaken} />
          <Kpi icon={ShieldX}       label="Bloklangan"       value={totals.blockedUsers}  accent={blocked > 0 ? "bg-red-500/10 text-red-600" : undefined} />
          <Kpi icon={UsersIcon}     label="Adminlar"         value={totals.adminUsers}    accent="bg-brand/10 text-brand" />
        </div>
      )}

      {/* ── System shortcuts ─────────────────────────────────────────── */}
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

      {/* ── Resource cards with sparkline ────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kontent modellari</h2>
          <span className="text-[10px] text-muted-foreground">14 kunlik o&apos;sish</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RESOURCES.map((r) => {
            const Icon = r.icon;
            const info = counts?.[r.name];
            const recent = info?.spark.slice(-7).reduce((s, n) => s + n, 0) ?? 0;
            return (
              <div key={r.name} className="group rounded-2xl border border-border bg-background p-4 transition hover:border-brand/40 hover:shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/admin/${r.name}`} className="flex items-center gap-2 font-medium hover:text-brand">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {r.label}
                  </Link>
                  <Link
                    href={`/admin/${r.name}/new`}
                    className="inline-flex h-7 items-center gap-1 rounded-full bg-brand/10 px-2.5 text-xs font-medium text-brand hover:bg-brand/20"
                  >
                    <Plus className="h-3 w-3" /> Yangi
                  </Link>
                </div>

                <div className="mt-3 flex items-end justify-between gap-2">
                  <div>
                    <div className="text-2xl font-bold tabular-nums">
                      {info ? info.count.toLocaleString() : <span className="text-muted-foreground">…</span>}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      yozuvlar · {recent > 0 ? <span className="text-green-600">+{recent} hafta</span> : "yangi yo'q"}
                    </div>
                  </div>
                  {info && info.spark.some((v) => v > 0) && (
                    <Sparkline data={info.spark} />
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                  <span>oxirgi: {relativeTime(info?.lastAdded ?? null)}</span>
                  <Link href={`/admin/${r.name}`} className="text-brand hover:underline">Boshqarish →</Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Recent activity preview ──────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">So&apos;nggi faoliyat</h2>
          <Link href="/admin/logs" className="text-xs text-brand hover:underline">Hammasi →</Link>
        </div>
        <div className="rounded-2xl border border-border bg-background p-4">
          {!stats ? (
            <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>
          ) : stats.recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hali tadbirlar yo&apos;q.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {stats.recentEvents.slice(0, 8).map((e, i) => (
                <li key={i} className="flex items-center justify-between gap-3 border-b border-border/40 pb-1.5 last:border-0">
                  <span className="min-w-0 truncate">
                    <b className="font-medium">{e.email}</b>{" "}
                    <span className="text-muted-foreground">{EVENT_LABELS[e.type] ?? e.type}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(e.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
