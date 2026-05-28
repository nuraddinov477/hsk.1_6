"use client";

import { useEffect, useState } from "react";
import { Trophy, Flame, Crown, Medal } from "lucide-react";

type Row = { user_id: string; display_name: string; xp: number; streak: number; vocab_learned?: number };
type Data = {
  alltime: Row[];
  week: Row[];
  me: { userId: string; alltimeRank: number | null; weekRank: number | null; alltimeXp: number; weekXp: number } | null;
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown   className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal   className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal   className="h-5 w-5 text-orange-600" />;
  return <span className="inline-flex h-5 w-5 items-center justify-center text-xs font-bold tabular-nums text-muted-foreground">{rank}</span>;
}

export default function LeaderboardPage() {
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<"week" | "alltime">("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      const r = await fetch("/api/leaderboard");
      if (!alive) return;
      if (r.ok) setData(await r.json());
      setLoading(false);
    }
    void load();
    const t = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const rows = tab === "week" ? data?.week ?? [] : data?.alltime ?? [];
  const myRank = tab === "week" ? data?.me?.weekRank : data?.me?.alltimeRank;
  const myXp   = tab === "week" ? data?.me?.weekXp   : data?.me?.alltimeXp;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <Trophy className="h-7 w-7 text-yellow-500" /> Reyting
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Top o&apos;quvchilar. XP to&apos;plang va birinchi o&apos;ringa chiqing.
          </p>
        </div>
        {data?.me && myRank && (
          <div className="rounded-xl border border-border bg-background px-4 py-2 text-right">
            <div className="text-xs text-muted-foreground">Sizning o&apos;rningiz</div>
            <div className="text-lg font-bold tabular-nums">#{myRank} · {myXp} XP</div>
          </div>
        )}
      </header>

      <div className="flex gap-1.5">
        <button
          onClick={() => setTab("week")}
          className={`h-9 rounded-full px-4 text-sm font-medium transition ${
            tab === "week" ? "bg-brand text-brand-foreground" : "border border-border bg-background text-muted-foreground"
          }`}
        >
          Bu hafta
        </button>
        <button
          onClick={() => setTab("alltime")}
          className={`h-9 rounded-full px-4 text-sm font-medium transition ${
            tab === "alltime" ? "bg-brand text-brand-foreground" : "border border-border bg-background text-muted-foreground"
          }`}
        >
          Hammavaqt
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Hali ma&apos;lumot yo&apos;q. Birinchi bo&apos;ling — XP yig&apos;ishni boshlang!</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-background">
          {rows.map((r, i) => {
            const rank = i + 1;
            const isMe = r.user_id === data?.me?.userId;
            return (
              <li key={r.user_id} className={`flex items-center justify-between gap-3 px-4 py-3 ${isMe ? "bg-brand/5" : ""}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <RankBadge rank={rank} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {r.display_name}
                      {isMe && <span className="ml-2 rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand">SIZ</span>}
                    </div>
                    {r.vocab_learned !== undefined && (
                      <div className="text-xs text-muted-foreground">{r.vocab_learned} ta so&apos;z o&apos;rganildi</div>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-1 text-orange-500">
                    <Flame className="h-3.5 w-3.5" /> {r.streak}
                  </span>
                  <span className="font-bold tabular-nums">{r.xp} XP</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
