"use client";

import { useMemo, useState } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

// Bulk import: paste CSV/TSV → parse → preview → POST batch.
// Format expected:
//   vocabulary: word, pinyin, hsk_level, uz, ru, en
//   characters: hanzi, pinyin, hsk_level, uz, ru, en

type Kind = "vocabulary" | "characters";

type ParsedRow = {
  word?: string; hanzi?: string; pinyin: string; hskLevel: number;
  uz: string; ru: string; en: string;
};

function parseRows(text: string, kind: Kind): { rows: ParsedRow[]; errors: number } {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows: ParsedRow[] = [];
  let errors = 0;
  for (const line of lines) {
    // Split on tab or comma (prefer tab to allow commas in fields).
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

export function ImportTab() {
  const [kind, setKind] = useState<Kind>("vocabulary");
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ inserted: number; total: number; error: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const parsed = useMemo(() => parseRows(text, kind), [text, kind]);

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

  const example = kind === "vocabulary"
    ? "学习\txué xí\t1\to'rganmoq\tучиться\tto study\n你好\tnǐ hǎo\t1\tsalom\tпривет\thello"
    : "学\txué\t1\to'qimoq\tучить\tto learn\n好\thǎo\t1\tyaxshi\tхороший\tgood";

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-background p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Upload className="h-5 w-5 text-brand" /> Ko&apos;p kontent yuklash
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Excel yoki Google Sheets dan nusxa olib joylang. Har qator bitta yozuv. Bo&apos;sh ustun bo&apos;lmasin.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setKind("vocabulary")}
            className={`h-9 rounded-full px-4 text-sm font-medium ${
              kind === "vocabulary" ? "bg-brand text-brand-foreground" : "border border-border"
            }`}
          >Lug&apos;at</button>
          <button
            onClick={() => setKind("characters")}
            className={`h-9 rounded-full px-4 text-sm font-medium ${
              kind === "characters" ? "bg-brand text-brand-foreground" : "border border-border"
            }`}
          >Ieroglif</button>
        </div>

        <div className="mt-4 rounded-xl bg-muted/40 p-3 text-xs">
          <div className="mb-1 flex items-center gap-1.5 font-semibold">
            <FileText className="h-3.5 w-3.5" /> Format ({kind === "vocabulary" ? "so'z" : "ieroglif"}, tab yoki vergul bilan)
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">
            {kind === "vocabulary" ? "word" : "hanzi"} | pinyin | hsk_level | uz | ru | en
          </div>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-background p-2 font-cn text-[11px] text-foreground">{example}</pre>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder="Excel dan nusxa olib bu yerga joylang…"
          className="font-cn mt-3 block w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-brand"
        />

        <div className="mt-2 flex items-center justify-between text-xs">
          <div className="text-muted-foreground">
            {parsed.rows.length > 0 && <span className="text-green-600 font-medium">✓ {parsed.rows.length} qator tayyor</span>}
            {parsed.errors > 0 && <span className="ml-2 text-orange-600">⚠ {parsed.errors} qator noto&apos;g&apos;ri</span>}
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
            <div className="font-semibold">{result.inserted} / {result.total} qator qo&apos;shildi</div>
            {result.error && <div className="mt-1 text-xs">Xato: {result.error}</div>}
          </div>
        </div>
      )}

      {parsed.rows.length > 0 && (
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
                {parsed.rows.slice(0, 10).map((r, i) => (
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
    </div>
  );
}
