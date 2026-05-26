"use client";

import { useEffect, useMemo, useState } from "react";
import { Volume2, Check, X } from "lucide-react";
import { VOCAB } from "@/lib/learn-data";
import { useLocale, useT } from "@/lib/i18n/provider";
import { addExamScore, addXp, markLessonComplete } from "@/lib/learn-store";

const QUESTION_COUNT = 5;
const OPTION_COUNT = 4;

function speak(text: string, rate = 0.85) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = rate;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  return true;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ListeningPage() {
  const t = useT();
  const { locale } = useLocale();
  const [questions, setQuestions] = useState<typeof VOCAB[number][]>([]);
  const [optionsList, setOptionsList] = useState<typeof VOCAB[number][][]>([]);
  const [pos, setPos] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [ttsOk, setTtsOk] = useState(true);

  const generate = useMemo(
    () => () => {
      const qs = shuffle(VOCAB).slice(0, QUESTION_COUNT);
      const opts = qs.map((q) => {
        const distractors = shuffle(VOCAB.filter((v) => v.id !== q.id)).slice(0, OPTION_COUNT - 1);
        return shuffle([q, ...distractors]);
      });
      return { qs, opts };
    },
    []
  );

  useEffect(() => {
    const { qs, opts } = generate();
    setQuestions(qs);
    setOptionsList(opts);
    setPos(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }, [generate]);

  useEffect(() => {
    if (questions[pos]) {
      const ok = speak(questions[pos].word);
      if (!ok) setTtsOk(false);
    }
  }, [pos, questions]);

  if (questions.length === 0) {
    return <div className="text-sm text-muted-foreground">…</div>;
  }

  const current = questions[pos];
  const options = optionsList[pos] ?? [];

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (options[i].id === current.id) {
      setScore((s) => s + 1);
      addXp(5);
    } else {
      addXp(1);
    }
  }

  function next() {
    if (pos + 1 >= questions.length) {
      setDone(true);
      markLessonComplete(`listening:set:${Date.now()}`);
      addExamScore(Math.round((score / questions.length) * 100));
    } else {
      setPos(pos + 1);
      setPicked(null);
    }
  }

  function restart() {
    const { qs, opts } = generate();
    setQuestions(qs);
    setOptionsList(opts);
    setPos(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.app.listening.title}</h1>
        </header>
        <div className="rounded-2xl border border-border bg-background p-8 text-center">
          <div className="text-4xl">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
          <p className="mt-3 text-2xl font-bold">{score} / {questions.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">{pct}%</p>
          <button onClick={restart} className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-medium text-brand-foreground hover:opacity-90">
            {t.app.exam.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.app.listening.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{pos + 1} / {questions.length}</p>
        </div>
        <div className="text-sm text-muted-foreground">{t.app.listening.score}: {score}</div>
      </header>

      <div className="rounded-2xl border border-border bg-background p-8 text-center">
        {!ttsOk && <p className="mb-4 text-xs text-orange-600">{t.app.listening.ttsUnsupported}</p>}
        <div className="flex justify-center gap-3">
          <button onClick={() => speak(current.word)} className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-brand-foreground hover:opacity-90">
            <Volume2 className="h-4 w-4" /> {t.app.listening.play}
          </button>
          <button onClick={() => speak(current.word, 0.55)} className="inline-flex h-12 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium hover:bg-muted">
            <Volume2 className="h-4 w-4" /> {t.app.listening.slow}
          </button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">{t.app.listening.chooseTranslation}</p>
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
        <div className="rounded-2xl border border-border bg-background p-4 text-center">
          <div className="font-cn text-2xl">{current.word}</div>
          <div className="mt-1 text-sm text-muted-foreground"><span className="font-mono text-brand">{current.pinyin}</span> · {current.meaning[locale]}</div>
          <button onClick={next} className="mt-4 inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background hover:opacity-90">
            {pos + 1 >= questions.length ? t.app.listening.finish : t.app.listening.next}
          </button>
        </div>
      )}
    </div>
  );
}
