import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Bulk import — accepts an array of vocabulary / characters rows already
// parsed on the client. Inserts in chunks so a single bad row doesn't
// abort the whole batch. Admin-only.

const ALLOWED = ["vocabulary", "characters", "lessons"] as const;
type Kind = (typeof ALLOWED)[number];

type VocabRow = { word: string; pinyin: string; hskLevel: number; uz: string; ru: string; en: string };
type CharRow  = { hanzi: string; pinyin: string; hskLevel: number; uz: string; ru: string; en: string };
type LessonRow = {
  hsk_level: number;
  lesson_no: number;
  title: { uz: string; ru?: string; en?: string };
  body:  { uz: string; ru?: string; en?: string };
  vocab_words?: string[];
  char_hanzis?: string[];
  est_minutes?: number;
  audio_url?: string;
  published?: boolean;
};

function toVocabDb(r: VocabRow) {
  return {
    word: r.word, pinyin: r.pinyin, hsk_level: r.hskLevel,
    meaning: { uz: r.uz, ru: r.ru, en: r.en },
  };
}
function toCharDb(r: CharRow) {
  return {
    hanzi: r.hanzi, pinyin: r.pinyin, hsk_level: r.hskLevel,
    meaning: { uz: r.uz, ru: r.ru, en: r.en },
  };
}
function toLessonDb(r: LessonRow) {
  return {
    hsk_level:   r.hsk_level,
    lesson_no:   r.lesson_no,
    title:       r.title,
    body:        r.body,
    vocab_words: r.vocab_words ?? [],
    char_hanzis: r.char_hanzis ?? [],
    est_minutes: r.est_minutes ?? 15,
    audio_url:   r.audio_url ?? null,
    published:   r.published ?? true,
  };
}
function isValidLesson(r: unknown): r is LessonRow {
  if (!r || typeof r !== "object") return false;
  const o = r as Record<string, unknown>;
  const lvl = Number(o.hsk_level), no = Number(o.lesson_no);
  if (!(lvl >= 1 && lvl <= 6) || !(no > 0)) return false;
  const title = o.title as { uz?: string } | undefined;
  const body  = o.body  as { uz?: string } | undefined;
  if (!title?.uz || !body?.uz) return false;
  return true;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { type?: string; rows?: unknown[] };
  const kind = ALLOWED.includes(body.type as Kind) ? (body.type as Kind) : null;
  if (!kind) return NextResponse.json({ error: "bad type" }, { status: 400 });

  const rows = body.rows ?? [];
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows required" }, { status: 400 });
  }
  if (rows.length > 2000) {
    return NextResponse.json({ error: "too many rows (max 2000)" }, { status: 400 });
  }

  // Map + filter empty/invalid rows. Lessons go through the upsert path so
  // re-importing the same (hsk_level, lesson_no) updates rather than dupes.
  const mapped =
    kind === "vocabulary"
      ? (rows as VocabRow[]).filter((r) => r.word?.trim() && r.pinyin?.trim() && r.uz?.trim()).map(toVocabDb)
      : kind === "characters"
      ? (rows as CharRow[]).filter((r) => r.hanzi?.trim() && r.pinyin?.trim() && r.uz?.trim()).map(toCharDb)
      : rows.filter(isValidLesson).map(toLessonDb);

  if (mapped.length === 0) {
    return NextResponse.json({ error: "no valid rows" }, { status: 400 });
  }

  // Insert (or upsert for lessons) in chunks of 200.
  let inserted = 0;
  let firstError: string | null = null;
  for (let i = 0; i < mapped.length; i += 200) {
    const chunk = mapped.slice(i, i + 200);
    const q = supabase.from(kind);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = kind === "lessons"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? await q.upsert(chunk as any, { onConflict: "hsk_level,lesson_no" }).select("id")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : await q.insert(chunk as any).select("id");
    if (res.error) {
      if (!firstError) firstError = res.error.message;
    } else {
      inserted += res.data?.length ?? 0;
    }
  }
  return NextResponse.json({ inserted, total: mapped.length, error: firstError });
}
