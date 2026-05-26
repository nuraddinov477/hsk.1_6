"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, X, ChevronRight, Volume2 } from "lucide-react";
import { PASSAGES, levelsIn } from "@/lib/learn-data";
import { useLocale, useT } from "@/lib/i18n/provider";
import { addXp, markLessonComplete } from "@/lib/learn-store";
import { LevelFilter, useStudyLevel } from "@/components/app/LevelFilter";

const AVAILABLE_LEVELS = levelsIn(PASSAGES);

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export default function ReadingPage() {
  const t = useT();
  const { locale } = useLocale();
  const [level] = useStudyLevel();
  const [index, setIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);

  const passages = useMemo(
    () => (level === "all" ? PASSAGES : PASSAGES.filter((p) => p.hskLevel === level)),
    [level],
  );

  // Restart from the first passage whenever the level filter changes.
  useEffect(() => {
    setIndex(0);
    setPicked(null);
    setShowTranslation(false);
  }, [level]);

  const passage = passages[index] ?? passages[0];

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const correct = passage.options[i].correct;
    if (correct) addXp(8);
    else addXp(2);
  }

  function next() {
    markLessonComplete(`reading:${passage.id}`);
    setPicked(null);
    setShowTranslation(false);
    setIndex((i) => (i + 1) % passages.length);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.app.reading.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{index + 1} / {passages.length}</p>
        </div>
        <LevelFilter available={AVAILABLE_LEVELS} />
      </header>

      <article className="rounded-2xl border border-border bg-background p-6">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{passage.title[locale]}</h2>
          <button onClick={() => speak(passage.text)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium hover:bg-muted">
            <Volume2 className="h-3.5 w-3.5" /> {t.app.listening.play}
          </button>
        </header>
        <p className="mt-4 font-cn text-2xl leading-relaxed">{passage.text}</p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">{passage.pinyin}</p>

        <button
          onClick={() => setShowTranslation((s) => !s)}
          className="mt-4 text-xs font-medium text-brand hover:underline"
        >
          {showTranslation ? t.app.reading.hideTranslation : t.app.reading.viewTranslation}
        </button>
        {showTranslation && (
          <p className="mt-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">{passage.translation[locale]}</p>
        )}
      </article>

      <div className="rounded-2xl border border-border bg-background p-6">
        <h3 className="text-base font-semibold">{t.app.reading.comprehension}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{passage.question[locale]}</p>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {passage.options.map((o, i) => {
            const isCorrect = !!o.correct;
            const isPicked = picked === i;
            const reveal = picked !== null;
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={picked !== null}
                className={`flex items-center justify-between rounded-xl border p-3 text-left text-sm transition ${
                  reveal && isCorrect
                    ? "border-green-500 bg-green-500/10"
                    : reveal && isPicked
                    ? "border-red-500 bg-red-500/10"
                    : "border-border bg-background hover:border-brand/40"
                } disabled:cursor-not-allowed`}
              >
                <span>
                  <span className="font-cn mr-2">{o.zh}</span>
                  <span className="text-xs text-muted-foreground">{o.label[locale]}</span>
                </span>
                {reveal && isCorrect && <Check className="h-4 w-4 text-green-600" />}
                {reveal && isPicked && !isCorrect && <X className="h-4 w-4 text-red-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {picked !== null && (
        <button
          onClick={next}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background hover:opacity-90"
        >
          {t.app.reading.nextPassage} <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
