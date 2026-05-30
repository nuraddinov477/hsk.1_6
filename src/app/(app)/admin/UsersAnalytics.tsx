"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { UserPlus, Users as UsersIcon, Zap, Clock, TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import { ChartCard, DailyChart, PALETTE } from "./charts";

// Users analytics — sits above the users list. Today/yesterday KPIs with trend
// arrows + 4 daily charts (signups, DAU, sessions, minutes). The range is
// either a quick preset (7/30/90) or a custom from/to picker; clicking a bar
// highlights that day across all four charts.

type Range = 7 | 30 | 90;

type Series = { date: string; newUsers: number; activeUsers: number; sessions: number; minutes: number };

type Activity = {
  from: string; to: string; days: number;
  series: Series[];
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

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}
function isoDaysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

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
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Range state: either a preset or a custom from/to.
  const [preset, setPreset] = useState<Range | "custom">(30);
  const [from, setFrom] = useState<string>(isoDaysAgo(29));
  const [to,   setTo]   = useState<string>(isoToday());

  const queryString = useMemo(() => {
    if (preset === "custom") return `from=${from}&to=${to}`;
    return `range=${preset}`;
  }, [preset, from, to]);

  const load = useCallback(async () => {
    if (document.hidden) return;
    const r = await fetch(`/api/admin/users/activity?${queryString}`);
    if (r.ok) setData(await r.json());
    setLoading(false);
  }, [queryString]);

  useEffect(() => {
    void load();
    const t = setInterval(load, 60_000);
    const onVis = () => { if (!document.hidden) void load(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [load]);

  function pickPreset(r: Range) {
    setPreset(r);
    setFrom(isoDaysAgo(r - 1));
    setTo(isoToday());
    setSelectedDay(null);
  }

  function applyCustomRange() {
    setPreset("custom");
    setSelectedDay(null);
    // load fires via useEffect when queryString changes.
  }

  if (loading || !data) return <p className="text-sm text-muted-foreground">Statistika yuklanmoqda…</p>;

  const t = data.today;
  const y = data.yesterday;

  // Pre-build the four series the charts need.
  const series = {
    newUsers:    data.series.map((s) => ({ date: s.date, value: s.newUsers })),
    activeUsers: data.series.map((s) => ({ date: s.date, value: s.activeUsers })),
    sessions:    data.series.map((s) => ({ date: s.date, value: s.sessions })),
    minutes:     data.series.map((s) => ({ date: s.date, value: s.minutes })),
  };

  // Optional: read the row for the selected day for the "Tanlangan kun" hero panel.
  const sel = selectedDay ? data.series.find((s) => s.date === selectedDay) : null;

  return (
    <div className="space-y-5">
      {/* Header + range controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight">Foydalanuvchilar analitikasi</h2>
          <p className="text-xs text-muted-foreground">
            <b className="text-foreground">{data.from}</b> — <b className="text-foreground">{data.to}</b> · {data.days} kun
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex h-9 rounded-full border border-border bg-background p-0.5 text-sm font-medium">
            {([7, 30, 90] as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => pickPreset(r)}
                className={`px-3.5 rounded-full transition ${preset === r ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {r} kun
              </button>
            ))}
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background py-0.5 pl-3 pr-1 text-xs">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="h-7 bg-transparent text-xs outline-none"
            />
            <span className="text-muted-foreground">—</span>
            <input
              type="date"
              value={to}
              min={from}
              max={isoToday()}
              onChange={(e) => setTo(e.target.value)}
              className="h-7 bg-transparent text-xs outline-none"
            />
            <button
              type="button"
              onClick={applyCustomRange}
              className="ml-1 h-7 rounded-full bg-brand px-3 text-xs font-semibold text-brand-foreground hover:opacity-90"
            >
              Ko‘rish
            </button>
          </div>
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

      {/* Selected-day hero panel (only when a bar was clicked) */}
      {sel && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/30 bg-brand/5 p-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-brand">Tanlangan kun</div>
            <div className="mt-0.5 text-lg font-bold">{sel.date}</div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            <DayStat label="Yangi" value={sel.newUsers} />
            <DayStat label="Faol" value={sel.activeUsers} />
            <DayStat label="Sessiya" value={sel.sessions} />
            <DayStat label="Vaqt" value={fmtMinutes(sel.minutes)} />
          </div>
          <button
            type="button"
            onClick={() => setSelectedDay(null)}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            Tozalash
          </button>
        </div>
      )}

      {/* Daily charts (click a bar to focus a day) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Yangi foydalanuvchilar" hint="kuniga signup">
          <DailyChart data={series.newUsers} color={PALETTE[6]} unit="ta"
            selected={selectedDay} onSelect={setSelectedDay} />
        </ChartCard>

        <ChartCard title="Faol foydalanuvchilar (DAU)" hint="unikal kunlik foydalanuvchi">
          <DailyChart data={series.activeUsers} color={PALETTE[3]} unit="ta"
            selected={selectedDay} onSelect={setSelectedDay} />
        </ChartCard>

        <ChartCard title="Sessiyalar soni" hint="kuniga jami sessiya">
          <DailyChart data={series.sessions} color={PALETTE[1]} unit="ta"
            selected={selectedDay} onSelect={setSelectedDay} />
        </ChartCard>

        <ChartCard title="Onlayn vaqt" hint="kuniga jami daqiqa">
          <DailyChart data={series.minutes} color={PALETTE[5]} unit="daq"
            selected={selectedDay} onSelect={setSelectedDay}
            formatValue={(n) => fmtMinutes(n)} />
        </ChartCard>
      </div>
    </div>
  );
}

function DayStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}
