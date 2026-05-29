import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/lessons/[id] — full lesson body + linked vocab/character rows.
// Next.js 16: route params are async.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lesson, error } = await supabase
    .from("lessons").select("*").eq("id", id).maybeSingle();
  if (error || !lesson) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!lesson.published) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: me } = user
      ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
      : { data: null };
    if (me?.role !== "admin") return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Pull the vocab + character rows the lesson references so the reader can
  // render them inline without a second round-trip.
  const [vocabRes, charsRes] = await Promise.all([
    lesson.vocab_words?.length
      ? supabase.from("vocabulary").select("word, pinyin, meaning, hsk_level").in("word", lesson.vocab_words)
      : Promise.resolve({ data: [] as unknown[] }),
    lesson.char_hanzis?.length
      ? supabase.from("characters").select("hanzi, pinyin, meaning, hsk_level").in("hanzi", lesson.char_hanzis)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  // Per-user completion flag (anonymous = false).
  let completed = false;
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: progress } = await supabase
      .from("user_progress").select("completed_lessons").eq("user_id", user.id).maybeSingle();
    completed = (progress?.completed_lessons ?? []).includes(id);
  }

  return NextResponse.json({
    lesson,
    vocab: vocabRes.data ?? [],
    chars: charsRes.data ?? [],
    completed,
  });
}
