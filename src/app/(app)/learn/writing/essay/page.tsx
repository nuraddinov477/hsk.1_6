"use client";

import { useState } from "react";
import { Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

type Feedback = {
  score: number;
  level_estimate?: string;
  strengths?: string[];
  weaknesses?: string[];
  grammar_issues?: { wrong: string; correct: string; explain: string }[];
  suggested_revision?: string;
};

export default function EssayPage() {
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!draft.trim() || loading) return;
    setLoading(true);
    setError(null);
    setFeedback(null);
    const r = await fetch("/api/ai/writing", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt.trim() || undefined, draft: draft.trim() }),
    });
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { error?: string; message?: string };
      setError(j.message ?? j.error ?? "Xato yuz berdi");
    } else {
      setFeedback(await r.json());
    }
    setLoading(false);
  }

  const scoreColor = !feedback ? "" :
    feedback.score >= 80 ? "text-green-600" :
    feedback.score >= 60 ? "text-yellow-600" :
                           "text-red-600";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <Sparkles className="h-6 w-6 text-brand" /> AI Insho baholash
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Xitoycha inshongizni yozing — AI darhol band-ball, kuchli/zaif tomonlari va grammar xatolarini ko&apos;rsatadi.
        </p>
      </header>

      <div className="space-y-3 rounded-2xl border border-border bg-background p-5">
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Topshiriq (ixtiyoriy)</span>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Masalan: O'z oilam haqida 100 ta ieroglif yozing"
            className="mt-1 block h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Insho matni (xitoycha)</span>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="我叫…  我今年…  我喜欢…"
            rows={8}
            className="font-cn mt-1 block w-full rounded-lg border border-border bg-background p-3 text-base outline-none focus:border-brand"
          />
          <div className="mt-1 text-right text-xs text-muted-foreground">{draft.length} / 4000</div>
        </label>
        <button
          onClick={submit}
          disabled={!draft.trim() || loading}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-6 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Tahlil qilinmoqda…" : <><Sparkles className="h-4 w-4" /> Baholash</>}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {feedback && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-background p-5">
            <div className="text-center">
              <div className={`text-5xl font-bold tabular-nums ${scoreColor}`}>{feedback.score}</div>
              <div className="text-xs text-muted-foreground">/ 100</div>
            </div>
            <div>
              <div className="text-sm font-medium">Taxminiy daraja</div>
              <div className="text-xl font-semibold text-brand">{feedback.level_estimate ?? "—"}</div>
            </div>
          </div>

          {feedback.strengths && feedback.strengths.length > 0 && (
            <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-700">
                <CheckCircle2 className="h-4 w-4" /> Kuchli tomonlari
              </h2>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {feedback.weaknesses && feedback.weaknesses.length > 0 && (
            <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-orange-700">
                <AlertCircle className="h-4 w-4" /> Yaxshilash kerak
              </h2>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {feedback.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {feedback.grammar_issues && feedback.grammar_issues.length > 0 && (
            <div className="rounded-2xl border border-border bg-background p-5">
              <h2 className="mb-3 text-sm font-semibold">Grammatik xatolar</h2>
              <ul className="space-y-3">
                {feedback.grammar_issues.map((g, i) => (
                  <li key={i} className="rounded-xl bg-muted p-3 text-sm">
                    <div><span className="text-red-600 line-through font-cn">{g.wrong}</span> → <span className="text-green-700 font-cn">{g.correct}</span></div>
                    <div className="mt-1 text-xs text-muted-foreground">{g.explain}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedback.suggested_revision && (
            <div className="rounded-2xl border border-brand/30 bg-brand/5 p-5">
              <h2 className="mb-2 text-sm font-semibold">Tavsiya etilgan tahrir</h2>
              <p className="font-cn text-base leading-relaxed">{feedback.suggested_revision}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
