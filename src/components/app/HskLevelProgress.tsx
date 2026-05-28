"use client";

import { useMemo } from "react";
import { useContent } from "@/lib/content/provider";

// Per-HSK-level vocab progress. Reads VOCAB from content provider so we can
// compute "learned / total" per level — instead of one giant percentage.
export function HskLevelProgress({ vocabLearned }: { vocabLearned: string[] }) {
  const { vocab } = useContent();
  const learnedSet = useMemo(() => new Set(vocabLearned), [vocabLearned]);

  const byLevel = useMemo(() => {
    const map: Record<number, { total: number; learned: number }> = {};
    for (const v of vocab) {
      const lvl = v.hskLevel;
      if (!map[lvl]) map[lvl] = { total: 0, learned: 0 };
      map[lvl].total++;
      if (learnedSet.has(v.id)) map[lvl].learned++;
    }
    return Object.entries(map).map(([level, v]) => ({
      level: Number(level), ...v,
    })).sort((a, b) => a.level - b.level);
  }, [vocab, learnedSet]);

  if (byLevel.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-background p-4 sm:p-5">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">HSK darajalari bo&apos;yicha</h2>
        <span className="text-xs text-muted-foreground">Lug&apos;at</span>
      </header>
      <div className="space-y-2">
        {byLevel.map((row) => {
          const pct = row.total > 0 ? Math.round((row.learned / row.total) * 100) : 0;
          return (
            <div key={row.level}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold tabular-nums">HSK {row.level}</span>
                <span className="text-muted-foreground tabular-nums">
                  {row.learned} / {row.total} · {pct}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-brand"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
