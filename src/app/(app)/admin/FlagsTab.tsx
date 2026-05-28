"use client";

import { useCallback, useEffect, useState } from "react";

type Flag = { key: string; enabled: boolean; description: string | null; category: string };

const CATEGORY_LABELS: Record<string, string> = {
  module:  "Modullar",
  feature: "Funksiyalar",
  auth:    "Kirish / ro'yxatdan o'tish",
  general: "Boshqa",
};

function Switch({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-pressed={on}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-brand" : "bg-muted"} disabled:opacity-50`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

export function FlagsTab() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/flags");
    if (r.ok) {
      const j = (await r.json()) as { all?: Flag[] };
      setFlags(j.all ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  async function toggle(f: Flag) {
    setPendingKey(f.key);
    // optimistic update so the switch feels instant
    setFlags((arr) => arr.map((x) => x.key === f.key ? { ...x, enabled: !x.enabled } : x));
    const r = await fetch("/api/admin/flags", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: f.key, enabled: !f.enabled }),
    });
    if (!r.ok) {
      // revert on failure
      setFlags((arr) => arr.map((x) => x.key === f.key ? { ...x, enabled: f.enabled } : x));
      alert("Saqlashda xato. Qayta urinib ko'ring.");
    }
    setPendingKey(null);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>;

  const byCategory = flags.reduce<Record<string, Flag[]>>((acc, f) => {
    (acc[f.category] ??= []).push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Har bir funksiyani yoqib-o&apos;chirib qo&apos;ying. O&apos;zgartirish darhol amal qiladi —
        oddiy foydalanuvchilarga 1 daqiqa ichida ko&apos;rinadi.
      </p>
      {Object.entries(byCategory).map(([cat, items]) => (
        <section key={cat} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {CATEGORY_LABELS[cat] ?? cat}
          </h2>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {items.map((f) => (
              <li key={f.key} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <div className="font-medium">{f.description || f.key}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{f.key}</div>
                </div>
                <Switch on={f.enabled} onChange={() => toggle(f)} disabled={pendingKey === f.key} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
