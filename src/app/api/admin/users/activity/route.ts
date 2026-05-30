import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/admin/users/activity
//   ?range=7|30|90                   (default 30)         — quick preset
//   ?from=YYYY-MM-DD&to=YYYY-MM-DD                       — custom range
//
// Returns per-day user metrics for the Users tab analytics panel:
//   - newUsers      : how many signed up that day
//   - activeUsers   : distinct user_ids that had a session that day
//   - sessions      : total session count that day
//   - minutes       : sum of session durations (capped at 8h/session)
// Plus today/yesterday quick KPIs with a trend %.

const ALLOWED_RANGES = new Set([7, 30, 90]);
const MAX_DAYS = 365;

function pct(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function parseISODate(s: string | null): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isFinite(d.getTime()) ? d : null;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const now = new Date();
  const todayStart = new Date(now); todayStart.setUTCHours(0, 0, 0, 0);

  // Custom range takes priority over the `range` preset.
  const fromParam = parseISODate(url.searchParams.get("from"));
  const toParam   = parseISODate(url.searchParams.get("to"));

  let rangeStart: Date;
  let rangeEnd: Date;     // exclusive
  let days: number;
  let usingCustom = false;

  if (fromParam && toParam && toParam.getTime() >= fromParam.getTime()) {
    usingCustom = true;
    rangeStart = fromParam;
    rangeEnd   = new Date(toParam.getTime() + 86_400_000);    // include the "to" day
    days       = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000);
    if (days > MAX_DAYS) {
      rangeStart = new Date(rangeEnd.getTime() - MAX_DAYS * 86_400_000);
      days = MAX_DAYS;
    }
  } else {
    const rangeRaw = Number(url.searchParams.get("range") ?? "30");
    days = ALLOWED_RANGES.has(rangeRaw) ? rangeRaw : 30;
    rangeStart = new Date(todayStart.getTime() - (days - 1) * 86_400_000);
    rangeEnd   = new Date(todayStart.getTime() + 86_400_000);
  }

  const [profilesRes, sessionsRes] = await Promise.all([
    supabase.from("admin_user_overview")
      .select("user_id, registered_at")
      .gte("registered_at", rangeStart.toISOString())
      .lt("registered_at",  rangeEnd.toISOString()),
    supabase.from("user_sessions")
      .select("user_id, started_at, last_seen_at")
      .gte("started_at", rangeStart.toISOString())
      .lt("started_at",  rangeEnd.toISOString()),
  ]);

  // ── Daily new users ────────────────────────────────────────────────
  const signupByDay: Record<string, number> = {};
  for (const r of profilesRes.data ?? []) {
    if (!r.registered_at) continue;
    const d = dayKey(r.registered_at as string);
    signupByDay[d] = (signupByDay[d] ?? 0) + 1;
  }

  // ── Daily active users / sessions / minutes ───────────────────────
  const dauByDay: Record<string, Set<string>> = {};
  const sessByDay: Record<string, number> = {};
  const minByDay:  Record<string, number> = {};
  for (const s of sessionsRes.data ?? []) {
    const d = dayKey(s.started_at as string);
    (dauByDay[d] ??= new Set()).add(s.user_id as string);
    sessByDay[d] = (sessByDay[d] ?? 0) + 1;
    const dur = (new Date(s.last_seen_at as string).getTime() - new Date(s.started_at as string).getTime()) / 60_000;
    minByDay[d] = (minByDay[d] ?? 0) + Math.min(Math.max(dur, 0), 480);
  }

  // Contiguous series, oldest → newest.
  const series: { date: string; newUsers: number; activeUsers: number; sessions: number; minutes: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = dayKey(new Date(rangeStart.getTime() + i * 86_400_000).toISOString());
    series.push({
      date:        d,
      newUsers:    signupByDay[d] ?? 0,
      activeUsers: dauByDay[d]?.size ?? 0,
      sessions:    sessByDay[d] ?? 0,
      minutes:     Math.round(minByDay[d] ?? 0),
    });
  }

  // ── Today vs yesterday quick stats (always computed for the KPI strip) ─
  const todayKey     = dayKey(todayStart.toISOString());
  const yesterdayKey = dayKey(new Date(todayStart.getTime() - 86_400_000).toISOString());

  // Pull today + yesterday signups/sessions separately so the KPI strip is
  // accurate even when the user is looking at a custom window in the past.
  let signupsToday = 0, signupsYday = 0;
  let activeTodaySet = new Set<string>();
  let activeYdaySet  = new Set<string>();
  let sessionsToday = 0, sessionsYday = 0;
  let minutesToday  = 0, minutesYday  = 0;
  if (usingCustom) {
    const since = new Date(todayStart.getTime() - 86_400_000);
    const [signups, sess] = await Promise.all([
      supabase.from("admin_user_overview").select("registered_at").gte("registered_at", since.toISOString()),
      supabase.from("user_sessions").select("user_id, started_at, last_seen_at").gte("started_at", since.toISOString()),
    ]);
    for (const r of signups.data ?? []) {
      const d = dayKey(r.registered_at as string);
      if      (d === todayKey)     signupsToday += 1;
      else if (d === yesterdayKey) signupsYday  += 1;
    }
    for (const s of sess.data ?? []) {
      const d = dayKey(s.started_at as string);
      const dur = (new Date(s.last_seen_at as string).getTime() - new Date(s.started_at as string).getTime()) / 60_000;
      const capped = Math.min(Math.max(dur, 0), 480);
      if (d === todayKey)     { sessionsToday += 1; minutesToday += capped; activeTodaySet.add(s.user_id as string); }
      else if (d === yesterdayKey) { sessionsYday += 1; minutesYday += capped; activeYdaySet.add(s.user_id as string); }
    }
  } else {
    signupsToday  = signupByDay[todayKey]     ?? 0;
    signupsYday   = signupByDay[yesterdayKey] ?? 0;
    activeTodaySet = dauByDay[todayKey]     ?? new Set();
    activeYdaySet  = dauByDay[yesterdayKey] ?? new Set();
    sessionsToday  = sessByDay[todayKey]     ?? 0;
    sessionsYday   = sessByDay[yesterdayKey] ?? 0;
    minutesToday   = minByDay[todayKey]      ?? 0;
    minutesYday    = minByDay[yesterdayKey]  ?? 0;
  }

  const activeToday = activeTodaySet.size;
  const activeYday  = activeYdaySet.size;
  minutesToday = Math.round(minutesToday);
  minutesYday  = Math.round(minutesYday);

  return NextResponse.json({
    from: dayKey(rangeStart.toISOString()),
    to:   dayKey(new Date(rangeEnd.getTime() - 86_400_000).toISOString()),
    days,
    series,
    today: {
      signups:        signupsToday,
      signupsTrend:   pct(signupsToday, signupsYday),
      activeUsers:    activeToday,
      activeTrend:    pct(activeToday,  activeYday),
      sessions:       sessionsToday,
      sessionsTrend:  pct(sessionsToday, sessionsYday),
      minutes:        minutesToday,
      minutesTrend:   pct(minutesToday,  minutesYday),
    },
    yesterday: {
      signups:     signupsYday,
      activeUsers: activeYday,
      sessions:    sessionsYday,
      minutes:     minutesYday,
    },
  });
}
