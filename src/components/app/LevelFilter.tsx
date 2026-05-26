"use client";

import { useEffect, useState } from "react";
import { getStudyLevel, setStudyLevel, type LevelChoice } from "@/lib/learn-store";
import { useT } from "@/lib/i18n/provider";

/** Reads and updates the persisted study-level filter, staying in sync across modules. */
export function useStudyLevel(): [LevelChoice, (level: LevelChoice) => void] {
  const [level, setLevel] = useState<LevelChoice>("all");

  useEffect(() => {
    setLevel(getStudyLevel());
    function refresh() { setLevel(getStudyLevel()); }
    window.addEventListener("hskgo:level", refresh);
    return () => window.removeEventListener("hskgo:level", refresh);
  }, []);

  function update(next: LevelChoice) {
    setStudyLevel(next); // fires hskgo:level; refresh() updates local state
  }

  return [level, update];
}

/** Pill row to pick "All" or a specific HSK level present in the current module's data. */
export function LevelFilter({ available }: { available: number[] }) {
  const t = useT();
  const [level, setLevel] = useStudyLevel();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs font-medium text-muted-foreground">{t.app.levelFilter.label}</span>
      <Pill active={level === "all"} onClick={() => setLevel("all")}>
        {t.app.levelFilter.all}
      </Pill>
      {available.map((lv) => (
        <Pill key={lv} active={level === lv} onClick={() => setLevel(lv)}>
          HSK {lv}
        </Pill>
      ))}
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`h-7 rounded-full px-3 text-xs font-medium transition ${
        active
          ? "bg-brand text-brand-foreground"
          : "border border-border bg-background text-muted-foreground hover:border-brand/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
