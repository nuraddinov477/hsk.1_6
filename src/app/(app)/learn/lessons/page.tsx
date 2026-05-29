"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Clock, Lock } from "lucide-react";
import { useLocale } from "@/lib/i18n/provider";

type LessonRow = {
  id: string;
  hsk_level: number;
  lesson_no: number;
  title: { uz?: string; ru?: string; en?: string };
  vocab_words: string[];
  char_hanzis: string[];
  est_minutes: number;
  audio_url: string | null;
  completed: boolean;
};

type Plan = { target_level: number | null; current_level: number | null };

// /learn/lessons — the curriculum. We default the view to the user's target
// HSK level (from the onboarding wizard) so the most relevant chapter shows
// at the top. Tabs let them jump between HSK 1..6.
export default function LessonsPage() {
  const { locale } = useLocale();
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [level, setLevel] = useState<number>(0); // 0 = all
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      // Pull the user's onboarding pick first so we can default the active tab.
      const pr = await fetch("/api/profile").catch(() => null);
      if (pr && pr.ok) {
        const pj = await pr.json();
        if (alive && pj.plan) {
          setPlan({ target_level: pj.plan.target_level, current_level: pj.plan.current_level });
          if (pj.plan.target_level) setLevel(pj.plan.target_level);
        }
      }
      // Then the lessons themselves.
      const r = await fetch("/api/lessons");
      if (r.ok && alive) {
        const j: { lessons: LessonRow[] } = await r.json();
        setLessons(j.lessons);
      }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const filtered = level === 0 ? lessons : lessons.filter((l) => l.hsk_level === level);
  const byLevel = filtered.reduce<Record<number, LessonRow[]>>((acc, l) => {
    (acc[l.hsk_level] = acc[l.hsk_level] ?? []).push(l);
    return acc;
  }, {});
  const completedCount = filtered.filter((l) => l.completed).length;

  function titleOf(l: LessonRow): string {
    return l.title[locale] ?? l.title.uz ?? l.title.en ?? `${l.hsk_level}.${l.lesson_no}`;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <BookOpen className="h-6 w-6 text-brand" /> Darslar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            HSK darajalari bo&apos;yicha tartibli darsliklar. Maqsadingizga mos boshlang.
          </p>
        </div>
        {plan?.target_level && (
          <div className="rounded-full border border-brand/30 bg-brand/5 px-3 py-1 text-xs">
            🎯 Maqsad: <span className="font-semibold text-brand">HSK {plan.target_level}</span>
          </div>
        )}
      </header>

      {/* Level tabs */}
      <div className="-mx-1 flex flex-wrap gap-1.5">
        <TabButton active={level === 0} onClick={() => setLevel(0)}>Hammasi</TabButton>
        {[1, 2, 3, 4, 5, 6].map((lv) => (
          <TabButton
            key={lv}
            active={level === lv}
            highlighted={plan?.target_level === lv}
            onClick={() => setLevel(lv)}
          >
            HSK {lv}
          </TabButton>
        ))}
      </div>

      {filtered.length > 0 && (
        <div className="rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
          ✅ <span className="font-semibold text-foreground">{completedCount}</span> / {filtered.length} dars tugatildi
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-muted/30" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {Object.entries(byLevel).map(([lv, items]) => (
            <section key={lv} className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">HSK {lv}</h2>
              <div className="space-y-2">
                {items.sort((a, b) => a.lesson_no - b.lesson_no).map((l, idx, arr) => {
                  const prevCompleted = idx === 0 || arr[idx - 1].completed;
                  // Show "locked" hint when previous lesson isn't done — soft gate, still clickable.
                  return (
                    <LessonCard
                      key={l.id}
                      lesson={l}
                      title={titleOf(l)}
                      locked={!prevCompleted}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({ children, active, highlighted, onClick }: {
  children: React.ReactNode; active: boolean; highlighted?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative h-9 rounded-full px-4 text-sm font-medium transition ${
        active
          ? "bg-brand text-brand-foreground"
          : "border border-border bg-background hover:bg-muted"
      }`}
    >
      {children}
      {highlighted && !active && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-brand inline-block" />}
    </button>
  );
}

function LessonCard({ lesson, title, locked }: { lesson: LessonRow; title: string; locked: boolean }) {
  return (
    <Link
      href={`/learn/lessons/${lesson.id}`}
      className="group flex items-start gap-3 rounded-2xl border border-border bg-background p-4 transition hover:border-brand/40 hover:shadow-sm"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
        lesson.completed
          ? "bg-green-500/15 text-green-600"
          : locked
            ? "bg-muted text-muted-foreground"
            : "bg-brand/10 text-brand"
      }`}>
        {lesson.completed ? <CheckCircle2 className="h-5 w-5" /> : locked ? <Lock className="h-4 w-4" /> : lesson.lesson_no}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-semibold">{title}</div>
          {lesson.completed && (
            <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-400">
              Tugatildi
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {lesson.est_minutes} daq</span>
          {lesson.vocab_words.length > 0 && <span>📝 {lesson.vocab_words.length} so&apos;z</span>}
          {lesson.char_hanzis.length > 0 && <span className="font-cn">汉 {lesson.char_hanzis.length}</span>}
          {lesson.audio_url && <span>🔊 audio</span>}
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
      <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium">Hozircha bu darajada darslar yo&apos;q</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Administrator tez orada darslarni qo&apos;shadi. Boshqa darajadagi darslarni ko&apos;ring.
      </p>
    </div>
  );
}
