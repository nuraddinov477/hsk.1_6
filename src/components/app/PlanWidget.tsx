"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Target, Calendar, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";

// Personal study plan widget. Reads the onboarding answers off /api/profile and
// shows the user how close they are to their HSK goal: target level, days left,
// daily word target, and on-track / behind status.
//
// If the user hasn't completed onboarding, we show a one-tap "Set up your plan"
// banner pointing at /start instead.

type Plan = {
  current_level: number | null;
  target_level: number | null;
  goal: string | null;
  target_days: number | null;
  plan_started_at: string | null;
  onboarded_at: string | null;
};

// Cumulative HSK word counts — must match the wizard's table.
const HSK_WORDS: Record<number, number> = { 0: 0, 1: 150, 2: 300, 3: 600, 4: 1200, 5: 2500, 6: 5000 };

const GOAL_LABEL: Record<string, string> = {
  work:    "Ish uchun",
  study:   "O'qish uchun",
  exam:    "HSK imtihoni",
  travel:  "Sayohat",
  culture: "Madaniyat",
  other:   "Shaxsiy",
};

export function PlanWidget({ vocabLearnedCount }: { vocabLearnedCount: number }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: { plan: Plan }) => { if (alive) setPlan(j.plan); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) {
    return <div className="h-32 animate-pulse rounded-2xl border border-border bg-muted/30" />;
  }

  // Not onboarded — invite them to the wizard.
  if (!plan || !plan.onboarded_at || !plan.target_level || !plan.target_days) {
    return (
      <Link
        href="/start"
        className="group flex items-center gap-4 rounded-2xl border border-brand/40 bg-gradient-to-br from-brand/10 to-yellow-500/10 p-5 transition hover:border-brand"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground">
          <Target className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold uppercase tracking-wide text-brand">Shaxsiy reja</div>
          <div className="text-base font-semibold">Maqsadingizni belgilang</div>
          <div className="text-xs text-muted-foreground">30 soniya — qaysi HSK darajaga, qancha vaqtda</div>
        </div>
        <ArrowRight className="h-5 w-5 text-brand transition group-hover:translate-x-0.5" />
      </Link>
    );
  }

  const startMs = plan.plan_started_at ? new Date(plan.plan_started_at).getTime() : Date.now();
  const elapsedDays = Math.max(0, Math.floor((Date.now() - startMs) / 86_400_000));
  const daysLeft = Math.max(0, plan.target_days - elapsedDays);

  const targetWords = HSK_WORDS[plan.target_level] ?? 0;
  const startWords = HSK_WORDS[plan.current_level ?? 0] ?? 0;
  const totalDelta = Math.max(1, targetWords - startWords);
  const learnedThisPlan = Math.max(0, vocabLearnedCount - startWords); // honest baseline
  const planProgress = Math.min(100, Math.round((learnedThisPlan / totalDelta) * 100));

  // Expected progress: time elapsed / total time, in %.
  const expectedProgress = Math.min(100, Math.round((elapsedDays / plan.target_days) * 100));
  const onTrack = planProgress >= expectedProgress - 5;

  const remainingWords = Math.max(0, totalDelta - learnedThisPlan);
  const wordsPerDay = daysLeft > 0 ? Math.max(1, Math.ceil(remainingWords / daysLeft)) : remainingWords;

  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Target className="h-4 w-4" />
          </span>
          <div>
            <div className="text-xs text-muted-foreground">Sizning rejangiz</div>
            <div className="text-sm font-semibold">
              HSK {plan.target_level} · {GOAL_LABEL[plan.goal ?? "other"] ?? "—"}
            </div>
          </div>
        </div>
        <Link href="/start" className="text-xs font-medium text-brand hover:underline">O&apos;zgartirish</Link>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-muted/40 p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Qoldi</div>
          <div className="mt-0.5 text-xl font-bold tabular-nums">{daysLeft}</div>
          <div className="text-[10px] text-muted-foreground">kun</div>
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Kunlik</div>
          <div className="mt-0.5 text-xl font-bold tabular-nums text-brand">{wordsPerDay}</div>
          <div className="text-[10px] text-muted-foreground">so&apos;z</div>
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Qolgan</div>
          <div className="mt-0.5 text-xl font-bold tabular-nums">{remainingWords}</div>
          <div className="text-[10px] text-muted-foreground">so&apos;z</div>
        </div>
      </div>

      {/* Progress bar (actual vs expected). The thin marker shows where you'd be
          if you stayed perfectly on schedule. */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Reja bo&apos;yicha</span>
          <span className="font-medium">{planProgress}% / {expectedProgress}%</span>
        </div>
        <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${planProgress}%` }} />
          <div className="absolute top-0 h-full w-0.5 bg-foreground/60" style={{ left: `${expectedProgress}%` }} aria-label="kutilgan" />
        </div>
        <div className={`mt-2 flex items-center gap-1.5 text-xs ${onTrack ? "text-green-700 dark:text-green-400" : "text-amber-600"}`}>
          {onTrack ? <TrendingUp className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
          {onTrack ? "Reja bo'yicha ketyapsiz" : "Biroz orqada — kunlik mashqni oshiring"}
        </div>
      </div>

      {daysLeft === 0 && (
        <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" /> Muddat tugadi — yangi reja{" "}
          <Link href="/start" className="font-medium text-brand hover:underline">qo&apos;ying</Link>.
        </div>
      )}
    </div>
  );
}
