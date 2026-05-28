"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, BookOpenText, RotateCcw, Headphones, GraduationCap } from "lucide-react";
import { useContent } from "@/lib/content/provider";
import { dueCardIds } from "@/lib/learn-store";

// Smart "next action" card. Priority order:
//   1. SRS cards due now → review them
//   2. Vocab in current study level not yet learned → vocab module
//   3. Listening if reading/vocab covered, otherwise exam
export function ContinueCard({ vocabLearned, level }: { vocabLearned: string[]; level: number | "all" }) {
  const { vocab } = useContent();

  const suggestion = useMemo(() => {
    const learnedSet = new Set(vocabLearned);
    const inLevel = vocab.filter((v) =>
      (level === "all" || v.hskLevel === level)
    );

    // 1. SRS due — check today's queue against all vocab ids
    const due = dueCardIds(inLevel.map((v) => v.id)).filter((id) => learnedSet.has(id));
    if (due.length >= 5) {
      return {
        icon: RotateCcw,
        accent: "from-orange-500 to-rose-500",
        kicker: "Takror vaqti",
        title: `${due.length} ta so'zni takrorlash kerak`,
        body: "Yodingizda mustahkamlash uchun bu so'zlarni qayta ko'ring.",
        cta: "Takrorlashni boshlash",
        href: "/learn/vocabulary",
      };
    }

    // 2. Unlearned vocab in current level
    const unlearned = inLevel.filter((v) => !learnedSet.has(v.id));
    if (unlearned.length > 0) {
      const pct = inLevel.length > 0
        ? Math.round(((inLevel.length - unlearned.length) / inLevel.length) * 100)
        : 0;
      return {
        icon: BookOpenText,
        accent: "from-brand to-purple-500",
        kicker: "Davom etish",
        title: `HSK ${level === "all" ? "barcha" : level} lug'atida ${unlearned.length} ta so'z qoldi`,
        body: `Hozirgi darajangiz: ${pct}% tugatilgan. Bugun yangi so'zlarni o'rganing.`,
        cta: "Lug'atga o'tish",
        href: "/learn/vocabulary",
      };
    }

    // 3. Default: practice listening
    return {
      icon: Headphones,
      accent: "from-blue-500 to-cyan-500",
      kicker: "Yangi mashq",
      title: "Tinglash mashqini sinab ko'ring",
      body: "Bu darajadagi so'zlarni o'zlashtirdingiz. Tinglashga o'ting!",
      cta: "Tinglashga o'tish",
      href: "/learn/listening",
    };
  }, [vocab, vocabLearned, level]);

  const Icon = suggestion.icon;

  return (
    <Link
      href={suggestion.href}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-background p-5 transition hover:shadow-md sm:p-6"
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${suggestion.accent} opacity-[0.06] transition group-hover:opacity-[0.12]`} />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${suggestion.accent} text-white`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-brand">{suggestion.kicker}</div>
            <h3 className="mt-0.5 text-lg font-semibold leading-tight">{suggestion.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{suggestion.body}</p>
          </div>
        </div>
        <div className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background hover:opacity-90">
          {suggestion.cta}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

// re-exported for icon reuse
export { GraduationCap };
