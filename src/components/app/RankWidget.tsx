"use client";

import Link from "next/link";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";

// Compact weekly-rank card for the dashboard.
export function RankWidget({ weekRank, weekXp, delta, alltimeRank }: {
  weekRank: number | null; weekXp: number; delta: number; alltimeRank: number | null;
}) {
  const up = delta > 0;
  return (
    <Link
      href="/learn/leaderboard"
      className="group block rounded-2xl border border-border bg-background p-4 transition hover:border-brand/40 hover:shadow-md sm:p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <Trophy className="h-4 w-4 text-yellow-500" /> Reyting
        </h2>
        <span className="text-[10px] text-muted-foreground group-hover:text-brand">Ko&apos;rish →</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Bu hafta</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {weekRank ? `#${weekRank}` : "—"}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs">
            <span className="tabular-nums text-muted-foreground">{weekXp} XP</span>
            {delta !== 0 && (
              <span className={`inline-flex items-center gap-0.5 ${up ? "text-green-600" : "text-red-600"}`}>
                {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(delta)}
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Hammavaqt</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-muted-foreground">
            {alltimeRank ? `#${alltimeRank}` : "—"}
          </div>
        </div>
      </div>
    </Link>
  );
}
