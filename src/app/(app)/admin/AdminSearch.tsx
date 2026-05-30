"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X, User as UserIcon, BookOpenText, Layers, FileText, BookOpen, GraduationCap } from "lucide-react";

// Header-level fuzzy search across users + every content table. Debounced;
// arrow-key navigable; closes on outside-click. Picking a result navigates to
// the matching edit page (or user detail page).

type Hit = {
  type: "user" | "vocabulary" | "characters" | "passages" | "lessons" | "exam_questions";
  label: string;
  sublabel?: string;
  href: string;
};

const TYPE_LABEL: Record<Hit["type"], string> = {
  user: "Foydalanuvchi", vocabulary: "Lug'at", characters: "Ieroglif",
  passages: "Matn", lessons: "Dars", exam_questions: "Imtihon savoli",
};
const TYPE_ICON: Record<Hit["type"], typeof Search> = {
  user: UserIcon, vocabulary: BookOpenText, characters: Layers,
  passages: FileText, lessons: BookOpen, exam_questions: GraduationCap,
};

export function AdminSearch() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Cmd/Ctrl+K to focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close on outside-click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  // Debounced fetch.
  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      const r = await fetch(`/api/admin/search?q=${encodeURIComponent(q.trim())}`);
      if (r.ok) {
        const { hits } = await r.json();
        setHits(hits ?? []);
        setIdx(0);
      }
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); return; }
    if (!hits.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(hits.length - 1, i + 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
    if (e.key === "Enter")     {
      e.preventDefault();
      const h = hits[idx];
      if (h) { router.push(h.href); setOpen(false); setQ(""); }
    }
  }

  return (
    <div ref={wrapRef} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Qidirish (email, hanzi, sarlavha)…"
        className="h-10 w-full rounded-full border border-border bg-background pl-9 pr-16 text-sm outline-none focus:border-brand"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
      {q && (
        <button onClick={() => { setQ(""); setHits([]); inputRef.current?.focus(); }} className="absolute right-12 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-muted" aria-label="Tozalash">
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {open && (q.trim().length >= 2 || hits.length > 0) && (
        <div className="absolute left-0 right-0 top-12 z-30 max-h-80 overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
          {loading ? (
            <p className="p-4 text-center text-xs text-muted-foreground">Qidirilmoqda…</p>
          ) : hits.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">
              {q.trim().length < 2 ? "Kamida 2 ta belgi kiriting" : "Hech narsa topilmadi."}
            </p>
          ) : (
            <ul className="py-1">
              {hits.map((h, i) => {
                const Icon = TYPE_ICON[h.type];
                return (
                  <li key={`${h.type}-${i}`}>
                    <Link
                      href={h.href}
                      onClick={() => { setOpen(false); setQ(""); }}
                      onMouseEnter={() => setIdx(i)}
                      className={`flex items-start gap-3 px-3 py-2 text-sm transition ${i === idx ? "bg-brand/10" : "hover:bg-muted"}`}
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{h.label}</span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase text-muted-foreground">{TYPE_LABEL[h.type]}</span>
                        </div>
                        {h.sublabel && <p className="mt-0.5 truncate text-xs text-muted-foreground">{h.sublabel}</p>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
