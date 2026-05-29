"use client";

import { useEffect, useState } from "react";
import { Award, X } from "lucide-react";

const SEEN_KEY = "hskgo.achievements.seen";

type Achievement = {
  key: string; title: string; emoji: string; unlocked: boolean;
};

type Toast = { key: string; title: string; emoji: string };

// Watches /api/dashboard for newly-unlocked achievements and shows a
// celebratory toast for each one not yet seen in localStorage.
export function AchievementToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let alive = true;

    async function check() {
      try {
        const r = await fetch("/api/dashboard");
        if (!alive || !r.ok) return;
        const j = (await r.json()) as { achievements?: Achievement[] };
        const unlocked = (j.achievements ?? []).filter((a) => a.unlocked);
        const seen = readSeen();
        const fresh = unlocked.filter((a) => !seen.has(a.key));
        if (fresh.length > 0) {
          setToasts((arr) => [...arr, ...fresh.map((a) => ({ key: a.key, title: a.title, emoji: a.emoji }))]);
          writeSeen(new Set([...seen, ...fresh.map((a) => a.key)]));
          // Auto-dismiss each new toast after 6s.
          fresh.forEach((a) => setTimeout(() => dismiss(a.key), 6000));
        }
      } catch { /* offline / not logged in — silent */ }
    }

    void check();
    const onProgress = () => void check();
    window.addEventListener("hskgo:progress", onProgress);
    return () => { alive = false; window.removeEventListener("hskgo:progress", onProgress); };
  }, []);

  function dismiss(key: string) {
    setToasts((arr) => arr.filter((t) => t.key !== key));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:right-4 sm:left-auto sm:items-end">
      {toasts.map((t) => (
        <div
          key={t.key}
          className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-brand/40 bg-gradient-to-br from-brand/15 to-yellow-500/15 px-4 py-3 shadow-lg backdrop-blur animate-in fade-in slide-in-from-bottom-2"
        >
          <span className="text-3xl leading-none">{t.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-brand">
              <Award className="h-3 w-3" /> Yangi yutuq!
            </div>
            <div className="truncate text-sm font-semibold">{t.title}</div>
          </div>
          <button
            onClick={() => dismiss(t.key)}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            aria-label="Yopish"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

function readSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
}

function writeSeen(s: Set<string>) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(s))); }
  catch { /* ignore */ }
}
