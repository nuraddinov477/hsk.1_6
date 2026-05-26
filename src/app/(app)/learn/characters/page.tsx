"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, RotateCcw, Check } from "lucide-react";
import { CHARACTERS, levelsIn } from "@/lib/learn-data";
import { useT } from "@/lib/i18n/provider";
import { useLocale } from "@/lib/i18n/provider";
import { addXp, getProgress, markCharacterLearned } from "@/lib/learn-store";
import { LevelFilter, useStudyLevel } from "@/components/app/LevelFilter";

const AVAILABLE_LEVELS = levelsIn(CHARACTERS);

export default function CharactersPage() {
  const t = useT();
  const { locale } = useLocale();
  const [level] = useStudyLevel();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [learned, setLearned] = useState<string[]>([]);
  const [mode, setMode] = useState<"animate" | "quiz">("animate");
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const writerRef = useRef<any>(null);

  const chars = useMemo(
    () => (level === "all" ? CHARACTERS : CHARACTERS.filter((c) => c.hskLevel === level)),
    [level],
  );

  // Reset to the first character whenever the level filter changes.
  useEffect(() => {
    setSelectedIndex(0);
    setMode("animate");
  }, [level]);

  const current = chars[selectedIndex] ?? chars[0];
  const learnedInView = chars.filter((c) => learned.includes(c.hanzi)).length;

  useEffect(() => {
    setLearned(getProgress().charactersLearned);
    function refresh() { setLearned(getProgress().charactersLearned); }
    window.addEventListener("hskgo:progress", refresh);
    return () => window.removeEventListener("hskgo:progress", refresh);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const { default: HanziWriter } = await import("hanzi-writer");
      if (cancelled || !containerRef.current) return;
      containerRef.current.innerHTML = "";
      writerRef.current = HanziWriter.create(containerRef.current, current.hanzi, {
        width: 300,
        height: 300,
        padding: 16,
        strokeColor: "#dc2626",
        radicalColor: "#fbbf24",
        delayBetweenStrokes: 250,
        strokeAnimationSpeed: 1.2,
        showOutline: true,
        showCharacter: false,
      });
      if (mode === "animate") {
        writerRef.current.animateCharacter();
      } else {
        writerRef.current.quiz({
          onComplete: () => {
            markCharacterLearned(current.hanzi);
            addXp(5);
          },
        });
      }
    }
    init();
    return () => { cancelled = true; };
  }, [current.hanzi, mode]);

  function nextChar() {
    setSelectedIndex((i) => (i + 1) % chars.length);
    setMode("animate");
  }

  function startQuiz() { setMode("quiz"); }
  function showAnim() { setMode("animate"); writerRef.current?.animateCharacter(); }
  function reset() {
    writerRef.current?.cancelQuiz();
    setMode("animate");
  }

  function onMarkLearned() {
    markCharacterLearned(current.hanzi);
    addXp(2);
  }

  const isLearned = learned.includes(current.hanzi);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.app.characters.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.app.characters.subtitle}</p>
        <div className="mt-3">
          <LevelFilter available={AVAILABLE_LEVELS} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="rounded-2xl border border-border bg-background p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-cn text-4xl font-bold">{current.hanzi}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                <span className="font-mono text-brand">{current.pinyin}</span>
                {" · "}
                {current.meaning[locale]}
              </div>
            </div>
            {isLearned && (
              <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                {t.app.characters.alreadyLearned}
              </span>
            )}
          </div>

          <div
            ref={containerRef}
            className="mx-auto my-6 flex h-[300px] w-[300px] items-center justify-center rounded-2xl bg-[linear-gradient(0deg,transparent_49%,theme(colors.zinc.200)_49%,theme(colors.zinc.200)_51%,transparent_51%),linear-gradient(90deg,transparent_49%,theme(colors.zinc.200)_49%,theme(colors.zinc.200)_51%,transparent_51%)] dark:bg-[linear-gradient(0deg,transparent_49%,theme(colors.zinc.800)_49%,theme(colors.zinc.800)_51%,transparent_51%),linear-gradient(90deg,transparent_49%,theme(colors.zinc.800)_49%,theme(colors.zinc.800)_51%,transparent_51%)]"
          />

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={showAnim} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-medium hover:bg-muted">
              <Play className="h-3.5 w-3.5" /> {t.app.characters.showAnimation}
            </button>
            <button onClick={startQuiz} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-medium text-brand-foreground hover:opacity-90">
              <RotateCcw className="h-3.5 w-3.5" /> {t.app.characters.tracePractice}
            </button>
            <button onClick={reset} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-medium hover:bg-muted">
              {t.app.characters.reset}
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            <button onClick={onMarkLearned} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-medium hover:bg-muted">
              <Check className="h-3.5 w-3.5" /> {t.app.characters.markLearned}
            </button>
            <button onClick={nextChar} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background hover:opacity-90">
              {t.app.characters.next}
            </button>
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-background p-4">
          <div className="mb-3 text-xs font-medium text-muted-foreground">{t.app.characters.learned}: {learnedInView} / {chars.length}</div>
          <div className="grid grid-cols-5 gap-2 lg:grid-cols-4">
            {chars.map((c, i) => {
              const ok = learned.includes(c.hanzi);
              return (
                <button
                  key={c.hanzi}
                  onClick={() => { setSelectedIndex(i); setMode("animate"); }}
                  className={`aspect-square rounded-lg border text-xl font-cn font-semibold transition ${
                    i === selectedIndex
                      ? "border-brand bg-brand/10 text-brand"
                      : ok
                      ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400"
                      : "border-border bg-background hover:border-brand/40"
                  }`}
                >
                  {c.hanzi}
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
