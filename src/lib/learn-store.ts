"use client";

const PROGRESS_KEY = "hskgo.progress";
const SRS_KEY = "hskgo.srs";
const LEVEL_KEY = "hskgo.level";

export type Progress = {
  xp: number;
  streak: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  charactersLearned: string[]; // hanzi
  vocabLearned: string[]; // vocab id
  completedLessons: string[]; // lesson keys like "listening:l1"
  examScores: { date: string; score: number }[];
};

const DEFAULT_PROGRESS: Progress = {
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  charactersLearned: [],
  vocabLearned: [],
  completedLessons: [],
  examScores: [],
};

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function getProgress(): Progress {
  return safeRead<Progress>(PROGRESS_KEY, DEFAULT_PROGRESS);
}

export function saveProgress(p: Progress) {
  safeWrite(PROGRESS_KEY, p);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hskgo:progress"));
    pushProgress();
  }
}

export function addXp(amount: number) {
  const p = getProgress();
  const today = todayStr();
  let streak = p.streak;
  if (p.lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    streak = p.lastActiveDate === yesterday ? streak + 1 : 1;
  }
  const next: Progress = { ...p, xp: p.xp + amount, streak, lastActiveDate: today };
  saveProgress(next);
  return next;
}

export function markCharacterLearned(hanzi: string) {
  const p = getProgress();
  if (p.charactersLearned.includes(hanzi)) return p;
  const next = { ...p, charactersLearned: [...p.charactersLearned, hanzi] };
  saveProgress(next);
  return next;
}

export function markVocabLearned(id: string) {
  const p = getProgress();
  if (p.vocabLearned.includes(id)) return p;
  const next = { ...p, vocabLearned: [...p.vocabLearned, id] };
  saveProgress(next);
  return next;
}

export function markLessonComplete(key: string) {
  const p = getProgress();
  if (p.completedLessons.includes(key)) return p;
  const next = { ...p, completedLessons: [...p.completedLessons, key] };
  saveProgress(next);
  return next;
}

export function addExamScore(score: number, level?: number) {
  const p = getProgress();
  const next = { ...p, examScores: [...p.examScores, { date: new Date().toISOString(), score }] };
  saveProgress(next);
  postJSON("/api/exam-results", "POST", { score, level });
  return next;
}

export function resetProgress() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PROGRESS_KEY);
  window.localStorage.removeItem(SRS_KEY);
  window.dispatchEvent(new CustomEvent("hskgo:progress"));
}

// ─── Study level filter ───
// "all" means no filter; a number restricts modules to that HSK level.

export type LevelChoice = number | "all";

export function getStudyLevel(): LevelChoice {
  return safeRead<LevelChoice>(LEVEL_KEY, "all");
}

export function setStudyLevel(level: LevelChoice) {
  safeWrite(LEVEL_KEY, level);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hskgo:level"));
  }
}

// ─── SRS (simplified SM-2) ───

export type SrsCard = {
  id: string;          // vocab id
  intervalDays: number;
  ease: number;
  reps: number;
  dueAt: number;       // epoch ms
};

export type SrsState = Record<string, SrsCard>;

export function getSrs(): SrsState {
  return safeRead<SrsState>(SRS_KEY, {});
}

export function saveSrs(s: SrsState) {
  safeWrite(SRS_KEY, s);
  pushSrs();
}

export type SrsGrade = "again" | "hard" | "good" | "easy";

export function reviewCard(id: string, grade: SrsGrade): SrsCard {
  const state = getSrs();
  const now = Date.now();
  const card: SrsCard = state[id] ?? { id, intervalDays: 0, ease: 2.5, reps: 0, dueAt: now };

  let { intervalDays, ease, reps } = card;

  if (grade === "again") {
    reps = 0;
    intervalDays = 0; // due again soon (10 min)
    ease = Math.max(1.3, ease - 0.2);
    const next: SrsCard = { id, intervalDays, ease, reps, dueAt: now + 10 * 60 * 1000 };
    state[id] = next;
    saveSrs(state);
    return next;
  }

  if (reps === 0) intervalDays = 1;
  else if (reps === 1) intervalDays = grade === "easy" ? 4 : 3;
  else {
    const mult = grade === "hard" ? 1.2 : grade === "good" ? ease : ease + 0.15;
    intervalDays = Math.round(intervalDays * mult);
  }

  if (grade === "hard") ease = Math.max(1.3, ease - 0.15);
  if (grade === "easy") ease = ease + 0.1;

  reps += 1;
  const next: SrsCard = {
    id,
    intervalDays,
    ease,
    reps,
    dueAt: now + intervalDays * 86_400_000,
  };
  state[id] = next;
  saveSrs(state);
  return next;
}

export function dueCardIds(allIds: string[]): string[] {
  const state = getSrs();
  const now = Date.now();
  const due: string[] = [];
  const newOnes: string[] = [];
  for (const id of allIds) {
    const card = state[id];
    if (!card) newOnes.push(id);
    else if (card.dueAt <= now) due.push(id);
  }
  // due first, then up to 5 new cards per session
  return [...due, ...newOnes.slice(0, 5)];
}

// ─── Server sync (Supabase via /api) ───
// localStorage stays the synchronous source of truth for instant reads;
// writes are mirrored to the DB (debounced), and on login we pull + merge
// so progress follows the user across devices. All of this no-ops cleanly
// when logged out or offline — the app keeps working on localStorage alone.

function postJSON(url: string, method: string, body: unknown) {
  if (typeof window === "undefined") return;
  void fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});
}

let progressTimer: ReturnType<typeof setTimeout> | null = null;
let srsTimer: ReturnType<typeof setTimeout> | null = null;

function pushProgress() {
  if (typeof window === "undefined") return;
  if (progressTimer) clearTimeout(progressTimer);
  progressTimer = setTimeout(() => postJSON("/api/progress", "PUT", getProgress()), 800);
}

function pushSrs() {
  if (typeof window === "undefined") return;
  if (srsTimer) clearTimeout(srsTimer);
  srsTimer = setTimeout(() => postJSON("/api/srs", "PUT", getSrs()), 800);
}

function mergeProgress(local: Progress, remote: Progress): Progress {
  const union = (a: string[] = [], b: string[] = []) => Array.from(new Set([...a, ...b]));
  return {
    xp: Math.max(local.xp ?? 0, remote.xp ?? 0),
    streak: Math.max(local.streak ?? 0, remote.streak ?? 0),
    lastActiveDate: [local.lastActiveDate, remote.lastActiveDate].filter(Boolean).sort().pop() ?? null,
    charactersLearned: union(local.charactersLearned, remote.charactersLearned),
    vocabLearned: union(local.vocabLearned, remote.vocabLearned),
    completedLessons: union(local.completedLessons, remote.completedLessons),
    // exam_results is the server's canonical list; fall back to local when empty.
    examScores: (remote.examScores?.length ? remote.examScores : local.examScores) ?? [],
  };
}

function mergeSrs(local: SrsState, remote: SrsState): SrsState {
  const out: SrsState = { ...remote };
  for (const [id, card] of Object.entries(local)) {
    const r = out[id];
    if (!r || card.dueAt > r.dueAt) out[id] = card; // keep the most recently scheduled
  }
  return out;
}

/** On login: pull server state, merge with local (no data loss), push the union back. */
export async function pullFromServer() {
  if (typeof window === "undefined") return;
  try {
    const [pRes, sRes] = await Promise.all([fetch("/api/progress"), fetch("/api/srs")]);
    if (pRes.ok) safeWrite(PROGRESS_KEY, mergeProgress(getProgress(), await pRes.json()));
    if (sRes.ok) safeWrite(SRS_KEY, mergeSrs(getSrs(), await sRes.json()));
    window.dispatchEvent(new CustomEvent("hskgo:progress"));
    postJSON("/api/progress", "PUT", getProgress());
    postJSON("/api/srs", "PUT", getSrs());
  } catch {
    /* offline or logged out — localStorage keeps working */
  }
}
