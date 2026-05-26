"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { VOCAB } from "@/lib/learn-data";
import { useLocale, useT } from "@/lib/i18n/provider";
import { addExamScore, addXp, markLessonComplete } from "@/lib/learn-store";

const QUESTION_COUNT = 10;
const OPTION_COUNT = 4;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ExamPage() {
  const t = useT();
  const { locale } = useLocale();
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [questions, setQuestions] = useState<typeof VOCAB[number][]>([]);
  const [optionsList, setOptionsList] = useState<typeof VOCAB[number][][]>([]);
  const [pos, setPos] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const gen = useMemo(() => () => {
    const qs = shuffle(VOCAB).slice(0, QUESTION_COUNT);
    const opts = qs.map((q) => {
      const distractors = shuffle(VOCAB.filter((v) => v.id !== q.id)).slice(0, OPTION_COUNT - 1);
      return shuffle([q, ...distractors]);
    });
    return { qs, opts };
  }, []);

  function start() {
    const { qs, opts } = gen();
    setQuestions(qs);
    setOptionsList(opts);
    setPos(0);
    setPicked(null);
    setScore(0);
    setDone(false);
    setStarted(true);
  }

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (optionsList[pos][i].id === questions[pos].id) {
      setScore((s) => s + 1);
    }
  }

  function next() {
    if (pos + 1 >= questions.length) {
      const finalScore = score + (picked !== null && optionsList[pos][picked].id === questions[pos].id && pos === 0 ? 0 : 0);
      // score state already updated synchronously above
      setDone(true);
      const pct = Math.round((score / questions.length) * 100);
      addXp(score * 5);
      addExamScore(pct);
      markLessonComplete(`exam:${Date.now()}`);
      void finalScore;
    } else {
      setPos(pos + 1);
      setPicked(null);
    }
  }

  useEffect(() => {
    if (!started) return;
  }, [started]);

  if (!started) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.app.exam.title}</h1>
        </header>
        <div className="rounded-2xl border border-border bg-background p-8 text-center">
          <div className="text-5xl">📝</div>
          <p className="mt-4 text-lg">{t.app.exam.intro}</p>
          <button onClick={start} className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-brand px-6 text-base font-medium text-brand-foreground hover:opacity-90">
            {t.app.exam.start}
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.app.exam.title}</h1>
        </header>
        <div className="rounded-2xl border border-border bg-background p-10 text-center">
          <div className="text-6xl">{pct >= 80 ? "🏆" : pct >= 50 ? "🎯" : "💪"}</div>
          <p className="mt-4 text-sm text-muted-foreground">{t.app.exam.finalScore}</p>
          <p className="mt-1 text-5xl font-bold tracking-tight">{score} / {questions.length}</p>
          <p className="mt-2 text-lg text-muted-foreground">{pct}%</p>
          <div className="mt-8 flex justify-center gap-3">
            <button onClick={start} className="inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-medium text-brand-foreground hover:opacity-90">
              {t.app.exam.retry}
            </button>
            <Link href="/dashboard" className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium hover:bg-muted">
              {t.app.exam.backToDashboard}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const current = questions[pos];
  const options = optionsList[pos];

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.app.exam.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.app.exam.question} {pos + 1} {t.app.exam.of} {questions.length}</p>
        </div>
        <div className="text-sm text-muted-foreground">{score} / {questions.length}</div>
      </header>

      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${((pos) / questions.length) * 100}%` }} />
      </div>

      <div className="rounded-2xl border border-border bg-background p-8 text-center">
        <div className="font-cn text-6xl font-bold">{current.word}</div>
        <div className="mt-2 font-mono text-sm text-muted-foreground">{current.pinyin}</div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o, i) => {
          const isCorrect = o.id === current.id;
          const isPicked = picked === i;
          const reveal = picked !== null;
          return (
            <button
              key={o.id}
              onClick={() => pick(i)}
              disabled={picked !== null}
              className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                reveal && isCorrect
                  ? "border-green-500 bg-green-500/10"
                  : reveal && isPicked
                  ? "border-red-500 bg-red-500/10"
                  : "border-border bg-background hover:border-brand/40"
              } disabled:cursor-not-allowed`}
            >
              <span className="text-base font-medium">{o.meaning[locale]}</span>
              {reveal && isCorrect && <Check className="h-5 w-5 text-green-600" />}
              {reveal && isPicked && !isCorrect && <X className="h-5 w-5 text-red-600" />}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <button onClick={next} className="inline-flex h-11 items-center rounded-full bg-foreground px-6 text-sm font-medium text-background hover:opacity-90">
          {pos + 1 >= questions.length ? t.app.exam.finish : t.app.exam.question + " " + (pos + 2)}
        </button>
      )}
    </div>
  );
}
