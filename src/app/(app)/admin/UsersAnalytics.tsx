"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus, Users as UsersIcon, Zap, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ChartCard, BarsChart } from "./charts";

// Users analytics — sits above the users list. Quick today/yesterday KPIs
// with trend arrows + per-day signups / DAU / sessions / minutes for the last
// 7 / 30 / 90 days. Pauses polling when the tab is hidden.

type Range = 7 | 30 | 90;

type Activity = {
  range: Range;
  series: { date: string; newUsers: number; activeUsers: number; sessions: number; minutes: number }[];
  today: {
    signups: number; signupsTrend: number;
    activeUsers: number; activeTrend: number;
    sessions: number; sessionsTrend: number;
    minutes: number; minutesTrend: number;
  };
  yesterday: {
    signups: number; activeUsers: number; sessions: number; minutes: number;
  };
};

function fmtMinutes(m: number): string {
  if (!m) return "0 daq";
  if (m < 60) return `${m} daq`;
  return `${Math.floor(m / 60)} s ${m % 60} daq`;
}

function Trend({ value }: { value: number }) {
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  const cls = value > 0 ? "text-green-600 bg-green-500/10"
            : value < 0 ? "text-red-600 bg-red-500/10"
            :              "text-muted-foreground bg-muted";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      <Icon className="h-3 w-3" />
      {value > 0 ? "+" : ""}{value}%
    </span>
  );
}

function Kpi({
  icon: Icon, label, value, trend, yesterdayValue, accent,
}: {
  icon: typeof UsersIcon; label: string; value: string | number; trend: number;
  yesterdayValue: string | number; accent: string;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
        <Trend value={trend} />
      </div>
      <div className="mt-2 truncate text-2xl font-bold tabular-nums" title={String(value)}>{value}</div>
      <div className="mt-0.5 truncate text-sm font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-xs text-muted-foreground">kecha: <b className="text-foreground">{yesterdayValue}</b></div>
    </div>
  );
}

export function UsersAnalytics() {
  const [data, setData] = useState<Activity | null>(null);
  const [range, setRange] = useState<Range>(30);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (document.hidden) return;
    const r = await fetch(`/api/admin/users/activity?range=${range}`);
    if (r.ok) setData(await r.json());
    setLoading(false);
  }, [range]);

  useEffect(() => {
    void load();
    const t = setInterval(load, 60_000);
    const onVis = () => { if (!document.hidden) void load(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [load]);

  if (loading || !data) return <p className="text-sm text-muted-foreground">Statistika yuklanmoqda…</p>;

  const t = data.today;
  const y = data.yesterday;

  // Chart series — pick the date suffix (MM-DD) for the axis labels.
  const labelEvery = data.series.length > 30 ? 7 : 5;
  const newUserBars = data.series.map((s) => ({ label: s.date.slice(5), value: s.newUsers }));
  const dauBars     = data.series.map((s) => ({ label: s.date.slice(5), value: s.activeUsers }));
  const sessBars    = data.series.map((s) => ({ label: s.date.slice(5), value: s.sessions }));
  const minsBars    = data.series.map((s) => ({ label: s.date.slice(5), value: s.minutes }));

  return (
    <div className="space-y-5">
      {/* Range toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold tracking-tight">Foydalanuvchilar analitikasi</h2>
        <div className="inline-flex h-9 rounded-full border border-border bg-background p-0.5 text-sm font-medium">
          {([7, 30, 90] as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3.5 rounded-full transition ${range === r ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {r} kun
            </button>
          ))}
        </div>
      </div>

      {/* KPI row — today vs yesterday */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          icon={UserPlus} label="Bugun yangi" value={t.signups} trend={t.signupsTrend}
          yesterdayValue={y.signups} accent="bg-violet-500/10 text-violet-600"
        />
        <Kpi
          icon={UsersIcon} label="Bugun faol" value={t.activeUsers} trend={t.activeTrend}
          yesterdayValue={y.activeUsers} accent="bg-green-500/10 text-green-600"
        />
        <Kpi
          icon={Zap} label="Bugungi sessiya" value={t.sessions} trend={t.sessionsTrend}
          yesterdayValue={y.sessions} accent="bg-orange-500/10 text-orange-600"
        />
        <Kpi
          icon={Clock} label="Bugungi vaqt" value={fmtMinutes(t.minutes)} trend={t.minutesTrend}
          yesterdayValue={fmtMinutes(y.minutes)} accent="bg-blue-500/10 text-blue-600"
        />
      </div>

      {/* Daily charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Yangi foydalanuvchilar" hint={`oxirgi ${range} kun`}>
          <BarsChart data={newUserBars} labelEvery={labelEvery} />
        </ChartCard>

        <ChartCard title="Faol foydalanuvchilar (DAU)" hint={`oxirgi ${range} kun`}>
          <BarsChart data={dauBars} labelEvery={labelEvery} />
        </ChartCard>

        <ChartCard title="Sessiyalar soni" hint={`oxirgi ${range} kun`}>
          <BarsChart data={sessBars} labelEvery={labelEvery} />
        </ChartCard>

        <ChartCard title="Onlayn bo'lgan vaqt" hint={`oxirgi ${range} kun · daqiqa`}>
          <BarsChart data={minsBars} labelEvery={labelEvery} />
        </ChartCard>
      </div>
    </div>
  );
}
