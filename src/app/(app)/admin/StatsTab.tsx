"use client";

import { useEffect, useState } from "react";
import {
  Users, Activity, Zap, GraduationCap, ShieldX, Library,
  Flame, BookOpen, Languages, FileText,
} from "lucide-react";
import {
  ChartCard, AreaChart, BarsChart, HBarsChart, DonutChart, StackedBars, Funnel, PALETTE,
} from "./charts";

type Range = 7 | 30 | 90;

type Stats = {
  range: Range;
  totals: {
    users: number; blockedUsers: number; adminUsers: number;
    sessionsToday: number; activeNow: number; examsTaken: number;
    vocabulary: number; characters: number; passages: number; examQuestions: number;
    totalXp: number; totalVocab: number; totalChars: number; totalStreak: number;
  };
  dau: { date: string; users: number; sessions: number }[];
  sessionsByHour: number[];
  eventBreakdown: { type: string; count: number }[];
  currentLevelDist: { level: number; count: number }[];
  targetLevelDist: { level: number; count: number }[];
  goalDist: { goal: string; count: number }[];
  contentByLevel: { level: number; vocab: number; characters: number }[];
  funnel: { label: string; value: number }[];
  retention: { label: string; value: number }[];
  examPassRate: { level: number; total: number; passed: number; rate: number }[];
  recentEvents: { type: string; payload: unknown; createdAt: string; email: string }[];
  topUsers: { email: string; xp: number; streak: number; vocab_learned: number; characters_learned: number }[];
};

const EVENT_LABELS: Record<string, string> = {
  vocab_learned:     "So'z o'rganildi",
  character_learned: "Ieroglif o'rganildi",
  lesson_completed:  "Dars tugatildi",
  exam_submitted:    "Imtihon topshirildi",
  xp_gained:         "XP olindi",
  session_start:     "Sessiya boshlandi",
  session_end:       "Sessiya tugadi",
};

const GOAL_LABELS: Record<string, string> = {
  work:    "Ish",
  study:   "O'qish",
  exam:    "Imtihon",
  travel:  "Sayohat",
  culture: "Madaniyat",
  other:   "Boshqa",
  unset:   "Belgilanmagan",
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)     return "hozir";
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)} daq oldin`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} soat oldin`;
  return new Date(iso).toLocaleDateString();
}

function Kpi({
  icon: Icon, label, value, accent, hint,
}: { icon: typeof Users; label: string; value: number | string; accent?: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${accent ?? "bg-brand/10 text-brand"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="mt-0.5 text-sm font-medium text-muted-foreground">{label}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground/80">{hint}</div>}
    </div>
  );
}

export function StatsTab() {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>(30);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (document.hidden) return;          // skip polling when tab is hidden
      const r = await fetch(`/api/admin/stats?range=${range}`);
      if (!alive) return;
      if (r.ok) setData(await r.json());
      setLoading(false);
    }
    void load();
    const t = setInterval(load, 60_000);    // heavy query — once per minute
    const onVis = () => { if (!document.hidden) void load(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { alive = false; clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [range]);

  if (loading) return <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>;
  if (!data)   return <p className="text-sm text-red-600">Statistika yuklanmadi.</p>;

  const { totals } = data;

  // Prep chart series.
  const hourSeries  = data.sessionsByHour.map((v, h) => ({ label: `${h}:00`, value: v }));
  const eventSeries = data.eventBreakdown.map((e, i) => ({
    label: EVENT_LABELS[e.type] ?? e.type,
    value: e.count,
    color: PALETTE[i % PALETTE.length],
  }));
  const goalSeries = data.goalDist.map((g) => ({
    label: GOAL_LABELS[g.goal] ?? g.goal,
    value: g.count,
  }));
  const currentLvlSeries = data.currentLevelDist
    .filter((l) => l.count > 0)
    .map((l) => ({ label: l.level === 0 ? "Boshlovchi" : `HSK ${l.level}`, value: l.count }));
  const targetLvlSeries = data.targetLevelDist
    .filter((l) => l.count > 0)
    .map((l) => ({ label: `HSK ${l.level}`, value: l.count }));
  const contentLvlSeries = data.contentByLevel
    .filter((c) => c.vocab + c.characters > 0)
    .map((c) => ({
      label: c.level === 0 ? "—" : `HSK ${c.level}`,
      values: { vocab: c.vocab, characters: c.characters },
    }));
  const topUserSeries = data.topUsers.map((u) => ({
    label: u.email.split("@")[0],
    value: u.xp,
    hint: `🔥${u.streak} · 📚${u.vocab_learned}`,
  }));
  const contentPie = [
    { label: "Lug'at",      value: totals.vocabulary },
    { label: "Ierogliflar", value: totals.characters },
    { label: "Matnlar",     value: totals.passages },
    { label: "Imtihon savollari", value: totals.examQuestions },
  ];

  return (
    <div className="space-y-6">
      {/* ── Time-range selector ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Davr: <b className="text-foreground">{range} kun</b> · har 60 soniyada yangilanadi
        </p>
        <div className="inline-flex h-9 rounded-full border border-border bg-background p-0.5 text-sm font-medium">
          {([7, 30, 90] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3.5 rounded-full transition ${range === r ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {r} kun
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi icon={Users}         label="Foydalanuvchilar" value={totals.users} hint={`${totals.adminUsers} admin`} />
        <Kpi icon={Activity}      label="Hozir onlayn"     value={totals.activeNow} accent="bg-green-500/10 text-green-600" hint="oxirgi 5 daq" />
        <Kpi icon={Zap}           label="Bugungi sessiya"  value={totals.sessionsToday} />
        <Kpi icon={GraduationCap} label="Imtihonlar"       value={totals.examsTaken} />
        <Kpi icon={ShieldX}       label="Bloklangan"       value={totals.blockedUsers} accent="bg-red-500/10 text-red-600" />
        <Kpi icon={Library}       label="Kontent jami"     value={totals.vocabulary + totals.characters + totals.passages} />
      </div>

      {/* ── Aggregate progress KPIs ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi icon={Flame}     label="Umumiy XP"        value={totals.totalXp.toLocaleString()}    accent="bg-orange-500/10 text-orange-600" />
        <Kpi icon={BookOpen}  label="O'rganilgan so'z" value={totals.totalVocab.toLocaleString()} accent="bg-blue-500/10 text-blue-600" />
        <Kpi icon={Languages} label="O'rganilgan ieroglif" value={totals.totalChars.toLocaleString()} accent="bg-violet-500/10 text-violet-600" />
        <Kpi icon={FileText}  label="Streak yig'indisi" value={totals.totalStreak.toLocaleString()} accent="bg-green-500/10 text-green-600" />
      </div>

      {/* ── Activity charts ──────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="So'nggi 30 kunlik faollik" hint="DAU & sessiyalar" span="full">
          <AreaChart data={data.dau} />
        </ChartCard>

        <ChartCard title="Faollik vaqti (soat bo'yicha)" hint="UTC · oxirgi 30 kun">
          <BarsChart data={hourSeries} labelEvery={3} />
        </ChartCard>

        <ChartCard title="Tadbirlar turlari" hint="oxirgi 30 kun">
          {eventSeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hali tadbirlar yo&apos;q.</p>
          ) : (
            <HBarsChart data={eventSeries} />
          )}
        </ChartCard>
      </div>

      {/* ── Distributions ────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Joriy daraja" hint="foydalanuvchilar profilidan">
          {currentLvlSeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ma&apos;lumot yo&apos;q.</p>
          ) : (
            <DonutChart data={currentLvlSeries} centerLabel={{ value: totals.users, hint: "jami" }} />
          )}
        </ChartCard>

        <ChartCard title="Maqsad daraja" hint="qaysi HSK'gacha">
          {targetLvlSeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ma&apos;lumot yo&apos;q.</p>
          ) : (
            <DonutChart data={targetLvlSeries} />
          )}
        </ChartCard>

        <ChartCard title="Maqsad turi" hint="nima uchun o'rganadi">
          {goalSeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ma&apos;lumot yo&apos;q.</p>
          ) : (
            <DonutChart data={goalSeries} />
          )}
        </ChartCard>
      </div>

      {/* ── Funnel + retention + exam pass rate ─────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Foydalanuvchi yo'li (funnel)" hint="ro'yxat → onboarding → o'rganish → imtihon">
          <Funnel steps={data.funnel} />
        </ChartCard>

        <ChartCard title="Qaytib kelish (retention)" hint="ro'yxatdan o'tgan kundan keyin">
          <ul className="space-y-3">
            {data.retention.map((r) => (
              <li key={r.label}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-semibold">{r.label}</span>
                  <span className="tabular-nums"><b>{r.value}%</b></span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${r.value}%` }}
                  />
                </div>
              </li>
            ))}
            <li className="pt-1 text-xs text-muted-foreground">
              D1 — ro&apos;yxatdan keyin 1+ kundan keyin qaytdi
            </li>
          </ul>
        </ChartCard>

        <ChartCard title="Imtihon o'tish darajasi" hint="HSK bo'yicha">
          {data.examPassRate.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hali imtihon topshirilmagan.</p>
          ) : (
            <ul className="space-y-3">
              {data.examPassRate.map((e) => (
                <li key={e.level}>
                  <div className="mb-1 flex items-baseline justify-between text-sm">
                    <span className="font-semibold">HSK {e.level}</span>
                    <span className="tabular-nums text-muted-foreground">
                      <b className="text-foreground">{e.rate}%</b> · {e.passed}/{e.total}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${e.rate}%`, background: e.rate >= 60 ? "#16a34a" : e.rate >= 30 ? "#eab308" : "#dc2626" }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>

      {/* ── Content + top users ──────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Kontent — HSK darajalari bo'yicha" hint="lug'at + ieroglif">
          {contentLvlSeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hali kontent yo&apos;q.</p>
          ) : (
            <StackedBars
              data={contentLvlSeries}
              keys={[
                { key: "vocab",      label: "Lug'at",      color: PALETTE[5] },
                { key: "characters", label: "Ierogliflar", color: PALETTE[0] },
              ]}
            />
          )}
        </ChartCard>

        <ChartCard title="Kontent turi bo'yicha" hint="jami">
          <DonutChart
            data={contentPie}
            centerLabel={{ value: contentPie.reduce((s, c) => s + c.value, 0), hint: "jami yozuv" }}
          />
        </ChartCard>

        <ChartCard title="Top foydalanuvchilar (XP)" span="full">
          {topUserSeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hali XP olgan foydalanuvchi yo&apos;q.</p>
          ) : (
            <HBarsChart data={topUserSeries} formatValue={(n) => `${n.toLocaleString()} XP`} />
          )}
        </ChartCard>
      </div>

      {/* ── Recent events feed ───────────────────────────────────────── */}
      <ChartCard title="So'nggi tadbirlar" hint="real-vaqt · 60 s yangilanadi">
        {data.recentEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Hali hech narsa qilinmagan.</p>
        ) : (
          <ul className="max-h-72 space-y-2.5 overflow-y-auto pr-1 text-sm">
            {data.recentEvents.map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-3 border-b border-border/40 pb-2 last:border-0">
                <span className="min-w-0 truncate">
                  <b className="font-semibold">{e.email}</b>{" "}
                  <span className="text-muted-foreground">{EVENT_LABELS[e.type] ?? e.type}</span>
                </span>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">{relativeTime(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>
    </div>
  );
}
