"use client";

import { useT } from "@/lib/i18n/provider";

const MODULE_META = [
  { key: "listening", hanzi: "听力", pinyin: "tīng lì" },
  { key: "reading",    hanzi: "阅读", pinyin: "yuè dú" },
  { key: "writing",    hanzi: "写作", pinyin: "xiě zuò" },
  { key: "speaking",   hanzi: "口语", pinyin: "kǒu yǔ" },
  { key: "characters", hanzi: "汉字", pinyin: "hàn zì" },
  { key: "vocabulary", hanzi: "词汇", pinyin: "cí huì" },
] as const;

export function Modules() {
  const t = useT();
  return (
    <section id="modules" className="border-b border-border/60 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t.modules.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t.modules.subtitle}
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULE_META.map((m) => {
            const item = t.modules.items[m.key];
            return (
              <div
                key={m.key}
                className="group relative overflow-hidden rounded-2xl border border-border bg-background p-6 transition hover:border-brand/40 hover:shadow-lg hover:shadow-red-500/5"
              >
                <div
                  aria-hidden
                  className="absolute -right-4 -top-4 font-cn text-7xl font-bold text-muted opacity-40 transition group-hover:text-brand/15"
                >
                  {m.hanzi}
                </div>
                <div className="relative">
                  <div className="font-mono text-xs text-muted-foreground">{m.pinyin}</div>
                  <h3 className="mt-1 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
