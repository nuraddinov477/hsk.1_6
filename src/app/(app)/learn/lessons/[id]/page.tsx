"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle2, Clock, Sparkles, Volume2 } from "lucide-react";
import { Markdown } from "@/lib/markdown";
import { useLocale } from "@/lib/i18n/provider";
import { markLessonComplete } from "@/lib/learn-store";

type Lang = "uz" | "ru" | "en";

type Lesson = {
  id: string;
  hsk_level: number;
  lesson_no: number;
  title: Record<Lang, string | undefined>;
  body:  Record<Lang, string | undefined>;
  vocab_words: string[];
  char_hanzis: string[];
  est_minutes: number;
  audio_url: string | null;
};
type Vocab = { word: string; pinyin: string; meaning: Record<Lang, string | undefined>; hsk_level: number };
type Char  = { hanzi: string; pinyin: string; meaning: Record<Lang, string | undefined>; hsk_level: number };

export default function LessonReader() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { locale } = useLocale();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [vocab, setVocab] = useState<Vocab[]>([]);
  const [chars, setChars] = useState<Char[]>([]);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const r = await fetch(`/api/lessons/${id}`);
      if (!r.ok) { if (alive) setLoading(false); return; }
      const j = await r.json();
      if (!alive) return;
      setLesson(j.lesson); setVocab(j.vocab); setChars(j.chars); setCompleted(j.completed);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [id]);

  const title = useMemo(() => lesson?.title?.[locale] ?? lesson?.title?.uz ?? lesson?.title?.en ?? "", [lesson, locale]);
  const body  = useMemo(() => lesson?.body?.[locale]  ?? lesson?.body?.uz  ?? lesson?.body?.en  ?? "", [lesson, locale]);

  async function complete() {
    if (!lesson || completed || completing) return;
    setCompleting(true);
    const r = await fetch(`/api/lessons/${lesson.id}/complete`, { method: "POST" });
    if (r.ok) {
      setCompleted(true);
      // Mirror locally so dashboard + sidebar streak indicators react instantly.
      markLessonComplete(lesson.id);
    }
    setCompleting(false);
  }

  function playAudio() {
    if (!lesson?.audio_url) return;
    new Audio(lesson.audio_url).play().catch(() => {});
  }

  if (loading) {
    return <div className="space-y-4">
      <div className="h-6 w-40 animate-pulse rounded bg-muted" />
      <div className="h-32 animate-pulse rounded-2xl bg-muted" />
    </div>;
  }
  if (!lesson) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
        <p className="text-sm font-medium">Dars topilmadi</p>
        <Link href="/learn/lessons" className="mt-3 inline-block text-sm text-brand hover:underline">← Darslar ro&apos;yxati</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Orqaga
      </button>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-brand/10 px-2.5 py-1 font-semibold text-brand">HSK {lesson.hsk_level} · Dars {lesson.lesson_no}</span>
          <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> ≈ {lesson.est_minutes} daq</span>
          {completed && <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 font-semibold text-green-700 dark:text-green-400"><CheckCircle2 className="h-3 w-3" /> Tugatildi</span>}
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {lesson.audio_url && (
          <button
            onClick={playAudio}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-4 text-xs font-medium hover:bg-muted"
          >
            <Volume2 className="h-3.5 w-3.5" /> Audio tinglash
          </button>
        )}
      </header>

      {/* Markdown body */}
      <article className="rounded-2xl border border-border bg-background p-6">
        <Markdown text={body} />
      </article>

      {/* Vocab */}
      {vocab.length > 0 && (
        <section className="rounded-2xl border border-border bg-background p-6">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Sparkles className="h-4 w-4 text-brand" /> Yangi so&apos;zlar ({vocab.length})
          </h2>
          <div className="divide-y divide-border">
            {vocab.map((v) => (
              <div key={v.word} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-2.5">
                <div className="font-cn text-xl font-bold">{v.word}</div>
                <div>
                  <div className="text-xs text-muted-foreground">{v.pinyin}</div>
                  <div className="text-sm">{v.meaning[locale] ?? v.meaning.uz ?? v.meaning.en}</div>
                </div>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">HSK {v.hsk_level}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Characters */}
      {chars.length > 0 && (
        <section className="rounded-2xl border border-border bg-background p-6">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <BookOpen className="h-4 w-4 text-brand" /> Ierogliflar ({chars.length})
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {chars.map((c) => (
              <div key={c.hanzi} className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                <div className="font-cn text-3xl font-bold">{c.hanzi}</div>
                <div className="mt-1 text-xs text-muted-foreground">{c.pinyin}</div>
                <div className="text-xs">{c.meaning[locale] ?? c.meaning.uz}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Complete CTA */}
      <div className="sticky bottom-4 z-10">
        <button
          onClick={complete}
          disabled={completed || completing}
          className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition ${
            completed
              ? "bg-green-500/15 text-green-700 dark:text-green-400"
              : "bg-brand text-brand-foreground hover:opacity-90"
          } disabled:opacity-70`}
        >
          {completed ? (
            <><CheckCircle2 className="h-4 w-4" /> Dars tugatilgan · +25 XP olingan</>
          ) : completing ? (
            "Saqlanmoqda…"
          ) : (
            <>Darsni tugatdim · <span className="rounded-full bg-brand-foreground/20 px-2 py-0.5 text-[11px]">+25 XP</span></>
          )}
        </button>
      </div>
    </div>
  );
}
