"use client";

import { useMemo, useState } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2, BookOpen } from "lucide-react";

// Bulk import has two flavours:
//
// 1) Vocabulary / Characters — TSV (Excel paste).
//    Columns: word|hanzi, pinyin, hsk_level, uz, ru, en
//
// 2) Lessons — JSON paste (array of lesson objects). Lessons carry markdown
//    bodies + multilingual titles, so a flat TSV doesn't fit; JSON is more
//    natural and the admin can edit it in any code editor / generate it with
//    a script. Re-importing the same (hsk_level, lesson_no) upserts.

type Kind = "vocabulary" | "characters" | "lessons";

type VocabCharRow = {
  word?: string; hanzi?: string; pinyin: string; hskLevel: number;
  uz: string; ru: string; en: string;
};
type LessonRow = {
  hsk_level: number; lesson_no: number;
  title: { uz: string; ru?: string; en?: string };
  body:  { uz: string; ru?: string; en?: string };
  vocab_words?: string[]; char_hanzis?: string[];
  est_minutes?: number; audio_url?: string; published?: boolean;
};

function parseTsv(text: string, kind: "vocabulary" | "characters"): { rows: VocabCharRow[]; errors: number } {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows: VocabCharRow[] = [];
  let errors = 0;
  for (const line of lines) {
    const cols = line.includes("\t") ? line.split("\t") : line.split(",");
    if (cols.length < 6) { errors++; continue; }
    const [first, pinyin, levelStr, uz, ru, en] = cols.map((c) => c.trim());
    const level = parseInt(levelStr, 10);
    if (!first || !pinyin || !uz || !ru || !en || !(level >= 1 && level <= 9)) { errors++; continue; }
    rows.push(kind === "vocabulary"
      ? { word: first, pinyin, hskLevel: level, uz, ru, en }
      : { hanzi: first, pinyin, hskLevel: level, uz, ru, en });
  }
  return { rows, errors };
}

function parseLessonsJson(text: string): { rows: LessonRow[]; errors: number; parseError: string | null } {
  if (!text.trim()) return { rows: [], errors: 0, parseError: null };
  let arr: unknown;
  try { arr = JSON.parse(text); } catch (e) {
    return { rows: [], errors: 0, parseError: e instanceof Error ? e.message : "JSON xato" };
  }
  if (!Array.isArray(arr)) return { rows: [], errors: 0, parseError: "JSON ro'yxat (array) bo'lishi kerak" };
  const rows: LessonRow[] = [];
  let errors = 0;
  for (const r of arr) {
    if (!r || typeof r !== "object") { errors++; continue; }
    const o = r as Record<string, unknown>;
    const lvl = Number(o.hsk_level), no = Number(o.lesson_no);
    const title = o.title as { uz?: string } | undefined;
    const body  = o.body  as { uz?: string } | undefined;
    if (!(lvl >= 1 && lvl <= 6) || !(no > 0) || !title?.uz || !body?.uz) {
      errors++; continue;
    }
    rows.push(o as unknown as LessonRow);
  }
  return { rows, errors, parseError: null };
}

const LESSON_EXAMPLE = `[
  {
    "hsk_level": 1,
    "lesson_no": 1,
    "title": { "uz": "1-dars: Salomlashish", "ru": "Урок 1: Приветствие", "en": "Lesson 1: Greetings" },
    "body":  {
      "uz": "# Salomlashish\\n\\nXitoy tilida salom \\"你好\\" deyiladi.\\n\\n**你 (nǐ)** — sen\\n**好 (hǎo)** — yaxshi",
      "ru": "# Приветствие\\n\\nПривет — это \\"你好\\".",
      "en": "# Greetings\\n\\nHello — \\"你好\\"."
    },
    "vocab_words": ["你好", "再见"],
    "char_hanzis": ["你", "好"],
    "est_minutes": 10
  }
]`;

export function ImportTab() {
  const [kind, setKind] = useState<Kind>("vocabulary");
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ inserted: number; total: number; error: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const parsed = useMemo(() => {
    if (kind === "lessons") return parseLessonsJson(text);
    const { rows, errors } = parseTsv(text, kind);
    return { rows, errors, parseError: null as string | null };
  }, [text, kind]);

  async function submit() {
    if (parsed.rows.length === 0 || submitting) return;
    setSubmitting(true);
    setResult(null);
    const r = await fetch("/api/admin/import", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: kind, rows: parsed.rows }),
    });
    const j = await r.json().catch(() => ({}));
    setResult(j);
    if (r.ok) setText("");
    setSubmitting(false);
  }

  const tsvExample = kind === "vocabulary"
    ? "学习\txué xí\t1\to'rganmoq\tучиться\tto study\n你好\tnǐ hǎo\t1\tsalom\tпривет\thello"
    : "学\txué\t1\to'qimoq\tучить\tto learn\n好\thǎo\t1\tyaxshi\tхороший\tgood";

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-background p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Upload className="h-5 w-5 text-brand" /> Ko&apos;p kontent yuklash
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Excel/Sheets (TSV) yoki JSON dan nusxa olib joylang.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["vocabulary", "characters", "lessons"] as Kind[]).map((k) => (
            <button
              key={k}
              onClick={() => { setKind(k); setText(""); setResult(null); }}
              className={`h-9 rounded-full px-4 text-sm font-medium ${
                kind === k ? "bg-brand text-brand-foreground" : "border border-border"
              }`}
            >
              {k === "vocabulary" ? "Lug'at" : k === "characters" ? "Ieroglif" : "Darslar"}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-xl bg-muted/40 p-3 text-xs">
          <div className="mb-1 flex items-center gap-1.5 font-semibold">
            <FileText className="h-3.5 w-3.5" />
            {kind === "lessons"
              ? "Format (JSON ro'yxat — har element bitta dars)"
              : `Format (${kind === "vocabulary" ? "so'z" : "ieroglif"}, tab yoki vergul bilan)`}
          </div>
          {kind === "lessons" ? (
            <>
              <div className="font-mono text-[11px] text-muted-foreground">
                {`{ hsk_level, lesson_no, title:{uz,ru,en}, body:{uz,ru,en}, vocab_words?, char_hanzis?, est_minutes?, audio_url?, published? }`}
              </div>
              <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-background p-2 font-mono text-[11px] text-foreground">{LESSON_EXAMPLE}</pre>
              <p className="mt-2 text-muted-foreground">
                Bir xil <code className="font-mono">hsk_level + lesson_no</code> qayta yuklansa — yangilanadi (upsert).
                <code className="font-mono"> body.uz</code> markdown qo&apos;llab-quvvatlaydi: <code>#</code>, <code>**bold**</code>, <code>*italic*</code>, ro&apos;yxatlar.
              </p>
            </>
          ) : (
            <>
              <div className="font-mono text-[11px] text-muted-foreground">
                {kind === "vocabulary" ? "word" : "hanzi"} | pinyin | hsk_level | uz | ru | en
              </div>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-background p-2 font-cn text-[11px] text-foreground">{tsvExample}</pre>
            </>
          )}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={kind === "lessons" ? 14 : 10}
          placeholder={kind === "lessons" ? "JSON ni bu yerga joylang…" : "Excel dan nusxa olib bu yerga joylang…"}
          className={`mt-3 block w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-brand ${kind === "lessons" ? "font-mono" : "font-cn"}`}
        />

        <div className="mt-2 flex items-center justify-between text-xs">
          <div className="text-muted-foreground">
            {parsed.rows.length > 0 && <span className="font-medium text-green-600">✓ {parsed.rows.length} ta yozuv tayyor</span>}
            {parsed.errors > 0 && <span className="ml-2 text-orange-600">⚠ {parsed.errors} ta noto&apos;g&apos;ri</span>}
            {parsed.parseError && <span className="ml-2 text-red-600">JSON xato: {parsed.parseError}</span>}
          </div>
          <button
            onClick={submit}
            disabled={parsed.rows.length === 0 || submitting}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-5 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Yuklanmoqda…" : <>Yuklash ({parsed.rows.length})</>}
          </button>
        </div>
      </div>

      {result && (
        <div className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
          result.error ? "border-orange-500/30 bg-orange-500/5" : "border-green-500/30 bg-green-500/5"
        }`}>
          {result.error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                        : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />}
          <div>
            <div className="font-semibold">{result.inserted} / {result.total} ta yozuv qo&apos;shildi</div>
            {result.error && <div className="mt-1 text-xs">Xato: {result.error}</div>}
          </div>
        </div>
      )}

      {parsed.rows.length > 0 && kind !== "lessons" && (
        <div className="rounded-2xl border border-border bg-background p-5">
          <h3 className="mb-3 text-sm font-semibold">Birinchi 10 qator namuna</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="px-2 py-1 text-left">{kind === "vocabulary" ? "So'z" : "Ieroglif"}</th>
                  <th className="px-2 py-1 text-left">Pinyin</th>
                  <th className="px-2 py-1 text-left">HSK</th>
                  <th className="px-2 py-1 text-left">UZ</th>
                  <th className="px-2 py-1 text-left">RU</th>
                  <th className="px-2 py-1 text-left">EN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(parsed.rows as VocabCharRow[]).slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1 font-cn">{r.word ?? r.hanzi}</td>
                    <td className="px-2 py-1">{r.pinyin}</td>
                    <td className="px-2 py-1 tabular-nums">{r.hskLevel}</td>
                    <td className="px-2 py-1">{r.uz}</td>
                    <td className="px-2 py-1">{r.ru}</td>
                    <td className="px-2 py-1">{r.en}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {parsed.rows.length > 0 && kind === "lessons" && (
        <div className="rounded-2xl border border-border bg-background p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="h-4 w-4 text-brand" /> Dars namunalari ({parsed.rows.length} ta)
          </h3>
          <div className="space-y-2">
            {(parsed.rows as LessonRow[]).slice(0, 8).map((l, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <span className="rounded bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                  HSK {l.hsk_level} · #{l.lesson_no}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{l.title.uz}</div>
                  <div className="line-clamp-1 text-xs text-muted-foreground">{l.body.uz.replace(/[#*\n]/g, " ").slice(0, 120)}</div>
                  <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
                    {l.vocab_words?.length ? <span>📝 {l.vocab_words.length} so&apos;z</span> : null}
                    {l.char_hanzis?.length ? <span>汉 {l.char_hanzis.length} ieroglif</span> : null}
                    {l.est_minutes ? <span>⏱ {l.est_minutes} daq</span> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
