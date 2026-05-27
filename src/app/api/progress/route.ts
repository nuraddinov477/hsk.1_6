import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET: the signed-in user's progress (assembled with their exam scores).
// PUT: upsert the progress row. Both rely on Supabase RLS — a user can only
// ever touch their own row (user_id = auth.uid()).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [{ data: row }, { data: exams }] = await Promise.all([
    supabase.from("user_progress").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("exam_results").select("score, created_at").eq("user_id", user.id).order("created_at", { ascending: true }),
  ]);

  return NextResponse.json({
    xp: row?.xp ?? 0,
    streak: row?.streak ?? 0,
    lastActiveDate: row?.last_active_date ?? null,
    charactersLearned: row?.characters_learned ?? [],
    vocabLearned: row?.vocab_learned ?? [],
    completedLessons: row?.completed_lessons ?? [],
    examScores: (exams ?? []).map((e) => ({ date: e.created_at, score: e.score })),
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const { error } = await supabase.from("user_progress").upsert({
    user_id: user.id,
    xp: body.xp ?? 0,
    streak: body.streak ?? 0,
    last_active_date: body.lastActiveDate ?? null,
    characters_learned: body.charactersLearned ?? [],
    vocab_learned: body.vocabLearned ?? [],
    completed_lessons: body.completedLessons ?? [],
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
