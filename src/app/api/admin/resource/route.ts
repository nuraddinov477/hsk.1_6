import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Generic admin resource API. One endpoint covers list + create for every
// content table, so adding a new admin model boils down to flipping a string
// in TABLES (and registering it on the client). Per-row reads, updates and
// deletes live in /api/admin/resource/[id]/route.ts.
//
// GET  /api/admin/resource?type=X&page=1&page_size=25&q=foo&level=4&sort=created_at&order=desc
//   → { rows, total, page, page_size }
// POST /api/admin/resource     { type, data }    → row
// POST /api/admin/resource     { type, action: 'bulk_delete', ids: [] }  → { deleted }

const TABLES = ["vocabulary", "characters", "passages", "exam_questions", "lessons"] as const;
type T = (typeof TABLES)[number];

// Columns we'll match against the `q` (search) query, per table.
const SEARCHABLE: Record<T, string[]> = {
  vocabulary:     ["word", "pinyin"],
  characters:     ["hanzi", "pinyin"],
  passages:       ["text", "pinyin"],
  exam_questions: ["audio", "term", "passage"],
  lessons:        [], // lesson titles are jsonb; we filter client-side for now
};

// The HSK-level column has a different name on exam_questions ("level").
const LEVEL_COL: Record<T, string> = {
  vocabulary: "hsk_level", characters: "hsk_level", passages: "hsk_level",
  lessons: "hsk_level", exam_questions: "level",
};

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

// Adapt client camelCase to db snake_case for inserts/updates.
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
      return {
        hanzi: d.hanzi, pinyin: d.pinyin, meaning: d.meaning,
        hsk_level: d.hskLevel ?? d.hsk_level,
      };
    case "passages":
      return {
        hsk_level: d.hskLevel ?? d.hsk_level,
        title: d.title, text: d.text, pinyin: d.pinyin,
        translation: d.translation, question: d.question, options: d.options,
      };
    case "exam_questions":
      return {
        level: d.level, section: d.section,
        audio: d.audio ?? null, passage: d.passage ?? null,
        passage_pinyin: d.passagePinyin ?? d.passage_pinyin ?? null,
        term: d.term ?? null,
        term_pinyin: d.termPinyin ?? d.term_pinyin ?? null,
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
      };
  }
}

async function logAction(supabase: SupabaseClient, userId: string, kind: string, payload: Record<string, unknown>) {
  // Best-effort; failure to log shouldn't break the action.
  await supabase.from("user_events").insert({
    user_id: userId, event_type: kind, payload,
  });
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });
  const { supabase } = auth;

  const url = new URL(request.url);
  const type = parseType(url.searchParams.get("type"));
  if (!type) return NextResponse.json({ error: "bad type" }, { status: 400 });

  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(200, Math.max(5, Number(url.searchParams.get("page_size") ?? "25")));
  const q = (url.searchParams.get("q") ?? "").trim();
  const level = Number(url.searchParams.get("level") ?? "0");
  const sort = url.searchParams.get("sort") ?? "created_at";
  const order = (url.searchParams.get("order") ?? "desc") === "asc" ? "asc" : "desc";

  let query = supabase.from(type).select("*", { count: "exact" });

  if (level >= 1 && level <= 6) query = query.eq(LEVEL_COL[type], level);

  // Substring search across whitelisted columns (OR-joined). Lessons skip this
  // because their title is a jsonb; we handle that client-side after fetch.
  if (q && SEARCHABLE[type].length > 0) {
    const ors = SEARCHABLE[type].map((c) => `${c}.ilike.%${q}%`).join(",");
    query = query.or(ors);
  }

  query = query.order(sort, { ascending: order === "asc" });

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let rows = data ?? [];
  // Client-side filter for lessons title search (jsonb).
  if (type === "lessons" && q) {
    const needle = q.toLowerCase();
    rows = rows.filter((r: Record<string, unknown>) => {
      const t = (r.title ?? {}) as Record<string, string>;
      return Object.values(t).some((v) => (v ?? "").toLowerCase().includes(needle));
    });
  }

  return NextResponse.json({
    rows, total: count ?? rows.length, page, page_size: pageSize,
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });
  const { supabase, userId } = auth;

  const body = (await request.json().catch(() => ({}))) as {
    type?: string; data?: Record<string, unknown>;
    action?: "bulk_delete"; ids?: string[];
  };
  const type = parseType(body.type ?? null);
  if (!type) return NextResponse.json({ error: "bad type" }, { status: 400 });

  // Bulk delete: { type, action: 'bulk_delete', ids: [...] }
  if (body.action === "bulk_delete") {
    const ids = Array.isArray(body.ids) ? body.ids.filter((x) => typeof x === "string") : [];
    if (ids.length === 0) return NextResponse.json({ error: "no ids" }, { status: 400 });
    const { error, count } = await supabase.from(type).delete({ count: "exact" }).in("id", ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAction(supabase, userId, "admin_bulk_delete", { type, count: count ?? ids.length });
    return NextResponse.json({ deleted: count ?? ids.length });
  }

  // Single insert: { type, data: {...} }
  const row = toRow(type, body.data ?? {});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.from(type).insert(row as any).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAction(supabase, userId, "admin_create", { type, id: (data as { id?: string } | null)?.id });
  return NextResponse.json(data);
}
