import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// POST /api/lessons/[id]/complete — mark a lesson done for the current user.
// Appends to user_progress.completed_lessons (text[]) and bumps XP by a small
// amount. Idempotent: re-hitting it is a no-op (no double XP).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Confirm the lesson exists + is published — prevents arbitrary string spam.
  const { data: lesson } = await supabase
    .from("lessons").select("id, published, hsk_level, lesson_no").eq("id", id).maybeSingle();
  if (!lesson || !lesson.published) {
    return NextResponse.json({ error: "lesson not found" }, { status: 404 });
  }

  const { data: progress } = await supabase
    .from("user_progress").select("completed_lessons, xp").eq("user_id", user.id).maybeSingle();
  const already = (progress?.completed_lessons ?? []).includes(id);
  if (already) return NextResponse.json({ ok: true, awarded: 0 });

  const award = 25; // per lesson
  const nextLessons = [...(progress?.completed_lessons ?? []), id];
  const nextXp = (progress?.xp ?? 0) + award;

  // Upsert keeps things working even if user_progress row hasn't been created
  // for this user yet (handle_new_user trigger should have, but be defensive).
  const { error } = await supabase.from("user_progress").upsert({
    user_id: user.id,
    completed_lessons: nextLessons,
    xp: nextXp,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("user_events").insert([
    { user_id: user.id, event_type: "lesson_completed", payload: { lesson_id: id, hsk_level: lesson.hsk_level, lesson_no: lesson.lesson_no } },
    { user_id: user.id, event_type: "xp_gained",        payload: { amount: award, source: "lesson" } },
  ]);

  return NextResponse.json({ ok: true, awarded: award });
}
