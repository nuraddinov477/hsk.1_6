"use client";

import { useT } from "@/lib/i18n/provider";

type LevelMeta = { level: 1 | 2 | 3 | 4 | 5 | 6 | 7; label: string; vocab: number; characters: number };

const LEVEL_META: LevelMeta[] = [
  { level: 1, label: "HSK 1", vocab: 150,   characters: 300 },
  { level: 2, label: "HSK 2", vocab: 300,   characters: 600 },
  { level: 3, label: "HSK 3", vocab: 600,   characters: 900 },
  { level: 4, label: "HSK 4", vocab: 1200,  characters: 1200 },
  { level: 5, label: "HSK 5", vocab: 2500,  characters: 1500 },
  { level: 6, label: "HSK 6", vocab: 5000,  characters: 1800 },
  { level: 7, label: "HSK 7–9", vocab: 11092, characters: 3000 },
];

export function Levels() {
  const t = useT();
  return (
    <section id="levels" className="border-b border-border/60 bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t.levels.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t.levels.subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LEVEL_META.map((l) => (
            <div key={l.level} className="rounded-2xl border border-border bg-background p-5">
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold">{l.label}</div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {t.levels.cefr[l.level]}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.levels.descriptions[l.level]}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span><span className="font-semibold text-foreground">{l.vocab.toLocaleString()}</span> {t.levels.words}</span>
                <span><span className="font-semibold text-foreground">{l.characters.toLocaleString()}</span> {t.levels.chars}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
