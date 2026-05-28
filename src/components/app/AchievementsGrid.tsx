"use client";

import { Award } from "lucide-react";

type Achievement = {
  key: string; title: string; emoji: string;
  unlocked: boolean;
  progress?: { now: number; goal: number };
};

export function AchievementsGrid({ items }: { items: Achievement[] }) {
  const unlocked = items.filter((a) => a.unlocked).length;
  return (
    <section className="rounded-2xl border border-border bg-background p-4 sm:p-5">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Award className="h-4 w-4 text-yellow-500" /> Yutuqlar
        </h2>
        <span className="text-xs text-muted-foreground tabular-nums">{unlocked} / {items.length}</span>
      </header>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((a) => (
          <div
            key={a.key}
            title={a.progress ? `${a.progress.now} / ${a.progress.goal}` : ""}
            className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition ${
              a.unlocked
                ? "border-brand/40 bg-brand/5"
                : "border-border bg-muted/30 grayscale opacity-60"
            }`}
          >
            <span className="text-2xl leading-none">{a.emoji}</span>
            <span className="text-[10px] font-medium leading-tight">{a.title}</span>
            {!a.unlocked && a.progress && (
              <span className="text-[9px] tabular-nums text-muted-foreground">
                {a.progress.now}/{a.progress.goal}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
