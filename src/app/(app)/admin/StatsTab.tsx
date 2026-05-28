"use client";

import { useEffect, useState } from "react";
import { Users, Activity, Zap, GraduationCap, ShieldX, Library } from "lucide-react";

type Stats = {
  totals: {
    users: number; blockedUsers: number; adminUsers: number;
    sessionsToday: number; activeNow: number; examsTaken: number;
    vocabulary: number; characters: number; passages: number; examQuestions: number;
  };
  dau: { date: string; users: number }[];
  recentEvents: { type: string; payload: unknown; createdAt: string; email: string }[];
  topUsers: { email: string; xp: number; streak: number; vocab_learned: number; characters_learned: number }[];
};

const EVENT_LABELS: Record<string, string> = {
  vocab_learned:     "so'z o'rganildi",
  character_learned: "ieroglif o'rganildi",
  lesson_completed:  "dars tugatildi",
  exam_submitted:    "imtihon topshirildi",
  xp_gained:         "XP olindi",
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)     return "hozir";
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)} daq oldin`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} soat oldin`;
  return new Date(iso).toLocaleDateString();
}

function Kpi({ icon: Icon, label, value, accent }: { icon: typeof Users; label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${accent ?? "bg-brand/10 text-brand"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export function StatsTab() {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      const r = await fetch("/api/admin/stats");
      if (!alive) return;
      if (r.ok) setData(await r.json());
      setLoading(false);
    }
    void load();
    const t = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>;
  if (!data)   return <p className="text-sm text-red-600">Statistika yuklanmadi.</p>;

  const maxDau = Math.max(1, ...data.dau.map((d) => d.users));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi icon={Users}          label="Foydalanuvchilar" value={data.totals.users} />
        <Kpi icon={Activity}       label="Hozir onlayn"     value={data.totals.activeNow}     accent="bg-green-500/10 text-green-600" />
        <Kpi icon={Zap}            label="Bugungi sessiya"  value={data.totals.sessionsToday} />
        <Kpi icon={GraduationCap}  label="Imtihonlar"       value={data.totals.examsTaken} />
        <Kpi icon={ShieldX}        label="Bloklangan"       value={data.totals.blockedUsers} accent="bg-red-500/10 text-red-600" />
        <Kpi icon={Library}        label="Lug'at + ieroglif" value={data.totals.vocabulary + data.totals.characters} />
      </div>

      {/* DAU bar chart — pure CSS, 30 days */}
      <div className="rounded-2xl border border-border bg-background p-4">
        <h2 className="mb-3 text-sm font-semibold">So'nggi 30 kunlik faollik (DAU)</h2>
        <div className="flex h-24 items-end gap-[3px]">
          {data.dau.map((d) => (
            <div key={d.date} className="group relative flex-1">
              <div
                className="w-full rounded-t bg-brand/30 hover:bg-brand transition"
                style={{ height: `${(d.users / maxDau) * 100}%` }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[10px] text-background group-hover:block">
                {d.date}: {d.users}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{data.dau[0]?.date}</span>
          <span>{data.dau[data.dau.length - 1]?.date}</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent activity */}
        <div className="rounded-2xl border border-border bg-background p-4">
          <h2 className="mb-3 text-sm font-semibold">So'nggi faollik</h2>
          {data.recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hali hech narsa qilinmagan.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto pr-1 text-sm">
              {data.recentEvents.map((e, i) => (
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

        {/* Top users */}
        <div className="rounded-2xl border border-border bg-background p-4">
          <h2 className="mb-3 text-sm font-semibold">Top foydalanuvchilar (XP)</h2>
          {data.topUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hali XP olgan foydalanuvchi yo'q.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {data.topUsers.map((u, i) => (
                <li key={u.email} className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold tabular-nums">
                      {i + 1}
                    </span>
                    <span className="truncate">{u.email}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {u.xp} XP · 🔥 {u.streak} · 📚 {u.vocab_learned}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
