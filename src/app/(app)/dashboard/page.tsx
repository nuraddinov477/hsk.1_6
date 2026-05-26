"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n/provider";
import { getProgress, resetProgress, type Progress } from "@/lib/learn-store";
import { CHARACTERS, VOCAB } from "@/lib/learn-data";

export default function DashboardPage() {
  const { user } = useAuth();
  const t = useT();
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    function refresh() { setProgress(getProgress()); }
    refresh();
    window.addEventListener("hskgo:progress", refresh);
    return () => window.removeEventListener("hskgo:progress", refresh);
  }, []);

  const xp = progress?.xp ?? 0;
  const streak = progress?.streak ?? 0;
  const charsLearned = progress?.charactersLearned.length ?? 0;
  const vocabLearned = progress?.vocabLearned.length ?? 0;

  const charsTotal = CHARACTERS.length;
  const vocabTotal = VOCAB.length;
  const charsPct = Math.round((charsLearned / charsTotal) * 100);
  const vocabPct = Math.round((vocabLearned / vocabTotal) * 100);

  const hour = new Date().getHours();
  const greet = hour < 12 ? t.app.dashboard.goodMorning : hour < 18 ? t.app.dashboard.goodAfternoon : t.app.dashboard.goodEvening;

  function onReset() {
    if (confirm(t.app.dashboard.resetConfirm)) resetProgress();
  }

  return (
    <div className="space-y-6">
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t.app.dashboard.xp} value={xp} />
        <Stat label={t.app.dashboard.streakDays} value={streak} accent="orange" />
        <Stat label={t.app.dashboard.charactersLearned} value={`${charsLearned} / ${charsTotal}`} />
        <Stat label={t.app.dashboard.vocabLearned} value={`${vocabLearned} / ${vocabTotal}`} />
      </div>

      <div className="rounded-2xl border border-border bg-background p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t.app.dashboard.levelProgress}</h2>
          <span className="text-xs text-muted-foreground">{charsPct}% · {vocabPct}%</span>
        </div>
        <div className="mt-4 space-y-3">
          <ProgressRow label={t.app.dashboard.charactersLearned} pct={charsPct} />
          <ProgressRow label={t.app.dashboard.vocabLearned} pct={vocabPct} />
        </div>
      </div>

      <div className="rounded-2xl border border-brand/40 bg-brand/5 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase text-brand">{t.app.dashboard.dailyMission}</div>
            <p className="mt-1 text-lg font-semibold">{t.app.dashboard.dailyMissionDesc}</p>
          </div>
          <Link
            href="/learn/vocabulary"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-brand-foreground hover:opacity-90"
          >
            {t.app.dashboard.continueLearning}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

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

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: "orange" }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent === "orange" ? "text-orange-500" : ""}`}>{value}</div>
    </div>
  );
}

function ProgressRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>
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
