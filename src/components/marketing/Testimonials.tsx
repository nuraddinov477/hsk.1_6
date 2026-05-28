"use client";

import { Quote } from "lucide-react";
import { useLocale } from "@/lib/i18n/provider";

type ML = { uz: string; ru: string; en: string };

const STORIES: { name: string; level: string; quote: ML }[] = [
  {
    name: "Madina A.",
    level: "0 → HSK 2",
    quote: {
      uz: "3 oy ichida noldan HSK 2 ni topshirdim. Har kuni 15 daqiqa — natija aniq.",
      ru: "За 3 месяца с нуля сдала HSK 2. По 15 минут в день — результат заметный.",
      en: "Passed HSK 2 from zero in 3 months. 15 minutes a day — visible results.",
    },
  },
  {
    name: "Jamshid R.",
    level: "HSK 2 → HSK 4",
    quote: {
      uz: "Universitetga grant olish uchun HSK 4 kerak edi — HSKGo bilan 5 oyda tayyorlandim. Ieroglif yozish moduli oltindek qimmatli.",
      ru: "Для гранта в университете нужен был HSK 4 — подготовился за 5 месяцев. Модуль написания иероглифов бесценен.",
      en: "Needed HSK 4 for a university scholarship — got ready in 5 months. The character-writing module is gold.",
    },
  },
  {
    name: "Dilfuza Kh.",
    level: "HSK 3 → HSK 5",
    quote: {
      uz: "AI insho baholash haqiqiy o'qituvchidek ishlaydi. Xatolarimni darhol ko'rsatadi, qaytadan tahrir qildiradi. Ish kuni telefonda mashq qilaman.",
      ru: "AI-оценка эссе работает как настоящий учитель. Сразу показывает ошибки и заставляет переписать. Тренируюсь по дороге на работу.",
      en: "The AI essay feedback works like a real tutor. Spots mistakes instantly and pushes me to revise. I practice on my commute.",
    },
  },
];

const HEADING: ML = {
  uz: "Talabalarimizning hikoyalari",
  ru: "Истории наших студентов",
  en: "What our students say",
};
const SUBHEADING: ML = {
  uz: "1000+ o'zbek talaba HSKGo bilan xitoy tilini o'rganmoqda.",
  ru: "1000+ узбекских студентов учат китайский с HSKGo.",
  en: "1,000+ Uzbek students learning Chinese with HSKGo.",
};

export function Testimonials() {
  const { locale } = useLocale();
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      <header className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{HEADING[locale]}</h2>
        <p className="mt-3 text-muted-foreground">{SUBHEADING[locale]}</p>
      </header>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {STORIES.map((s) => (
          <article key={s.name} className="rounded-2xl border border-border bg-background p-6">
            <Quote className="h-6 w-6 text-brand opacity-60" />
            <p className="mt-3 text-sm leading-relaxed">{s.quote[locale]}</p>
            <div className="mt-4 flex items-center gap-3 border-t border-border/60 pt-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/15 text-sm font-bold text-brand">
                {s.name[0]}
              </div>
              <div>
                <div className="text-sm font-semibold">{s.name}</div>
                <div className="text-xs text-brand">{s.level}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
