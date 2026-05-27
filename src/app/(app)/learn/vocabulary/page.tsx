"use client";

import { useEffect, useMemo, useState } from "react";
import { Volume2 } from "lucide-react";
import { levelsIn } from "@/lib/learn-data";
import { useContent } from "@/lib/content/provider";
import { useLocale, useT } from "@/lib/i18n/provider";
import { addXp, dueCardIds, markVocabLearned, reviewCard, type SrsGrade } from "@/lib/learn-store";
import { LevelFilter, useStudyLevel } from "@/components/app/LevelFilter";

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export default function VocabularyPage() {
  const t = useT();
  const { locale } = useLocale();
  const [queue, setQueue] = useState<string[]>([]);
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [started, setStarted] = useState(false);
  const [level] = useStudyLevel();
  const { vocab } = useContent();
  const AVAILABLE_LEVELS = useMemo(() => levelsIn(vocab), [vocab]);

  const allIds = useMemo(
    () => (level === "all" ? vocab : vocab.filter((v) => v.hskLevel === level)).map((v) => v.id),
    [level, vocab],
  );

  useEffect(() => {
    setQueue(dueCardIds(allIds));
  }, [allIds]);

  function start() {
    const q = dueCardIds(allIds);
    setQueue(q);
    setPos(0);
    setRevealed(false);
    setDone(q.length === 0);
    setReviewedCount(0);
    setStarted(true);
  }

  function grade(g: SrsGrade) {
    const id = queue[pos];
    reviewCard(id, g);
    if (g !== "again") {
      markVocabLearned(id);
      addXp(g === "easy" ? 5 : 3);
    } else {
      addXp(1);
    }
    setReviewedCount((c) => c + 1);
    if (pos + 1 >= queue.length) setDone(true);
    else { setPos(pos + 1); setRevealed(false); }
  }

  const currentId = queue[pos];
  const current = vocab.find((v) => v.id === currentId);

  if (!started) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.app.vocab.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.app.vocab.subtitle}</p>
          <div className="mt-3">
            <LevelFilter available={AVAILABLE_LEVELS} />
          </div>
        </header>
        <div className="rounded-2xl border border-border bg-background p-8 text-center">
          <p className="text-lg">
            {t.app.vocab.due}: <span className="font-bold">{queue.length}</span>
          </p>
          <button
            onClick={start}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-medium text-brand-foreground hover:opacity-90"
          >
            {t.app.vocab.startReview}
          </button>
        </div>
      </div>
    );
  }

  if (done || !current) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.app.vocab.title}</h1>
        </header>
        <div className="rounded-2xl border border-border bg-background p-8 text-center">
          <div className="text-4xl">🎉</div>
          <p className="mt-3 text-lg font-semibold">{queue.length === 0 ? t.app.vocab.noDue : t.app.vocab.sessionDone}</p>
          <p className="mt-1 text-sm text-muted-foreground">{reviewedCount} {t.app.vocab.reviewed}</p>
          <button
            onClick={start}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-medium hover:bg-muted"
          >
            {t.app.vocab.startReview}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.app.vocab.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{pos + 1} / {queue.length}</p>
        </div>
      </header>

      <div className="rounded-2xl border border-border bg-background p-8 text-center">
        <button
          onClick={() => speak(current.word)}
          className="mx-auto mb-4 inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium hover:bg-muted"
        >
          <Volume2 className="h-3.5 w-3.5" /> {t.app.listening.play}
        </button>
        <div className="font-cn text-6xl font-bold">{current.word}</div>
        {revealed && (
          <>
            <div className="mt-4 font-mono text-lg text-brand">{current.pinyin}</div>
            <div className="mt-1 text-base text-muted-foreground">{current.meaning[locale]}</div>
            {current.exampleZh && (
              <div className="mt-4 rounded-xl bg-muted p-3 text-sm">
                <div className="font-cn">{current.exampleZh}</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">{current.examplePinyin}</div>
                {current.example && <div className="mt-1 text-xs text-muted-foreground">{current.example[locale]}</div>}
              </div>
            )}
          </>
        )}
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="block w-full rounded-full bg-foreground py-3 text-sm font-medium text-background hover:opacity-90"
        >
          {t.app.vocab.showAnswer}
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          <GradeButton color="red"    label={t.app.vocab.again} onClick={() => grade("again")} />
          <GradeButton color="orange" label={t.app.vocab.hard}  onClick={() => grade("hard")} />
          <GradeButton color="green"  label={t.app.vocab.good}  onClick={() => grade("good")} />
          <GradeButton color="blue"   label={t.app.vocab.easy}  onClick={() => grade("easy")} />
        </div>
      )}
    </div>
  );
}

function GradeButton({ color, label, onClick }: { color: string; label: string; onClick: () => void }) {
  const cls: Record<string, string> = {
    red: "bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-400",
    orange: "bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 dark:text-orange-400",
    green: "bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:text-green-400",
    blue: "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-400",
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-xl py-3 text-sm font-medium transition ${cls[color]}`}
    >
      {label}
    </button>
  );
}
