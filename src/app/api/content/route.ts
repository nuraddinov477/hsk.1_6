import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Public content read. Returns admin-managed content from the DB, mapped to
// the app's client types. The app merges this on top of its built-in TS data,
// so this can be empty (or unreachable) and the app still works.
export async function GET() {
  const supabase = await createClient();

  const [chars, vocab, passages, examQs] = await Promise.all([
    supabase.from("characters").select("*").order("created_at", { ascending: true }),
    supabase.from("vocabulary").select("*").order("created_at", { ascending: true }),
    supabase.from("passages").select("*").order("created_at", { ascending: true }),
    supabase.from("exam_questions").select("*").order("created_at", { ascending: true }),
  ]);

  return NextResponse.json({
    characters: (chars.data ?? []).map((c) => ({
      hanzi: c.hanzi,
      pinyin: c.pinyin,
      meaning: c.meaning,
      hskLevel: c.hsk_level,
    })),
    vocabulary: (vocab.data ?? []).map((v) => ({
      id: v.id,
      word: v.word,
      pinyin: v.pinyin,
      meaning: v.meaning,
      hskLevel: v.hsk_level,
      exampleZh: v.example_zh ?? undefined,
      examplePinyin: v.example_pinyin ?? undefined,
      example: v.example ?? undefined,
    })),
    passages: (passages.data ?? []).map((p) => ({
      id: p.id,
      hskLevel: p.hsk_level,
      title: p.title,
      text: p.text,
      pinyin: p.pinyin,
      translation: p.translation,
      question: p.question,
      options: p.options,
    })),
    examQuestions: (examQs.data ?? []).map((q) => ({
      id: q.id,
      level: q.level,
      section: q.section,
      audio: q.audio ?? undefined,
      passage: q.passage ?? undefined,
      passagePinyin: q.passage_pinyin ?? undefined,
      term: q.term ?? undefined,
      termPinyin: q.term_pinyin ?? undefined,
      prompt: q.prompt,
      choices: q.choices,
    })),
  });
}
