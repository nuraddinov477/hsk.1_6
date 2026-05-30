import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/admin/users/activity?range=7|30|90 (default 30)
// Per-day user metrics for the Users tab analytics panel:
//   - newUsers      : how many signed up that day
//   - activeUsers   : distinct user_ids that had a session that day
//   - sessions      : total session count that day
//   - minutes       : sum of session durations (capped at 8h/session)
// Plus today/yesterday quick KPIs with a trend %.

const ALLOWED_RANGES = new Set([7, 30, 90]);

function pct(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const rangeRaw = Number(url.searchParams.get("range") ?? "30");
  const range = ALLOWED_RANGES.has(rangeRaw) ? rangeRaw : 30;

  const now = new Date();
  const today = new Date(now); today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86_400_000);
  const rangeAgo = new Date(now.getTime() - range * 86_400_000);

  const [profilesRes, sessionsRes] = await Promise.all([
    // We need created_at from auth.users — admin_user_overview exposes it
    // as registered_at.
    supabase.from("admin_user_overview")
      .select("user_id, registered_at")
      .gte("registered_at", rangeAgo.toISOString()),
    supabase.from("user_sessions")
      .select("user_id, started_at, last_seen_at")
      .gte("started_at", rangeAgo.toISOString()),
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

  // Build the contiguous series so the chart has no gaps.
  const series: { date: string; newUsers: number; activeUsers: number; sessions: number; minutes: number }[] = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = dayKey(new Date(now.getTime() - i * 86_400_000).toISOString());
    series.push({
      date:        d,
      newUsers:    signupByDay[d] ?? 0,
      activeUsers: dauByDay[d]?.size ?? 0,
      sessions:    sessByDay[d] ?? 0,
      minutes:     Math.round(minByDay[d] ?? 0),
    });
  }

  // ── Today vs yesterday quick stats ─────────────────────────────────
  const todayKey     = dayKey(today.toISOString());
  const yesterdayKey = dayKey(yesterday.toISOString());

  const signupsToday     = signupByDay[todayKey]     ?? 0;
  const signupsYesterday = signupByDay[yesterdayKey] ?? 0;
  const activeToday      = dauByDay[todayKey]?.size     ?? 0;
  const activeYesterday  = dauByDay[yesterdayKey]?.size ?? 0;
  const sessionsToday    = sessByDay[todayKey]     ?? 0;
  const sessionsYday     = sessByDay[yesterdayKey] ?? 0;
  const minutesToday     = Math.round(minByDay[todayKey] ?? 0);
  const minutesYday      = Math.round(minByDay[yesterdayKey] ?? 0);

  return NextResponse.json({
    range,
    series,
    today: {
      signups:        signupsToday,
      signupsTrend:   pct(signupsToday, signupsYesterday),
      activeUsers:    activeToday,
      activeTrend:    pct(activeToday,  activeYesterday),
      sessions:       sessionsToday,
      sessionsTrend:  pct(sessionsToday, sessionsYday),
      minutes:        minutesToday,
      minutesTrend:   pct(minutesToday,  minutesYday),
    },
    yesterday: {
      signups:     signupsYesterday,
      activeUsers: activeYesterday,
      sessions:    sessionsYday,
      minutes:     minutesYday,
    },
  });
}
