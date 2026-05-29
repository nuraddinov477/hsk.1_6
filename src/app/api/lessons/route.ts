import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/lessons?level=1..6
// Returns the published curriculum for an HSK level, ordered by lesson_no,
// with per-user completion flags merged in when the caller is signed in.
export async function GET(request: Request) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const level = Number(url.searchParams.get("level") ?? "0");

  let query = supabase
    .from("lessons")
    .select("id, hsk_level, lesson_no, title, vocab_words, char_hanzis, est_minutes, audio_url")
    .eq("published", true)
    .order("hsk_level", { ascending: true })
    .order("lesson_no", { ascending: true });

  if (level >= 1 && level <= 6) query = query.eq("hsk_level", level);

  const { data: lessons, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Merge per-user completion. Anonymous users get `completed: false` everywhere.
  let completedSet = new Set<string>();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: progress } = await supabase
      .from("user_progress").select("completed_lessons").eq("user_id", user.id).maybeSingle();
    completedSet = new Set(progress?.completed_lessons ?? []);
  }

  return NextResponse.json({
    lessons: (lessons ?? []).map((l) => ({
      ...l,
      completed: completedSet.has(l.id),
    })),
  });
}
