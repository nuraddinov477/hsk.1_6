"use client";

import { Flame } from "lucide-react";

// GitHub-style 30-day heatmap. Each cell is one day, colour intensity scales
// with XP earned that day. Hover (or tap) shows date + XP in a tooltip.
export function ActivityHeatmap({ data }: { data: { date: string; xp: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.xp));
  const total = data.reduce((s, d) => s + d.xp, 0);
  const activeDays = data.filter((d) => d.xp > 0).length;

  function shade(xp: number) {
    if (xp === 0) return "bg-muted";
    const t = xp / max;
    if (t < 0.25) return "bg-brand/20";
    if (t < 0.5)  return "bg-brand/40";
    if (t < 0.75) return "bg-brand/70";
    return "bg-brand";
  }

  return (
    <section className="rounded-2xl border border-border bg-background p-4 sm:p-5">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Flame className="h-4 w-4 text-orange-500" /> So&apos;nggi 30 kun
        </h2>
        <div className="text-xs text-muted-foreground tabular-nums">
          {activeDays} kun · {total} XP
        </div>
      </header>
      <div className="flex flex-wrap gap-1">
        {data.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.xp} XP`}
            className={`h-6 w-6 rounded ${shade(d.xp)} transition hover:ring-2 hover:ring-brand`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
        <span>kam</span>
        <div className="h-2.5 w-2.5 rounded bg-muted" />
        <div className="h-2.5 w-2.5 rounded bg-brand/20" />
        <div className="h-2.5 w-2.5 rounded bg-brand/40" />
        <div className="h-2.5 w-2.5 rounded bg-brand/70" />
        <div className="h-2.5 w-2.5 rounded bg-brand" />
        <span>ko&apos;p</span>
      </div>
    </section>
  );
}
