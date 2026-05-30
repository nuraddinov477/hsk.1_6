import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/admin/users/:id — full drill-down for one user. Returns profile +
// progress + last 30 days of sessions (binned per day) + recent events + exam
// history. Powers /admin/users/[id].
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const monthAgo = new Date(Date.now() - 30 * 86_400_000);

  const [overview, profile, progress, sessions, recentSessions, events, exams] = await Promise.all([
    supabase.from("admin_user_overview").select("*").eq("user_id", id).maybeSingle(),
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("user_progress").select("*").eq("user_id", id).maybeSingle(),
    supabase.from("user_sessions").select("started_at, last_seen_at").eq("user_id", id).gte("started_at", monthAgo.toISOString()),
    // Latest 30 sessions for the full "Sessiyalar" log (login / logout / duration / device).
    supabase.from("user_sessions").select("id, started_at, last_seen_at, ended_at, user_agent").eq("user_id", id).order("started_at", { ascending: false }).limit(30),
    supabase.from("user_events").select("event_type, payload, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("exam_results").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
  ]);

  if (!overview.data) return NextResponse.json({ error: "not found" }, { status: 404 });

  // ── Per-day session count + minutes for the last 30 days ────────────
  const dayCount: Record<string, number> = {};
  const dayMin:   Record<string, number> = {};
  for (const s of sessions.data ?? []) {
    const day = (s.started_at as string).slice(0, 10);
    dayCount[day] = (dayCount[day] ?? 0) + 1;
    const dur = (new Date(s.last_seen_at as string).getTime() - new Date(s.started_at as string).getTime()) / 60_000;
    dayMin[day] = (dayMin[day] ?? 0) + Math.min(Math.max(dur, 0), 480);
  }
  const now = Date.now();
  const dailyActivity: { date: string; sessions: number; minutes: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000).toISOString().slice(0, 10);
    dailyActivity.push({
      date: d,
      sessions: dayCount[d] ?? 0,
      minutes: Math.round(dayMin[d] ?? 0),
    });
  }

  // Sessions log — compute the duration once on the server so the UI just renders.
  const sessionsLog = (recentSessions.data ?? []).map((s) => {
    const start  = new Date(s.started_at as string).getTime();
    const end    = new Date((s.ended_at as string | null) ?? (s.last_seen_at as string)).getTime();
    const durMin = Math.max(0, Math.min(480, Math.round((end - start) / 60_000)));
    return {
      id:          s.id as string,
      started_at:  s.started_at as string,
      ended_at:    (s.ended_at as string | null) ?? null,
      last_seen_at:s.last_seen_at as string,
      duration_min:durMin,
      device:      (s.user_agent as string | null) ?? null,
      live:        s.ended_at == null && (Date.now() - new Date(s.last_seen_at as string).getTime()) < 5 * 60_000,
    };
  });

  return NextResponse.json({
    overview: overview.data,
    profile:  profile.data,
    progress: progress.data,
    dailyActivity,
    sessionsLog,
    events:   events.data ?? [],
    exams:    exams.data ?? [],
  });
}
