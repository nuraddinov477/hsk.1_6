"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, X, Volume2 } from "lucide-react";
import { CHARACTERS } from "@/lib/learn-data";
import { useLocale, useT } from "@/lib/i18n/provider";
import { addExamScore, addXp, markLessonComplete } from "@/lib/learn-store";

const QUESTION_COUNT = 8;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stripTones(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export default function WritingPage() {
  const t = useT();
  const { locale } = useLocale();
  const [questions, setQuestions] = useState<typeof CHARACTERS>([]);
  const [pos, setPos] = useState(0);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const gen = useMemo(() => () => shuffle(CHARACTERS).slice(0, QUESTION_COUNT), []);

  useEffect(() => {
    setQuestions(gen());
    setPos(0);
    setValue("");
    setResult(null);
    setScore(0);
    setDone(false);
  }, [gen]);

  if (questions.length === 0) return null;
  const current = questions[pos];

  function submit() {
    if (result !== null) return;
    const guess = stripTones(value);
    const answer = stripTones(current.pinyin);
    if (guess === answer) {
      setResult("correct");
      setScore((s) => s + 1);
      addXp(5);
    } else {
      setResult("wrong");
      addXp(1);
    }
  }

  function next() {
    if (pos + 1 >= questions.length) {
      setDone(true);
      markLessonComplete(`writing:set:${Date.now()}`);
      addExamScore(Math.round((score / questions.length) * 100));
    } else {
      setPos(pos + 1);
      setValue("");
      setResult(null);
    }
  }

  function restart() {
    setQuestions(gen());
    setPos(0);
    setValue("");
    setResult(null);
    setScore(0);
    setDone(false);
  }

  if (done) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.app.writing.title}</h1>
        </header>
        <div className="rounded-2xl border border-border bg-background p-8 text-center">
          <div className="text-4xl">🎉</div>
          <p className="mt-3 text-2xl font-bold">{score} / {questions.length}</p>
          <button onClick={restart} className="mt-6 inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-medium text-brand-foreground hover:opacity-90">
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
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.app.writing.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{pos + 1} / {questions.length}</p>
        </div>
      </header>

      <div className="rounded-2xl border border-border bg-background p-8 text-center">
        <p className="text-sm text-muted-foreground">{t.app.writing.prompt}</p>
        <button onClick={() => speak(current.hanzi)} className="mx-auto mt-3 inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium hover:bg-muted">
          <Volume2 className="h-3.5 w-3.5" /> {t.app.listening.play}
        </button>
        <div className="font-cn mt-4 text-7xl font-bold">{current.hanzi}</div>
        <div className="mt-2 text-xs text-muted-foreground">{current.meaning[locale]}</div>

        <input
          type="text"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") (result === null ? submit() : next()); }}
          placeholder={t.app.writing.placeholder}
          disabled={result !== null}
          className={`mx-auto mt-6 block h-12 w-full max-w-xs rounded-xl border bg-background px-4 text-center text-lg outline-none transition ${
            result === "correct" ? "border-green-500" : result === "wrong" ? "border-red-500" : "border-border focus:border-brand focus:ring-2 focus:ring-brand/20"
          }`}
        />

        {result === null ? (
          <button onClick={submit} className="mt-4 inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-medium text-brand-foreground hover:opacity-90">
            {t.app.writing.submit}
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${result === "correct" ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400"}`}>
              {result === "correct" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              {result === "correct" ? t.app.writing.correct : t.app.writing.wrong}
            </div>
            <div className="text-sm">
              {t.app.writing.answerWas} <span className="font-mono font-semibold text-brand">{current.pinyin}</span>
            </div>
            <button onClick={next} className="inline-flex h-11 items-center rounded-full bg-foreground px-6 text-sm font-medium text-background hover:opacity-90">
              {pos + 1 >= questions.length ? t.app.writing.finish : t.app.writing.next}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
