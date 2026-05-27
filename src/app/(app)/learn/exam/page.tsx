"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, X, Volume2, Clock, ArrowRight } from "lucide-react";
import {
  buildExam,
  examLevels,
  EXAM_SPECS,
  type BuiltExam,
  type ExamSection,
} from "@/lib/exam-data";
import { useContent } from "@/lib/content/provider";
import { useLocale, useT } from "@/lib/i18n/provider";
import { addExamScore, addXp, markLessonComplete } from "@/lib/learn-store";

type Phase = "intro" | "running" | "result";

function speak(text: string, rate = 0.85) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = rate;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

type SectionResult = { section: ExamSection; correct: number; total: number; points: number };
type ExamResult = { sections: SectionResult[]; total: number; totalPoints: number; passPoints: number; passed: boolean };

function computeResult(exam: BuiltExam, answers: (number | null)[]): ExamResult {
  const pointsPerSection = Math.round(exam.spec.totalPoints / exam.sections.length);
  const sections: SectionResult[] = exam.sections.map((section) => {
    let correct = 0;
    let total = 0;
    exam.questions.forEach((q, i) => {
      if (q.section !== section) return;
      total += 1;
      const chosen = answers[i];
      if (chosen !== null && q.choices[chosen]?.correct) correct += 1;
    });
    const points = total > 0 ? Math.round((correct / total) * pointsPerSection) : 0;
    return { section, correct, total, points };
  });
  const total = sections.reduce((sum, s) => sum + s.points, 0);
  return { sections, total, totalPoints: exam.spec.totalPoints, passPoints: exam.spec.passPoints, passed: total >= exam.spec.passPoints };
}

export default function ExamPage() {
  const t = useT();
  const e = t.app.exam;
  const { locale } = useLocale();
  const { vocab, passages, examQuestions } = useContent();

  const [phase, setPhase] = useState<Phase>("intro");
  const [exam, setExam] = useState<BuiltExam | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [pos, setPos] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const savedRef = useRef(false);

  const examContent = useMemo(
    () => ({ vocab, passages, authored: examQuestions }),
    [vocab, passages, examQuestions],
  );
  const levels = useMemo(() => examLevels(examContent), [examContent]);

  function startLevel(level: number) {
    const built = buildExam(examContent, level);
    if (!built) return;
    setExam(built);
    setAnswers(new Array(built.questions.length).fill(null));
    setPos(0);
    setSecondsLeft(built.spec.durationSec);
    setShowReview(false);
    savedRef.current = false;
    setPhase("running");
  }

  // Countdown timer; auto-submits when it reaches zero.
  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          setPhase("result");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const result = useMemo(
    () => (exam && phase === "result" ? computeResult(exam, answers) : null),
    [exam, answers, phase],
  );

  // Persist the score once, when results are shown.
  useEffect(() => {
    if (phase !== "result" || !result || savedRef.current) return;
    savedRef.current = true;
    const pct = Math.round((result.total / result.totalPoints) * 100);
    addExamScore(pct, exam?.spec.level);
    addXp(Math.round(result.total / 10));
    markLessonComplete(`exam:hsk${exam?.spec.level}:${Date.now()}`);
  }, [phase, result, exam]);

  function choose(choiceIdx: number) {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[pos] = choiceIdx;
      return copy;
    });
  }

  function next() {
    if (!exam) return;
    if (pos + 1 >= exam.questions.length) {
      if (window.confirm(e.submitConfirm)) setPhase("result");
    } else {
      setPos((p) => p + 1);
    }
  }

  // ─── Intro: choose a level ───
  if (phase === "intro") {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{e.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{e.subtitle}</p>
        </header>
        <div>
          <p className="mb-3 text-sm font-medium">{e.selectLevel}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {levels.map((lv) => {
              const spec = EXAM_SPECS[lv];
              const qCount = spec.blueprint.reduce((n, b) => n + b.count, 0);
              return (
                <button
                  key={lv}
                  onClick={() => startLevel(lv)}
                  className="group rounded-2xl border border-border bg-background p-5 text-left transition hover:border-brand hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold">HSK {lv}</span>
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-brand" />
                  </div>
                  <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between"><dt>{e.questions}</dt><dd className="font-medium text-foreground">~{qCount}</dd></div>
                    <div className="flex justify-between"><dt>{e.timeLeft}</dt><dd className="font-medium text-foreground">{Math.round(spec.durationSec / 60)} {e.minutes}</dd></div>
                    <div className="flex justify-between"><dt>{e.passMark}</dt><dd className="font-medium text-foreground">{spec.passPoints} / {spec.totalPoints}</dd></div>
                  </dl>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── Result ───
  if (phase === "result" && exam && result) {
    const pct = Math.round((result.total / result.totalPoints) * 100);
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{e.title} · HSK {exam.spec.level}</h1>
        </header>

        <div className="rounded-2xl border border-border bg-background p-8 text-center">
          <div className="text-6xl">{result.passed ? "🏆" : "💪"}</div>
          <p className={`mt-4 text-lg font-semibold ${result.passed ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`}>
            {result.passed ? e.passed : e.failed}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{e.finalScore}</p>
          <p className="mt-1 text-5xl font-bold tracking-tight">
            {result.total} <span className="text-2xl font-medium text-muted-foreground">{e.outOf} {result.totalPoints}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{pct}% · {e.passMark}: {result.passPoints}</p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5">
          <p className="mb-3 text-sm font-medium">{e.breakdown}</p>
          <div className="space-y-3">
            {result.sections.map((s) => (
              <div key={s.section}>
                <div className="flex items-center justify-between text-sm">
                  <span>{s.section === "listening" ? e.listeningSection : e.readingSection}</span>
                  <span className="text-muted-foreground">{s.correct}/{s.total} · {s.points} {t.app.common.points}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${s.total ? (s.correct / s.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={() => setShowReview((v) => !v)} className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium hover:bg-muted">
            {showReview ? e.hideReview : e.reviewAnswers}
          </button>
          <button onClick={() => setPhase("intro")} className="inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-medium text-brand-foreground hover:opacity-90">
            {e.retry}
          </button>
          <Link href="/dashboard" className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium hover:bg-muted">
            {e.backToDashboard}
          </Link>
        </div>

        {showReview && (
          <div className="space-y-3">
            {exam.questions.map((q, i) => {
              const chosen = answers[i];
              const correctIdx = q.choices.findIndex((c) => c.correct);
              const isCorrect = chosen !== null && q.choices[chosen]?.correct;
              return (
                <div key={q.id} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-medium">
                      {i + 1}. {q.audio ? `🔊 ${q.audio}` : q.term ?? q.passage ?? q.prompt[locale]}
                    </span>
                    {isCorrect ? <Check className="h-5 w-5 shrink-0 text-green-600" /> : <X className="h-5 w-5 shrink-0 text-red-600" />}
                  </div>
                  <p className="mt-2 text-xs">
                    <span className="text-muted-foreground">{e.correctAnswer}: </span>
                    <span className="font-medium text-green-700 dark:text-green-400">{q.choices[correctIdx]?.label[locale]}</span>
                  </p>
                  {!isCorrect && (
                    <p className="mt-0.5 text-xs">
                      <span className="text-muted-foreground">{e.yourAnswer}: </span>
                      <span className="text-red-600 dark:text-red-400">{chosen !== null ? q.choices[chosen]?.label[locale] : e.noAnswer}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── Running ───
  if (phase !== "running" || !exam) return null;
  const q = exam.questions[pos];
  const answered = answers[pos];
  const lowTime = secondsLeft <= 60;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{e.title} · HSK {exam.spec.level}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {q.section === "listening" ? e.listeningSection : e.readingSection} · {e.question} {pos + 1} {e.of} {exam.questions.length}
          </p>
        </div>
        <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium tabular-nums ${lowTime ? "border-red-500 text-red-600 dark:text-red-400" : "border-border text-muted-foreground"}`}>
          <Clock className="h-4 w-4" /> {fmtTime(secondsLeft)}
        </div>
      </header>

      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(pos / exam.questions.length) * 100}%` }} />
      </div>

      {/* Question body */}
      <div className="rounded-2xl border border-border bg-background p-6 text-center">
        {q.section === "listening" && (
          <div className="flex justify-center gap-3">
            <button onClick={() => speak(q.audio ?? "")} className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-brand-foreground hover:opacity-90">
              <Volume2 className="h-4 w-4" /> {e.playAudio}
            </button>
            <button onClick={() => speak(q.audio ?? "", 0.55)} className="inline-flex h-12 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium hover:bg-muted">
              <Volume2 className="h-4 w-4" /> {e.replay}
            </button>
          </div>
        )}
        {q.passage && (
          <div>
            <p className="font-cn text-xl leading-relaxed">{q.passage}</p>
            {q.passagePinyin && <p className="mt-2 font-mono text-xs text-muted-foreground">{q.passagePinyin}</p>}
          </div>
        )}
        {q.term && (
          <div>
            <p className="font-cn text-5xl font-bold">{q.term}</p>
            {q.termPinyin && <p className="mt-2 font-mono text-sm text-brand">{q.termPinyin}</p>}
          </div>
        )}
        <p className="mt-4 text-sm text-muted-foreground">{q.prompt[locale]}</p>
      </div>

      {/* Choices */}
      <div className="grid gap-2 sm:grid-cols-2">
        {q.choices.map((c, i) => {
          const selected = answered === i;
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                selected ? "border-brand bg-brand/10" : "border-border bg-background hover:border-brand/40"
              }`}
            >
              <span className="text-base font-medium">
                {c.zh && <span className="font-cn mr-2">{c.zh}</span>}
                {c.label[locale]}
              </span>
              {selected && <Check className="h-5 w-5 text-brand" />}
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={next}
          className="inline-flex h-11 items-center gap-1.5 rounded-full bg-foreground px-6 text-sm font-medium text-background hover:opacity-90"
        >
          {pos + 1 >= exam.questions.length ? e.submit : e.next}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
