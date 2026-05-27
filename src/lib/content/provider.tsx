"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  CHARACTERS,
  VOCAB,
  PASSAGES,
  type CharacterEntry,
  type Vocab,
  type Passage,
} from "@/lib/learn-data";
import { type ExamQuestion } from "@/lib/exam-data";

// Content = built-in TS data (always present, instant) MERGED with
// admin-managed rows from the DB (`/api/content`). The TS data is the
// guaranteed baseline, so the app works even if the DB is empty or the
// fetch fails. Admin-added items (e.g. HSK 4–6) appear additively.

type Content = {
  characters: CharacterEntry[];
  vocab: Vocab[];
  passages: Passage[];
  examQuestions: ExamQuestion[];
  loading: boolean;
};

const ContentContext = createContext<Content | null>(null);

function dedupe<T>(items: T[], key: (t: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const k = key(it);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [characters, setCharacters] = useState<CharacterEntry[]>(CHARACTERS);
  const [vocab, setVocab] = useState<Vocab[]>(VOCAB);
  const [passages, setPassages] = useState<Passage[]>(PASSAGES);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/content")
      .then((r) => (r.ok ? r.json() : null))
      .then((db) => {
        if (!active) return;
        if (db) {
          setCharacters(dedupe([...CHARACTERS, ...(db.characters ?? [])], (c) => c.hanzi));
          setVocab(dedupe([...VOCAB, ...(db.vocabulary ?? [])], (v) => v.word));
          setPassages(dedupe([...PASSAGES, ...(db.passages ?? [])], (p) => p.id));
          setExamQuestions(db.examQuestions ?? []);
        }
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <ContentContext.Provider value={{ characters, vocab, passages, examQuestions, loading }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent(): Content {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used inside ContentProvider");
  return ctx;
}
