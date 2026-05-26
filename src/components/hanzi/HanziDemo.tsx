"use client";

import { useEffect, useRef, useState } from "react";
import { pinyin } from "pinyin-pro";
import { RotateCcw, Play } from "lucide-react";
import { useT } from "@/lib/i18n/provider";

const CHARS = ["你", "好", "学", "中", "国", "爱"] as const;

export function HanziDemo() {
  const t = useT();
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const writerRef = useRef<any>(null);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);

  const currentChar = CHARS[index];
  const py = pinyin(currentChar, { toneType: "symbol" });
  const meaning = t.hanzi.meanings[currentChar] ?? "";

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { default: HanziWriter } = await import("hanzi-writer");
      if (cancelled || !containerRef.current) return;

      containerRef.current.innerHTML = "";
      writerRef.current = HanziWriter.create(containerRef.current, currentChar, {
        width: 240,
        height: 240,
        padding: 12,
        strokeColor: "#dc2626",
        radicalColor: "#fbbf24",
        delayBetweenStrokes: 250,
        strokeAnimationSpeed: 1.2,
        showOutline: true,
        showCharacter: false,
      });
      setReady(true);
      writerRef.current.animateCharacter();
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [currentChar]);

  function replay() {
    writerRef.current?.animateCharacter();
  }

  return (
    <div className="w-full max-w-sm rounded-3xl border border-border bg-background p-6 shadow-2xl shadow-red-500/10">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>{t.hanzi.label}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono">{index + 1} / {CHARS.length}</span>
      </div>

      <div
        ref={containerRef}
        className="mx-auto my-4 flex h-60 w-60 items-center justify-center rounded-2xl bg-[linear-gradient(0deg,transparent_49%,theme(colors.zinc.200)_49%,theme(colors.zinc.200)_51%,transparent_51%),linear-gradient(90deg,transparent_49%,theme(colors.zinc.200)_49%,theme(colors.zinc.200)_51%,transparent_51%)] dark:bg-[linear-gradient(0deg,transparent_49%,theme(colors.zinc.800)_49%,theme(colors.zinc.800)_51%,transparent_51%),linear-gradient(90deg,transparent_49%,theme(colors.zinc.800)_49%,theme(colors.zinc.800)_51%,transparent_51%)]"
      />

      <div className="text-center">
        <div className="font-cn text-3xl font-semibold">{currentChar}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          <span className="font-mono text-brand">{py}</span> · {meaning}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-2">
        <button
          onClick={replay}
          disabled={!ready}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-border text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" /> {t.hanzi.replay}
        </button>
        <button
          onClick={() => setIndex((i) => (i + 1) % CHARS.length)}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-foreground text-sm font-medium text-background hover:opacity-90"
        >
          <RotateCcw className="h-3.5 w-3.5" /> {t.hanzi.next}
        </button>
      </div>
    </div>
  );
}
