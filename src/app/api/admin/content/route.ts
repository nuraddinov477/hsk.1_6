import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Admin content management. Writes are also enforced by RLS (admin-only),
// but we check the role here too for clean 401/403 responses.
const TABLES = ["vocabulary", "characters", "passages", "exam_questions"] as const;
type ContentType = (typeof TABLES)[number];

async function requireAdmin(): Promise<
  { supabase: SupabaseClient; ok: true } | { ok: false; status: number }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401 };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { ok: false, status: 403 };
  return { supabase, ok: true };
}

// Map a client payload to its DB row (snake_case columns, JSONB fields as-is).
function toRow(type: ContentType, d: Record<string, unknown>): Record<string, unknown> {
  switch (type) {
    case "vocabulary":
      return { word: d.word, pinyin: d.pinyin, meaning: d.meaning, hsk_level: d.hskLevel,
        example_zh: d.exampleZh || null, example_pinyin: d.examplePinyin || null, example: d.example || null };
    case "characters":
      return { hanzi: d.hanzi, pinyin: d.pinyin, meaning: d.meaning, hsk_level: d.hskLevel };
    case "passages":
      return { hsk_level: d.hskLevel, title: d.title, text: d.text, pinyin: d.pinyin,
        translation: d.translation, question: d.question, options: d.options };
    case "exam_questions":
      return { level: d.level, section: d.section, audio: d.audio || null, passage: d.passage || null,
        passage_pinyin: d.passagePinyin || null, term: d.term || null, term_pinyin: d.termPinyin || null,
        prompt: d.prompt, choices: d.choices };
  }
}

function parseType(value: string | null): ContentType | null {
  return TABLES.includes(value as ContentType) ? (value as ContentType) : null;
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const type = parseType(new URL(request.url).searchParams.get("type"));
  if (!type) return NextResponse.json({ error: "bad type" }, { status: 400 });

  const { data, error } = await auth.supabase.from(type).select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const body = await request.json();
  const type = parseType(body.type);
  if (!type) return NextResponse.json({ error: "bad type" }, { status: 400 });

  const { data, error } = await auth.supabase.from(type).insert(toRow(type, body.data ?? {})).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  const type = parseType(params.get("type"));
  const id = params.get("id");
  if (!type || !id) return NextResponse.json({ error: "type and id required" }, { status: 400 });

  const { error } = await auth.supabase.from(type).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
