"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RotateCcw, Sparkles, Flame, BookOpenText, Layers, Trophy, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n/provider";
import { getProgress, getStudyLevel, resetProgress, type LevelChoice, type Progress } from "@/lib/learn-store";
import { DailyMissions } from "@/components/app/DailyMissions";
import { ActivityHeatmap } from "@/components/app/ActivityHeatmap";
import { RankWidget } from "@/components/app/RankWidget";
import { HskLevelProgress } from "@/components/app/HskLevelProgress";
import { AchievementsGrid } from "@/components/app/AchievementsGrid";
import { ContinueCard } from "@/components/app/ContinueCard";
import { PlanWidget } from "@/components/app/PlanWidget";
import { NextLessonCard } from "@/components/app/NextLessonCard";

type DashData = {
  heatmap: { date: string; xp: number }[];
  weekly: { rank: number | null; xp: number; delta: number };
  alltimeRank: number | null;
  minutesThisWeek: number;
  achievements: {
    key: string; title: string; emoji: string; unlocked: boolean;
    progress?: { now: number; goal: number };
  }[];
};

export default function DashboardPage() {
  const { user } = useAuth();
  const t = useT();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [level, setLevel] = useState<LevelChoice>("all");
  const [data, setData] = useState<DashData | null>(null);

  useEffect(() => {
    function refresh() { setProgress(getProgress()); setLevel(getStudyLevel()); }
    refresh();
    window.addEventListener("hskgo:progress", refresh);
    window.addEventListener("hskgo:level", refresh);
    return () => {
      window.removeEventListener("hskgo:progress", refresh);
      window.removeEventListener("hskgo:level", refresh);
    };
  }, []);

  // Fetch aggregated server-side stats. Re-poll periodically.
  useEffect(() => {
    let alive = true;
    async function load() {
      const r = await fetch("/api/dashboard");
      if (!alive || !r.ok) return;
      setData(await r.json());
    }
    void load();
    const id = setInterval(load, 60_000);
    const onProgress = () => void load();
    window.addEventListener("hskgo:progress", onProgress);
    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener("hskgo:progress", onProgress);
    };
  }, []);

  const xp = progress?.xp ?? 0;
  const streak = progress?.streak ?? 0;
  const charsLearned = progress?.charactersLearned.length ?? 0;
  const vocabLearned = progress?.vocabLearned.length ?? 0;
  const minutes = data?.minutesThisWeek ?? 0;
  const weekly = data?.weekly;

  const hour = new Date().getHours();
  const greet = hour < 12 ? t.app.dashboard.goodMorning : hour < 18 ? t.app.dashboard.goodAfternoon : t.app.dashboard.goodEvening;

  function onReset() {
    if (confirm(t.app.dashboard.resetConfirm)) resetProgress();
  }

  return (
    <div className="space-y-6">
      {/* ─── Hero ─── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {greet}, {user?.name ?? "—"}!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.app.dashboard.dailyMissionDesc}</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          <RotateCcw className="h-3.5 w-3.5" /> {t.app.dashboard.resetData}
        </button>
      </div>

      {/* ─── KPI strip — 6 stats ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat icon={Sparkles} label={t.app.dashboard.xp}       value={xp}            accent="brand" />
        <Stat icon={Flame}    label={t.app.dashboard.streakDays} value={streak}      accent="orange" />
        <Stat icon={BookOpenText} label={t.app.dashboard.vocabLearned}      value={vocabLearned} />
        <Stat icon={Layers}   label={t.app.dashboard.charactersLearned}     value={charsLearned} />
        <Stat icon={Clock}    label="Bu hafta vaqt" value={`${minutes} daq`} />
        <Stat icon={Trophy}   label="Bu hafta o'rin" value={weekly?.rank ? `#${weekly.rank}` : "—"} accent="brand" />
      </div>

      {/* ─── Personalised plan from onboarding wizard ─── */}
      <PlanWidget vocabLearnedCount={vocabLearned} />

      {/* ─── Next lesson from curriculum (hidden if no content yet) ─── */}
      <NextLessonCard />

      {/* ─── Smart "continue" card ─── */}
      <ContinueCard vocabLearned={progress?.vocabLearned ?? []} level={level} />

      {/* ─── Heatmap + Rank ─── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {data ? <ActivityHeatmap data={data.heatmap} /> : <Skeleton h={140} />}
        </div>
        <div>
          {weekly ? (
            <RankWidget
              weekRank={weekly.rank}
              weekXp={weekly.xp}
              delta={weekly.delta}
              alltimeRank={data?.alltimeRank ?? null}
            />
          ) : <Skeleton h={140} />}
        </div>
      </div>

      {/* ─── Per-HSK breakdown + achievements ─── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <HskLevelProgress vocabLearned={progress?.vocabLearned ?? []} />
        {data ? <AchievementsGrid items={data.achievements} /> : <Skeleton h={200} />}
      </div>

      {/* ─── Daily missions ─── */}
      <DailyMissions />

      {/* ─── Modules grid (compact) ─── */}
      <div>
        <h2 className="text-lg font-semibold">{t.app.dashboard.modules}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ModuleCard href="/learn/characters" hanzi="汉字" title={t.app.sidebar.characters} desc={t.modules.items.characters.description} />
          <ModuleCard href="/learn/vocabulary" hanzi="词汇" title={t.app.sidebar.vocabulary} desc={t.modules.items.vocabulary.description} />
          <ModuleCard href="/learn/listening" hanzi="听力" title={t.app.sidebar.listening} desc={t.modules.items.listening.description} />
          <ModuleCard href="/learn/reading" hanzi="阅读" title={t.app.sidebar.reading} desc={t.modules.items.reading.description} />
          <ModuleCard href="/learn/writing" hanzi="写作" title={t.app.sidebar.writing} desc={t.modules.items.writing.description} />
          <ModuleCard href="/learn/speaking" hanzi="口语" title={t.app.sidebar.speaking} desc={t.modules.items.speaking.description} />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: {
  icon: typeof Sparkles; label: string; value: string | number; accent?: "brand" | "orange";
}) {
  const colour =
    accent === "orange" ? "bg-orange-500/10 text-orange-500" :
    accent === "brand"  ? "bg-brand/10 text-brand" :
                          "bg-muted text-muted-foreground";
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${colour}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function ModuleCard({ href, hanzi, title, desc }: { href: string; hanzi: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-border bg-background p-5 transition hover:border-brand/40 hover:shadow-md"
    >
      <div aria-hidden className="absolute -right-2 -top-2 font-cn text-5xl font-bold text-muted opacity-50 transition group-hover:text-brand/20">
        {hanzi}
      </div>
      <div className="relative">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">{desc}</p>
      </div>
    </Link>
  );
}

function Skeleton({ h }: { h: number }) {
  return <div className="animate-pulse rounded-2xl border border-border bg-muted/30" style={{ height: h }} />;
}
