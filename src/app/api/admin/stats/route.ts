import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Aggregated stats for the admin dashboard. Most numbers are derived from
// user_sessions / user_events with simple counts — no heavy materialized
// view needed yet.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const now = new Date();
  const today      = new Date(now); today.setUTCHours(0, 0, 0, 0);
  const fiveMinAgo = new Date(now.getTime() - 5 * 60_000);
  const monthAgo   = new Date(now.getTime() - 30 * 86_400_000);

  // Parallel-fetch the cheap aggregates.
  const [
    totalUsers,
    blockedUsers,
    adminUsers,
    sessionsToday,
    activeNow,
    examsTaken,
    contentCounts,
    recentEvents,
    topUsers,
    dauRows,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("blocked", true),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
    supabase.from("user_sessions").select("id", { count: "exact", head: true }).gte("started_at", today.toISOString()),
    supabase.from("user_sessions").select("id", { count: "exact", head: true }).gte("last_seen_at", fiveMinAgo.toISOString()),
    supabase.from("exam_results").select("id", { count: "exact", head: true }),
    Promise.all([
      supabase.from("vocabulary").select("id", { count: "exact", head: true }),
      supabase.from("characters").select("id", { count: "exact", head: true }),
      supabase.from("passages").select("id", { count: "exact", head: true }),
      supabase.from("exam_questions").select("id", { count: "exact", head: true }),
    ]),
    supabase.from("user_events").select("event_type, payload, created_at, user_id").order("created_at", { ascending: false }).limit(50),
    supabase.from("admin_user_overview").select("email, xp, streak, vocab_learned, characters_learned").order("xp", { ascending: false }).limit(5),
    supabase.from("user_sessions").select("started_at, user_id").gte("started_at", monthAgo.toISOString()),
  ]);

  // DAU per day for the last 30 days.
  const dau: Record<string, Set<string>> = {};
  for (const row of dauRows.data ?? []) {
    const day = (row.started_at as string).slice(0, 10);
    (dau[day] ??= new Set()).add(row.user_id as string);
  }
  const dauSeries: { date: string; users: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    dauSeries.push({ date: d, users: dau[d]?.size ?? 0 });
  }

  // Look up emails for the recent-event author column.
  const eventUserIds = Array.from(new Set((recentEvents.data ?? []).map((e) => e.user_id as string)));
  let emailById: Record<string, string> = {};
  if (eventUserIds.length) {
    const { data: rows } = await supabase
      .from("admin_user_overview")
      .select("user_id, email")
      .in("user_id", eventUserIds);
    emailById = Object.fromEntries((rows ?? []).map((r) => [r.user_id as string, r.email as string]));
  }

  return NextResponse.json({
    totals: {
      users:         totalUsers.count ?? 0,
      blockedUsers:  blockedUsers.count ?? 0,
      adminUsers:    adminUsers.count ?? 0,
      sessionsToday: sessionsToday.count ?? 0,
      activeNow:     activeNow.count ?? 0,
      examsTaken:    examsTaken.count ?? 0,
      vocabulary:    contentCounts[0].count ?? 0,
      characters:    contentCounts[1].count ?? 0,
      passages:      contentCounts[2].count ?? 0,
      examQuestions: contentCounts[3].count ?? 0,
    },
    dau: dauSeries,
    recentEvents: (recentEvents.data ?? []).map((e) => ({
      type:      e.event_type,
      payload:   e.payload,
      createdAt: e.created_at,
      email:     emailById[e.user_id as string] ?? "?",
    })),
    topUsers: topUsers.data ?? [],
  });
}
