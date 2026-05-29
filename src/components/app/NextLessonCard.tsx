"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, ArrowRight, Clock } from "lucide-react";
import { useLocale } from "@/lib/i18n/provider";

type LessonRow = {
  id: string;
  hsk_level: number;
  lesson_no: number;
  title: { uz?: string; ru?: string; en?: string };
  est_minutes: number;
  completed: boolean;
};

// Dashboard widget. Picks the next uncompleted lesson at the user's target HSK
// level (falls back to lowest available). Hidden entirely when no lessons
// exist yet — better to show nothing than an empty placeholder.
export function NextLessonCard() {
  const { locale } = useLocale();
  const [next, setNext] = useState<LessonRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const pr = await fetch("/api/profile");
      let target: number | undefined;
      if (pr.ok) {
        const pj = await pr.json();
        target = pj.plan?.target_level ?? undefined;
      }
      const url = target ? `/api/lessons?level=${target}` : "/api/lessons";
      const r = await fetch(url);
      if (!r.ok || !alive) { setLoading(false); return; }
      const j: { lessons: LessonRow[] } = await r.json();
      const candidate = j.lessons.find((l) => !l.completed) ?? null;
      // If target level has none, fall back to *any* uncompleted lesson.
      if (!candidate && target) {
        const r2 = await fetch("/api/lessons");
        if (r2.ok) {
          const j2: { lessons: LessonRow[] } = await r2.json();
          setNext(j2.lessons.find((l) => !l.completed) ?? null);
        }
      } else {
        setNext(candidate);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  if (loading || !next) return null;

  const title = next.title[locale] ?? next.title.uz ?? next.title.en ?? `HSK ${next.hsk_level} · Dars ${next.lesson_no}`;

  return (
    <Link
      href={`/learn/lessons/${next.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-gradient-to-br from-background to-brand/5 p-5 transition hover:border-brand/40"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground">
        <BookOpen className="h-5 w-5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold uppercase tracking-wide text-brand">Keyingi dars</div>
        <div className="truncate text-base font-semibold">{title}</div>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span>HSK {next.hsk_level} · Dars {next.lesson_no}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {next.est_minutes} daq</span>
        </div>
      </div>
      <ArrowRight className="h-5 w-5 text-brand transition group-hover:translate-x-0.5" />
    </Link>
  );
}
