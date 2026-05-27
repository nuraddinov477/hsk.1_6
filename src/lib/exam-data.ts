import { VOCAB, PASSAGES, type Translations } from "./learn-data";

// ─── HSK mock-exam model ──────────────────────────────────────────────
// A real HSK exam is split into timed sections (听力 Listening, 阅读 Reading)
// and scored out of a fixed point total with a pass threshold. This module
// defines that structure plus a generator that turns the existing study
// content (VOCAB / PASSAGES) into exam questions, so HSK 1–3 work today.
// To add real exam items later, push hand-written `ExamQuestion`s into
// `AUTHORED_QUESTIONS` — they are merged with the generated ones per level.

export type ExamSection = "listening" | "reading";

export type ExamChoice = {
  label: Translations;
  /** Optional Chinese text shown on the option (e.g. 学生). */
  zh?: string;
  correct?: boolean;
};

export type ExamQuestion = {
  id: string;
  level: number; // 1..6
  section: ExamSection;
  /** Listening: Chinese text read aloud via speech synthesis (never shown). */
  audio?: string;
  /** Reading: a Chinese passage shown to the test-taker. */
  passage?: string;
  passagePinyin?: string;
  /** Reading (single word): the Chinese term shown prominently. */
  term?: string;
  termPinyin?: string;
  /** The localized question prompt. */
  prompt: Translations;
  /** Answer options — exactly one has `correct: true`. */
  choices: ExamChoice[];
};

export type ExamSpec = {
  level: number;
  durationSec: number;
  totalPoints: number;
  passPoints: number;
  /** Target number of questions to draw per section (clamped to availability). */
  blueprint: { section: ExamSection; count: number }[];
};

// Official HSK structure: HSK 1–2 are scored out of 200 (pass 120),
// HSK 3–6 out of 300 (pass 180). Durations approximate the real test.
export const EXAM_SPECS: Record<number, ExamSpec> = {
  1: { level: 1, durationSec: 40 * 60, totalPoints: 200, passPoints: 120, blueprint: [{ section: "listening", count: 10 }, { section: "reading", count: 10 }] },
  2: { level: 2, durationSec: 55 * 60, totalPoints: 200, passPoints: 120, blueprint: [{ section: "listening", count: 12 }, { section: "reading", count: 12 }] },
  3: { level: 3, durationSec: 60 * 60, totalPoints: 300, passPoints: 180, blueprint: [{ section: "listening", count: 12 }, { section: "reading", count: 12 }] },
  4: { level: 4, durationSec: 100 * 60, totalPoints: 300, passPoints: 180, blueprint: [{ section: "listening", count: 15 }, { section: "reading", count: 15 }] },
  5: { level: 5, durationSec: 120 * 60, totalPoints: 300, passPoints: 180, blueprint: [{ section: "listening", count: 15 }, { section: "reading", count: 15 }] },
  6: { level: 6, durationSec: 135 * 60, totalPoints: 300, passPoints: 180, blueprint: [{ section: "listening", count: 20 }, { section: "reading", count: 20 }] },
};

/** Hand-written exam questions. Add real HSK items here over time. */
export const AUTHORED_QUESTIONS: ExamQuestion[] = [];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PROMPT_HEARD: Translations = { uz: "Nimani eshitdingiz?", ru: "Что вы услышали?", en: "What did you hear?" };
const PROMPT_MEANING: Translations = { uz: "Bu so'z nimani anglatadi?", ru: "Что означает это слово?", en: "What does this word mean?" };

/** Three meaning-distractors drawn from the same level first, then any level. */
function distractors(excludeId: string, level: number): Translations[] {
  const sameLevel = VOCAB.filter((v) => v.id !== excludeId && v.hskLevel === level);
  const fallback = VOCAB.filter((v) => v.id !== excludeId);
  const pool = sameLevel.length >= 3 ? sameLevel : fallback;
  return shuffle(pool).slice(0, 3).map((v) => v.meaning);
}

/** Listening: hear a word → pick its meaning. */
function generatedListening(level: number): ExamQuestion[] {
  return VOCAB.filter((v) => v.hskLevel === level).map((v) => ({
    id: `gen-l-${v.id}`,
    level,
    section: "listening" as const,
    audio: v.word,
    prompt: PROMPT_HEARD,
    choices: shuffle([
      { label: v.meaning, correct: true },
      ...distractors(v.id, level).map((label) => ({ label })),
    ]),
  }));
}

/** Reading: passage comprehension built from PASSAGES. */
function generatedReadingPassages(level: number): ExamQuestion[] {
  return PASSAGES.filter((p) => p.hskLevel === level).map((p) => ({
    id: `gen-rp-${p.id}`,
    level,
    section: "reading" as const,
    passage: p.text,
    passagePinyin: p.pinyin,
    prompt: p.question,
    choices: p.options.map((o) => ({ label: o.label, zh: o.zh, correct: o.correct })),
  }));
}

/** Reading: see a word → pick its meaning. */
function generatedReadingWords(level: number): ExamQuestion[] {
  return VOCAB.filter((v) => v.hskLevel === level).map((v) => ({
    id: `gen-rw-${v.id}`,
    level,
    section: "reading" as const,
    term: v.word,
    termPinyin: v.pinyin,
    prompt: PROMPT_MEANING,
    choices: shuffle([
      { label: v.meaning, correct: true },
      ...distractors(v.id, level).map((label) => ({ label })),
    ]),
  }));
}

function allQuestions(level: number): ExamQuestion[] {
  return [
    ...AUTHORED_QUESTIONS.filter((q) => q.level === level),
    ...generatedListening(level),
    ...generatedReadingPassages(level),
    ...generatedReadingWords(level),
  ];
}

/** HSK levels that currently have at least one exam question, ascending. */
export function examLevels(): number[] {
  return Object.keys(EXAM_SPECS)
    .map(Number)
    .filter((lv) => allQuestions(lv).length > 0)
    .sort((a, b) => a - b);
}

export type BuiltExam = {
  spec: ExamSpec;
  questions: ExamQuestion[];
  /** Sections actually present (a section is skipped if it has no questions). */
  sections: ExamSection[];
};

/** Assemble one randomized exam for a level, clamped to available content. */
export function buildExam(level: number): BuiltExam | null {
  const spec = EXAM_SPECS[level];
  if (!spec) return null;
  const pool = allQuestions(level);
  const questions: ExamQuestion[] = [];
  const sections: ExamSection[] = [];
  for (const block of spec.blueprint) {
    const sectionPool = pool.filter((q) => q.section === block.section);
    if (sectionPool.length === 0) continue;
    sections.push(block.section);
    questions.push(...shuffle(sectionPool).slice(0, Math.min(block.count, sectionPool.length)));
  }
  if (questions.length === 0) return null;
  return { spec, questions, sections };
}
