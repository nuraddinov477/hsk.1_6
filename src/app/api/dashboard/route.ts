import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Aggregated stats for the user's dashboard. One call so the page renders
// without 6 separate fetches.
//
// Returns:
//   heatmap        — last 30 days of { date, xp } (0 if no activity)
//   weekly         — { rank, xp, delta } (delta vs last week, can be null)
//   alltimeRank    — number | null
//   minutesThisWeek — total seconds of session time this week / 60
//   levelBreakdown — per-HSK-level vocab learned vs total
//   achievements   — list of unlocked badges (computed from progress)
//   srsDue         — count of cards due now
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 86_400_000);
  const weekAgo  = new Date(now.getTime() -  7 * 86_400_000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86_400_000);

  const [
    progressRes,
    eventsRes,
    sessionsRes,
    vocabCountsRes,
    weekLeaderboardRes,
    alltimeLeaderboardRes,
    examCountRes,
  ] = await Promise.all([
    supabase.from("user_progress").select("xp, streak, vocab_learned, characters_learned, completed_lessons").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_events")
      .select("event_type, payload, created_at")
      .eq("user_id", user.id)
      .gte("created_at", monthAgo.toISOString()),
    supabase.from("user_sessions")
      .select("started_at, last_seen_at")
      .eq("user_id", user.id)
      .gte("last_seen_at", weekAgo.toISOString()),
    supabase.from("vocabulary").select("hsk_level"),
    supabase.from("leaderboard_week").select("user_id, xp"),
    supabase.from("leaderboard_alltime").select("user_id, xp"),
    supabase.from("exam_results").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  // ─── Heatmap: XP per day, last 30 days ───
  const xpByDay: Record<string, number> = {};
  for (const e of eventsRes.data ?? []) {
    if (e.event_type !== "xp_gained") continue;
    const day = (e.created_at as string).slice(0, 10);
    const p = e.payload as { amount?: number } | null;
    xpByDay[day] = (xpByDay[day] ?? 0) + (p?.amount ?? 0);
  }
  const heatmap: { date: string; xp: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    heatmap.push({ date: d, xp: xpByDay[d] ?? 0 });
  }

  // ─── Weekly XP + rank with week-over-week delta ───
  const weekRows = weekLeaderboardRes.data ?? [];
  const me = weekRows.find((r) => r.user_id === user.id);
  const myWeekXp = me?.xp ?? 0;
  const weekRank = myWeekXp > 0 ? weekRows.filter((r) => (r.xp ?? 0) > myWeekXp).length + 1 : null;

  // For delta, count last-week XP from events (between 14 and 7 days ago).
  let lastWeekXp = 0;
  for (const e of eventsRes.data ?? []) {
    if (e.event_type !== "xp_gained") continue;
    const t = new Date(e.created_at as string).getTime();
    if (t >= twoWeeksAgo.getTime() && t < weekAgo.getTime()) {
      lastWeekXp += (e.payload as { amount?: number } | null)?.amount ?? 0;
    }
  }
  const weekDelta = myWeekXp - lastWeekXp;

  const alltimeRows = alltimeLeaderboardRes.data ?? [];
  const myAlltime = alltimeRows.find((r) => r.user_id === user.id);
  const alltimeRank = myAlltime ? alltimeRows.filter((r) => (r.xp ?? 0) > (myAlltime.xp ?? 0)).length + 1 : null;

  // ─── Minutes on platform this week ───
  let secondsThisWeek = 0;
  for (const s of sessionsRes.data ?? []) {
    const start = Math.max(new Date(s.started_at as string).getTime(), weekAgo.getTime());
    const end   = new Date(s.last_seen_at as string).getTime();
    if (end > start) secondsThisWeek += Math.min((end - start) / 1000, 8 * 3600);
  }
  const minutesThisWeek = Math.round(secondsThisWeek / 60);

  // ─── Per-HSK level vocab progress ───
  const totalByLevel: Record<number, number> = {};
  for (const v of vocabCountsRes.data ?? []) {
    totalByLevel[v.hsk_level as number] = (totalByLevel[v.hsk_level as number] ?? 0) + 1;
  }
  const vocabLearnedIds: string[] = progressRes.data?.vocab_learned ?? [];
  // We don't know learned counts per level without joining — return totals
  // and an overall learned count; per-level breakdown is best-effort using TS
  // baseline data on the client.
  const levelBreakdown = Object.entries(totalByLevel)
    .map(([level, total]) => ({ level: Number(level), total: total as number }))
    .sort((a, b) => a.level - b.level);

  // ─── Achievements (derived from progress) ───
  const xp     = progressRes.data?.xp ?? 0;
  const streak = progressRes.data?.streak ?? 0;
  const vocabLearned = vocabLearnedIds.length;
  const charsLearned = (progressRes.data?.characters_learned ?? []).length;
  const lessons      = (progressRes.data?.completed_lessons ?? []).length;
  const examsTaken   = examCountRes.count ?? 0;

  type Ach = { key: string; title: string; emoji: string; unlocked: boolean; progress?: { now: number; goal: number } };
  const achievements: Ach[] = [
    { key: "first_word",   title: "Birinchi so'z",    emoji: "🌱", unlocked: vocabLearned >= 1,   progress: { now: vocabLearned, goal: 1 } },
    { key: "ten_words",    title: "10 ta so'z",      emoji: "📚", unlocked: vocabLearned >= 10,  progress: { now: vocabLearned, goal: 10 } },
    { key: "fifty_words",  title: "50 ta so'z",      emoji: "🔥", unlocked: vocabLearned >= 50,  progress: { now: vocabLearned, goal: 50 } },
    { key: "hundred_words",title: "100 ta so'z",     emoji: "💯", unlocked: vocabLearned >= 100, progress: { now: vocabLearned, goal: 100 } },
    { key: "first_char",   title: "Birinchi ieroglif", emoji: "✍️", unlocked: charsLearned >= 1,    progress: { now: charsLearned, goal: 1 } },
    { key: "thirty_chars", title: "30 ta ieroglif",  emoji: "🀄", unlocked: charsLearned >= 30,   progress: { now: charsLearned, goal: 30 } },
    { key: "streak_7",     title: "7 kun ketma-ket", emoji: "⚡", unlocked: streak >= 7,           progress: { now: streak, goal: 7 } },
    { key: "streak_30",    title: "30 kun ketma-ket",emoji: "🏆", unlocked: streak >= 30,          progress: { now: streak, goal: 30 } },
    { key: "first_exam",   title: "Birinchi imtihon",emoji: "🎓", unlocked: examsTaken >= 1,       progress: { now: examsTaken, goal: 1 } },
    { key: "xp_500",       title: "500 XP",          emoji: "💎", unlocked: xp >= 500,             progress: { now: xp, goal: 500 } },
    { key: "xp_2000",      title: "2000 XP",         emoji: "👑", unlocked: xp >= 2000,            progress: { now: xp, goal: 2000 } },
    { key: "scholar",      title: "10 dars",         emoji: "📖", unlocked: lessons >= 10,         progress: { now: lessons, goal: 10 } },
  ];

  return NextResponse.json({
    heatmap,
    weekly: { rank: weekRank, xp: myWeekXp, delta: weekDelta },
    alltimeRank,
    minutesThisWeek,
    levelBreakdown,
    achievements,
    counts: { vocabLearned, charsLearned, lessons, examsTaken, xp, streak },
  });
}
