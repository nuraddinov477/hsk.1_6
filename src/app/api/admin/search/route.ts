import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/admin/search?q=… — fuzzy search across users + every content table.
// Returns up to 5 matches per type with a deep-link href so the admin search
// dropdown can jump straight to the right edit page.

type Hit = {
  type: "user" | "vocabulary" | "characters" | "passages" | "lessons" | "exam_questions";
  label: string;       // primary display string
  sublabel?: string;   // secondary (pinyin/meaning/etc.)
  href: string;
};

const PER_TYPE = 5;

function ml(v: unknown): string {
  if (!v || typeof v !== "object" || Array.isArray(v)) return "";
  const o = v as Record<string, string | undefined>;
  return o.uz || o.ru || o.en || "";
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ hits: [] });

  const like = `%${q}%`;

  const [users, vocab, chars, passages, lessons, exams] = await Promise.all([
    supabase.from("admin_user_overview").select("user_id, email").ilike("email", like).limit(PER_TYPE),
    supabase.from("vocabulary").select("id, word, pinyin, meaning, hsk_level").or(`word.ilike.${like},pinyin.ilike.${like}`).limit(PER_TYPE),
    supabase.from("characters").select("id, hanzi, pinyin, meaning, hsk_level").or(`hanzi.ilike.${like},pinyin.ilike.${like}`).limit(PER_TYPE),
    supabase.from("passages").select("id, title, text, hsk_level").or(`text.ilike.${like},pinyin.ilike.${like}`).limit(PER_TYPE),
    supabase.from("lessons").select("id, title, hsk_level, lesson_no").limit(50),
    supabase.from("exam_questions").select("id, term, audio, passage, level").or(`term.ilike.${like},audio.ilike.${like},passage.ilike.${like}`).limit(PER_TYPE),
  ]);

  const hits: Hit[] = [];

  for (const u of users.data ?? []) {
    hits.push({ type: "user", label: u.email as string, href: `/admin/users/${u.user_id}` });
  }
  for (const v of vocab.data ?? []) {
    hits.push({
      type: "vocabulary",
      label: `${v.word} (${v.pinyin})`,
      sublabel: `HSK ${v.hsk_level} · ${ml(v.meaning)}`,
      href: `/admin/vocabulary/${v.id}`,
    });
  }
  for (const c of chars.data ?? []) {
    hits.push({
      type: "characters",
      label: `${c.hanzi} (${c.pinyin})`,
      sublabel: `HSK ${c.hsk_level} · ${ml(c.meaning)}`,
      href: `/admin/characters/${c.id}`,
    });
  }
  for (const p of passages.data ?? []) {
    hits.push({
      type: "passages",
      label: ml(p.title) || (p.text as string).slice(0, 40),
      sublabel: `HSK ${p.hsk_level} · ${(p.text as string).slice(0, 60)}…`,
      href: `/admin/passages/${p.id}`,
    });
  }
  // Lessons: title is jsonb so we filter in-memory.
  const needle = q.toLowerCase();
  for (const l of (lessons.data ?? []).slice(0, 100)) {
    const titles = Object.values((l.title ?? {}) as Record<string, string>);
    if (titles.some((t) => (t ?? "").toLowerCase().includes(needle))) {
      hits.push({
        type: "lessons",
        label: ml(l.title) || `Dars ${l.lesson_no}`,
        sublabel: `HSK ${l.hsk_level} · dars ${l.lesson_no}`,
        href: `/admin/lessons/${l.id}`,
      });
      if (hits.filter((h) => h.type === "lessons").length >= PER_TYPE) break;
    }
  }
  for (const e of exams.data ?? []) {
    const stim = (e.term as string) || (e.audio as string) || (e.passage as string) || "—";
    hits.push({
      type: "exam_questions",
      label: stim.slice(0, 40),
      sublabel: `HSK ${e.level}`,
      href: `/admin/exam_questions/${e.id}`,
    });
  }

  return NextResponse.json({ hits });
}
