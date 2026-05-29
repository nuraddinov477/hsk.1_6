import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Per-row admin operations: GET (read), PATCH (update), DELETE.
// `type` arrives as a query string (?type=vocabulary) since the path slot is
// already taken by the row id — keeps the URL flat and the schema simple.

const TABLES = ["vocabulary", "characters", "passages", "exam_questions", "lessons"] as const;
type T = (typeof TABLES)[number];

function parseType(v: string | null): T | null {
  return TABLES.includes(v as T) ? (v as T) : null;
}

async function requireAdmin(): Promise<
  { supabase: SupabaseClient; userId: string; ok: true } | { ok: false; status: number }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401 };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { ok: false, status: 403 };
  return { supabase, userId: user.id, ok: true };
}

function toRow(type: T, d: Record<string, unknown>): Record<string, unknown> {
  switch (type) {
    case "vocabulary":
      return {
        word: d.word, pinyin: d.pinyin, meaning: d.meaning,
        hsk_level: d.hskLevel ?? d.hsk_level,
        example_zh: d.exampleZh ?? d.example_zh ?? null,
        example_pinyin: d.examplePinyin ?? d.example_pinyin ?? null,
        example: d.example ?? null,
      };
    case "characters":
      return { hanzi: d.hanzi, pinyin: d.pinyin, meaning: d.meaning, hsk_level: d.hskLevel ?? d.hsk_level };
    case "passages":
      return {
        hsk_level: d.hskLevel ?? d.hsk_level, title: d.title, text: d.text, pinyin: d.pinyin,
        translation: d.translation, question: d.question, options: d.options,
      };
    case "exam_questions":
      return {
        level: d.level, section: d.section,
        audio: d.audio ?? null, passage: d.passage ?? null,
        passage_pinyin: d.passagePinyin ?? d.passage_pinyin ?? null,
        term: d.term ?? null, term_pinyin: d.termPinyin ?? d.term_pinyin ?? null,
        prompt: d.prompt, choices: d.choices,
      };
    case "lessons":
      return {
        hsk_level: d.hsk_level ?? d.hskLevel,
        lesson_no: d.lesson_no ?? d.lessonNo,
        title: d.title, body: d.body,
        vocab_words: d.vocab_words ?? d.vocabWords ?? [],
        char_hanzis: d.char_hanzis ?? d.charHanzis ?? [],
        audio_url: d.audio_url ?? d.audioUrl ?? null,
        est_minutes: d.est_minutes ?? d.estMinutes ?? 15,
        published: d.published ?? true,
        updated_at: new Date().toISOString(),
      };
  }
}

async function logAction(supabase: SupabaseClient, userId: string, kind: string, payload: Record<string, unknown>) {
  await supabase.from("user_events").insert({ user_id: userId, event_type: kind, payload });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const { id } = await params;
  const type = parseType(new URL(request.url).searchParams.get("type"));
  if (!type) return NextResponse.json({ error: "bad type" }, { status: 400 });

  const { data, error } = await auth.supabase.from(type).select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const { id } = await params;
  const url = new URL(request.url);
  const type = parseType(url.searchParams.get("type"));
  if (!type) return NextResponse.json({ error: "bad type" }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const row = toRow(type, body);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await auth.supabase.from(type).update(row as any).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAction(auth.supabase, auth.userId, "admin_update", { type, id });
  return NextResponse.json(data);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const { id } = await params;
  const type = parseType(new URL(request.url).searchParams.get("type"));
  if (!type) return NextResponse.json({ error: "bad type" }, { status: 400 });

  const { error } = await auth.supabase.from(type).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAction(auth.supabase, auth.userId, "admin_delete", { type, id });
  return NextResponse.json({ ok: true });
}
