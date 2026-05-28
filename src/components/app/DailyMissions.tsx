"use client";

import { useCallback, useEffect, useState } from "react";
import { Target, CheckCircle2, Gift, Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n/provider";
import { addXp } from "@/lib/learn-store";

type ML = { uz: string; ru: string; en: string };
type Mission = {
  id: string; templateId: string; kind: string; target: number;
  progress: number; xpReward: number; title: ML;
  completed: boolean; claimed: boolean;
};

export function DailyMissions() {
  const { locale } = useLocale();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/missions");
    if (r.ok) {
      const j = await r.json();
      setMissions(j.missions ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
    // Re-poll when progress events fire elsewhere in the app.
    const onProgress = () => void reload();
    window.addEventListener("hskgo:progress", onProgress);
    return () => window.removeEventListener("hskgo:progress", onProgress);
  }, [reload]);

  async function claim(m: Mission) {
    const r = await fetch("/api/missions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId: m.id }),
    });
    if (r.ok) {
      addXp(m.xpReward); // local mirror — server already added too
      void reload();
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-background p-4">
        <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>
      </div>
    );
  }
  if (missions.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-background p-4 sm:p-5">
      <header className="mb-3 flex items-center gap-2">
        <Target className="h-4 w-4 text-brand" />
        <h2 className="text-sm font-semibold">Bugungi vazifalar</h2>
      </header>
      <ul className="space-y-2">
        {missions.map((m) => {
          const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
          const titleText = m.title?.[locale as keyof ML] ?? m.title?.uz ?? m.kind;
          return (
            <li key={m.id} className="rounded-xl border border-border/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {m.completed ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                  ) : (
                    <Target className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className={`text-sm ${m.completed ? "text-muted-foreground line-through" : ""}`}>
                    {titleText}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground tabular-nums">{m.progress}/{m.target}</span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-brand/10 px-2 py-0.5 font-medium text-brand">
                    <Sparkles className="h-3 w-3" /> {m.xpReward}
                  </span>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${m.completed ? "bg-green-500" : "bg-brand"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {m.completed && !m.claimed && (
                <button
                  onClick={() => claim(m)}
                  className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-full bg-green-500 px-3 text-xs font-semibold text-white hover:bg-green-600"
                >
                  <Gift className="h-3 w-3" /> XP olish (+{m.xpReward})
                </button>
              )}
              {m.claimed && (
                <p className="mt-1 text-xs text-green-600">✓ Olindi</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
