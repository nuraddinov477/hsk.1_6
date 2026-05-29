import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Aggregated stats for the admin dashboard. Multiple chart-ready series are
// computed here so the client only renders SVG — no recompute on the browser.
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
    eventTypes,
    profiles,
    vocabRows,
    charRows,
    progressTotals,
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
    supabase.from("admin_user_overview").select("email, xp, streak, vocab_learned, characters_learned").order("xp", { ascending: false }).limit(8),
    supabase.from("user_sessions").select("started_at, user_id").gte("started_at", monthAgo.toISOString()),
    supabase.from("user_events").select("event_type, created_at").gte("created_at", monthAgo.toISOString()),
    supabase.from("profiles").select("current_level, target_level, goal"),
    supabase.from("vocabulary").select("hsk_level"),
    supabase.from("characters").select("hsk_level"),
    supabase.from("user_progress").select("xp, streak, vocab_learned, characters_learned"),
  ]);

  // ── DAU per day for the last 30 days ──────────────────────────────────
  const dau: Record<string, Set<string>> = {};
  const sessionsByDay: Record<string, number> = {};
  const sessionsByHour = Array.from({ length: 24 }, () => 0);
  for (const row of dauRows.data ?? []) {
    const iso = row.started_at as string;
    const day = iso.slice(0, 10);
    (dau[day] ??= new Set()).add(row.user_id as string);
    sessionsByDay[day] = (sessionsByDay[day] ?? 0) + 1;
    const hour = new Date(iso).getUTCHours();
    sessionsByHour[hour] += 1;
  }
  const dauSeries: { date: string; users: number; sessions: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    dauSeries.push({ date: d, users: dau[d]?.size ?? 0, sessions: sessionsByDay[d] ?? 0 });
  }

  // ── Event breakdown (last 30d) ────────────────────────────────────────
  const eventByType: Record<string, number> = {};
  for (const r of eventTypes.data ?? []) {
    const t = r.event_type as string;
    eventByType[t] = (eventByType[t] ?? 0) + 1;
  }
  const eventBreakdown = Object.entries(eventByType)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // ── Profile distributions ─────────────────────────────────────────────
  type ProfRow = { current_level: number | null; target_level: number | null; goal: string | null };
  const profs = (profiles.data ?? []) as ProfRow[];
  const levelBuckets = (key: "current_level" | "target_level") => {
    const out = Array.from({ length: 7 }, (_, i) => ({ level: i, count: 0 })); // 0..6
    for (const p of profs) {
      const v = p[key];
      if (v != null && v >= 0 && v <= 6) out[v].count += 1;
    }
    return out;
  };
  const currentLevelDist = levelBuckets("current_level");
  const targetLevelDist  = levelBuckets("target_level");

  const goalCounts: Record<string, number> = {};
  for (const p of profs) {
    const g = (p.goal ?? "unset") as string;
    goalCounts[g] = (goalCounts[g] ?? 0) + 1;
  }
  const goalDist = Object.entries(goalCounts).map(([goal, count]) => ({ goal, count }));

  // ── Content per HSK level ─────────────────────────────────────────────
  const contentByLevel = Array.from({ length: 7 }, (_, i) => ({ level: i, vocab: 0, characters: 0 }));
  for (const r of vocabRows.data ?? []) {
    const lv = (r.hsk_level as number) ?? 0;
    if (lv >= 0 && lv <= 6) contentByLevel[lv].vocab += 1;
  }
  for (const r of charRows.data ?? []) {
    const lv = (r.hsk_level as number) ?? 0;
    if (lv >= 0 && lv <= 6) contentByLevel[lv].characters += 1;
  }

  // ── Learning totals across all users ─────────────────────────────────
  let totalXp = 0, totalVocab = 0, totalChars = 0, totalStreak = 0;
  for (const r of progressTotals.data ?? []) {
    totalXp     += (r.xp as number) ?? 0;
    totalVocab  += (r.vocab_learned as number) ?? 0;
    totalChars  += (r.characters_learned as number) ?? 0;
    totalStreak += (r.streak as number) ?? 0;
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
      totalXp,
      totalVocab,
      totalChars,
      totalStreak,
    },
    dau: dauSeries,
    sessionsByHour,
    eventBreakdown,
    currentLevelDist,
    targetLevelDist,
    goalDist,
    contentByLevel,
    recentEvents: (recentEvents.data ?? []).map((e) => ({
      type:      e.event_type,
      payload:   e.payload,
      createdAt: e.created_at,
      email:     emailById[e.user_id as string] ?? "?",
    })),
    topUsers: topUsers.data ?? [],
  });
}
