import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Public leaderboard. Returns top-20 of both weekly and all-time, plus the
// current user's rank in each (for "You: #42" highlighting).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: alltime }, { data: week }] = await Promise.all([
    supabase.from("leaderboard_alltime").select("user_id, display_name, xp, streak, vocab_learned").limit(20),
    supabase.from("leaderboard_week").select("user_id, display_name, xp, streak").limit(20),
  ]);

  // Find the user's rank by counting how many rows have strictly more XP.
  let myAlltimeRank: number | null = null;
  let myWeekRank: number | null = null;
  let myAlltimeXp = 0;
  let myWeekXp = 0;

  if (user) {
    const { data: meAll } = await supabase
      .from("leaderboard_alltime")
      .select("xp")
      .eq("user_id", user.id)
      .maybeSingle();
    if (meAll) {
      myAlltimeXp = meAll.xp ?? 0;
      const { count } = await supabase
        .from("leaderboard_alltime")
        .select("user_id", { count: "exact", head: true })
        .gt("xp", myAlltimeXp);
      myAlltimeRank = (count ?? 0) + 1;
    }
    const { data: meWeek } = await supabase
      .from("leaderboard_week")
      .select("xp")
      .eq("user_id", user.id)
      .maybeSingle();
    if (meWeek) {
      myWeekXp = meWeek.xp ?? 0;
      const { count } = await supabase
        .from("leaderboard_week")
        .select("user_id", { count: "exact", head: true })
        .gt("xp", myWeekXp);
      myWeekRank = (count ?? 0) + 1;
    }
  }

  return NextResponse.json({
    alltime: alltime ?? [],
    week:    week ?? [],
    me: user ? {
      userId: user.id,
      alltimeRank: myAlltimeRank,
      weekRank: myWeekRank,
      alltimeXp: myAlltimeXp,
      weekXp: myWeekXp,
    } : null,
  });
}
