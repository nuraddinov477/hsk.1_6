"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Feature flags are fetched once on app shell mount and refreshed every minute.
// The defaults below match the migration seed — they keep the app fully
// functional if /api/flags is unreachable or hasn't been called yet.

const DEFAULT_FLAGS: Record<string, boolean> = {
  "module.characters": true,
  "module.vocabulary": true,
  "module.listening": true,
  "module.reading": true,
  "module.writing": true,
  "module.speaking": true,
  "module.exam": true,
  "feature.tts": true,
  "feature.stroke_animation": true,
  "feature.srs": true,
  "feature.leaderboard": true,
  "auth.registration": true,
  "auth.google_oauth": true,
};

const FlagsContext = createContext<Record<string, boolean>>(DEFAULT_FLAGS);

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<Record<string, boolean>>(DEFAULT_FLAGS);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await fetch("/api/flags");
        if (!r.ok || !alive) return;
        const j = (await r.json()) as { flags?: Record<string, boolean> };
        if (j.flags) setFlags({ ...DEFAULT_FLAGS, ...j.flags });
      } catch {
        /* keep defaults */
      }
    }
    void load();
    const t = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return <FlagsContext.Provider value={flags}>{children}</FlagsContext.Provider>;
}

/** True iff the named flag is enabled. Unknown keys default to true. */
export function useFlag(key: string): boolean {
  const flags = useContext(FlagsContext);
  return flags[key] ?? true;
}

/** All flags as a plain map. */
export function useFlags(): Record<string, boolean> {
  return useContext(FlagsContext);
}
