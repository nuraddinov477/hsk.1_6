"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X, RotateCcw } from "lucide-react";

// Per-user feature gate. Each row shows the *effective* state for the user
// and lets an admin force-enable, force-disable, or revert to inherit-global.

type Flag = { key: string; enabled: boolean; description: string | null; category: string };
type Override = { enabled: boolean; reason: string | null; updated_at: string };
type Payload = { flags: Flag[]; overrides: Record<string, Override> };

const CATEGORY_LABELS: Record<string, string> = {
  module:  "Modullar",
  feature: "Funksiyalar",
  auth:    "Kirish / ro'yxatdan o'tish",
  general: "Boshqa",
};

type State = "force_on" | "force_off" | "inherit";

function stateOf(globalEnabled: boolean, override: Override | undefined): {
  state: State; effective: boolean;
} {
  if (override === undefined) return { state: "inherit", effective: globalEnabled };
  return { state: override.enabled ? "force_on" : "force_off", effective: override.enabled };
}

function Pill({
  on, label, icon: Icon, onClick, disabled, color,
}: {
  on: boolean; label: string; icon: typeof Check; onClick: () => void;
  disabled?: boolean; color: "green" | "red" | "muted";
}) {
  const cls = on
    ? color === "green" ? "bg-green-600 text-white"
      : color === "red"   ? "bg-red-600 text-white"
      :                     "bg-foreground text-background"
    : "border border-border text-muted-foreground hover:bg-muted";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition disabled:opacity-50 ${cls}`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

export function OverridesPanel({ userId }: { userId: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/users/${userId}/overrides`);
    if (r.ok) setData(await r.json());
    setLoading(false);
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  async function setOverride(flagKey: string, enabled: boolean | null, reason?: string | null) {
    setBusy(flagKey);
    const r = await fetch(`/api/admin/users/${userId}/overrides`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flag_key: flagKey, enabled, reason }),
    });
    if (!r.ok) alert("Saqlashda xato.");
    await load();
    setBusy(null);
  }

  if (loading || !data) return <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>;

  const byCategory = data.flags.reduce<Record<string, Flag[]>>((acc, f) => {
    (acc[f.category] ??= []).push(f);
    return acc;
  }, {});

  const overriddenCount = Object.keys(data.overrides).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          Har bir modul / funksiyaga shu foydalanuvchi uchun ruxsat bering yoki o&apos;chiring.
          <span className="ml-1 font-bold text-foreground">{overriddenCount}</span> ta o&apos;zgartirilgan.
        </span>
        {overriddenCount > 0 && (
          <button
            type="button"
            onClick={async () => {
              if (!confirm("Barcha individual sozlamalarni global qiymatga qaytarish?")) return;
              for (const k of Object.keys(data.overrides)) {
                await fetch(`/api/admin/users/${userId}/overrides`, {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ flag_key: k, enabled: null }),
                });
              }
              await load();
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Hammasini global qilish
          </button>
        )}
      </div>

      {Object.entries(byCategory).map(([cat, items]) => (
        <section key={cat} className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {CATEGORY_LABELS[cat] ?? cat}
          </h3>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {items.map((f) => {
              const ov = data.overrides[f.key];
              const { state, effective } = stateOf(f.enabled, ov);
              const isOverridden = state !== "inherit";
              return (
                <li key={f.key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${effective ? "bg-green-500" : "bg-red-500"}`} />
                      <span className="text-base font-semibold">{f.description || f.key}</span>
                      {isOverridden && (
                        <span className="rounded bg-brand/15 px-1.5 py-0.5 text-xs font-bold uppercase text-brand">
                          Maxsus
                        </span>
                      )}
                    </div>
                    <div className="ml-[18px] mt-0.5 font-mono text-xs text-muted-foreground">
                      {f.key} · global: <b className={f.enabled ? "text-green-600" : "text-red-600"}>{f.enabled ? "yoqilgan" : "o'chirilgan"}</b>
                    </div>
                    {ov?.reason && (
                      <div className="ml-[18px] mt-1 text-sm text-red-600">Sabab: <b>{ov.reason}</b></div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Pill
                      on={state === "force_on"} label="Yoqish" icon={Check} color="green"
                      disabled={busy === f.key}
                      onClick={() => setOverride(f.key, true)}
                    />
                    <Pill
                      on={state === "force_off"} label="O'chirish" icon={X} color="red"
                      disabled={busy === f.key}
                      onClick={() => {
                        const reason = prompt(`${f.description || f.key} — o'chirish sababi (ixtiyoriy):`, ov?.reason ?? "");
                        if (reason === null) return;
                        void setOverride(f.key, false, reason || null);
                      }}
                    />
                    <Pill
                      on={state === "inherit"} label="Global" icon={RotateCcw} color="muted"
                      disabled={busy === f.key}
                      onClick={() => setOverride(f.key, null)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
