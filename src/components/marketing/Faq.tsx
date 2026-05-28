"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/i18n/provider";

type ML = { uz: string; ru: string; en: string };

const QUESTIONS: { q: ML; a: ML }[] = [
  {
    q: {
      uz: "HSKGo bepulmi?",
      ru: "HSKGo бесплатный?",
      en: "Is HSKGo free?",
    },
    a: {
      uz: "Ha, HSK 1 va HSK 2 to'liq bepul — kun davomida 10 ta mashq. HSK 3–9 va AI funksiyalar Pro tarifida (79 000 so'm/oy).",
      ru: "Да, HSK 1 и HSK 2 полностью бесплатны — 10 упражнений в день. HSK 3–9 и AI-функции доступны в Pro (79 000 сум/мес).",
      en: "Yes — HSK 1 and HSK 2 are fully free with 10 daily exercises. HSK 3–9 and AI features are in Pro (79,000 UZS/mo).",
    },
  },
  {
    q: {
      uz: "Qaysi HSK darajadan boshlasam bo'ladi?",
      ru: "С какого уровня HSK можно начать?",
      en: "Which HSK level should I start at?",
    },
    a: {
      uz: "Agar xitoy tilini ilk marta o'rganayotgan bo'lsangiz — HSK 1. Asoslarni bilsangiz, HSK 2 yoki 3 dan boshlang. Profilingizdan istalgan darajaga o'tishingiz mumkin.",
      ru: "Если учите китайский впервые — начните с HSK 1. Если знаете основы — HSK 2 или 3. Уровень можно сменить в любой момент.",
      en: "Brand new to Chinese? Start at HSK 1. If you know basics, jump to HSK 2 or 3. You can switch level anytime in your profile.",
    },
  },
  {
    q: {
      uz: "Telefonda ishlaydimi? Ilova kerakmi?",
      ru: "Работает на телефоне? Нужно ли приложение?",
      en: "Does it work on mobile? Do I need an app?",
    },
    a: {
      uz: "Ilova kerak emas — sayt har qanday telefonda (iOS/Android) brauzer orqali ishlaydi. Mikrofon va audio to'liq qo'llab-quvvatlanadi. Ilova versiyasi tez orada chiqadi.",
      ru: "Приложение не нужно — сайт работает в браузере на любом телефоне. Микрофон и аудио полностью поддерживаются. Приложение скоро.",
      en: "No app needed — the site runs in any phone browser. Mic and audio are fully supported. Native app coming soon.",
    },
  },
  {
    q: {
      uz: "HSKGo HSK rasmiy imtihoniga moslashtirilganmi?",
      ru: "Соответствует ли HSKGo официальному экзамену HSK?",
      en: "Is HSKGo aligned with the official HSK exam?",
    },
    a: {
      uz: "Ha — sinov imtihonlar real HSK formatida: HSK 1–2 = 200 ball (o'tish 120), HSK 3–6 = 300 ball (o'tish 180). Tinglash, o'qish va yozish bo'limlari haqiqiy imtihondagidek.",
      ru: "Да — пробные тесты в формате официального HSK: HSK 1–2 = 200 баллов (проход 120), HSK 3–6 = 300 (проход 180). Разделы как на реальном экзамене.",
      en: "Yes — mock tests follow the official HSK format: HSK 1–2 = 200 points (pass 120), HSK 3–6 = 300 (pass 180). Listening, reading, and writing match the real exam.",
    },
  },
  {
    q: {
      uz: "Sertifikat olishim mumkinmi?",
      ru: "Можно ли получить сертификат?",
      en: "Can I get a certificate?",
    },
    a: {
      uz: "HSKGo'ning rasmiy bo'lmagan tayyorgarlik sertifikati Premium tarif uchun. Rasmiy HSK sertifikati Hanban (Xitoy hukumati) tomonidan beriladi — HSKGo sizni unga tayyorlaydi.",
      ru: "Неофициальный подготовительный сертификат HSKGo — для подписчиков Premium. Официальный HSK выдаёт Ханьбань (правительство КНР), и HSKGo готовит вас к нему.",
      en: "HSKGo offers a prep-certificate to Premium subscribers. The official HSK certificate is issued by Hanban (Chinese government); HSKGo prepares you for it.",
    },
  },
  {
    q: {
      uz: "AI insho baholash qanday ishlaydi?",
      ru: "Как работает AI-оценка эссе?",
      en: "How does the AI essay feedback work?",
    },
    a: {
      uz: "Inshongizni yozish moduliga joylang — Claude AI bir necha soniyada uni baholaydi: 0–100 ball, taxminiy HSK daraja, kuchli/zaif tomonlar, grammar xatolari va tahrirlangan variant. Pro tarifida cheksiz, bepul tarifda kuniga 3 ta.",
      ru: "Вставьте эссе в модуль письма — Claude AI за секунды даст: оценку 0–100, уровень HSK, сильные/слабые стороны, грамматические ошибки и исправленный вариант. Pro — без лимита, Free — 3 в день.",
      en: "Paste your essay into the writing module — Claude AI scores it 0–100 in seconds, estimates your HSK level, lists strengths/weaknesses, grammar issues, and gives a revised version. Unlimited in Pro, 3/day in Free.",
    },
  },
];

const HEADING: ML = {
  uz: "Tez-tez beriladigan savollar",
  ru: "Часто задаваемые вопросы",
  en: "Frequently asked questions",
};

export function Faq() {
  const { locale } = useLocale();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <header className="text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{HEADING[locale]}</h2>
      </header>
      <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-background">
        {QUESTIONS.map((item, i) => {
          const open = openIdx === i;
          return (
            <div key={i}>
              <button
                onClick={() => setOpenIdx(open ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium hover:bg-muted/40"
              >
                <span>{item.q[locale]}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              {open && (
                <div className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">
                  {item.a[locale]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
