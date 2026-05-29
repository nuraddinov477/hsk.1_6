import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Bulk import — accepts an array of vocabulary / characters rows already
// parsed on the client. Inserts in chunks so a single bad row doesn't
// abort the whole batch. Admin-only.

const ALLOWED = ["vocabulary", "characters"] as const;
type Kind = (typeof ALLOWED)[number];

type VocabRow = { word: string; pinyin: string; hskLevel: number; uz: string; ru: string; en: string };
type CharRow  = { hanzi: string; pinyin: string; hskLevel: number; uz: string; ru: string; en: string };

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

  // Map + filter empty/invalid rows.
  const mapped = kind === "vocabulary"
    ? (rows as VocabRow[]).filter((r) => r.word?.trim() && r.pinyin?.trim() && r.uz?.trim()).map(toVocabDb)
    : (rows as CharRow[]).filter((r) => r.hanzi?.trim() && r.pinyin?.trim() && r.uz?.trim()).map(toCharDb);

  if (mapped.length === 0) {
    return NextResponse.json({ error: "no valid rows" }, { status: 400 });
  }

  // Insert in chunks of 200.
  let inserted = 0;
  let firstError: string | null = null;
  for (let i = 0; i < mapped.length; i += 200) {
    const chunk = mapped.slice(i, i + 200);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.from(kind).insert(chunk as any).select("id");
    if (error) {
      if (!firstError) firstError = error.message;
    } else {
      inserted += data?.length ?? 0;
    }
  }
  return NextResponse.json({ inserted, total: mapped.length, error: firstError });
}
