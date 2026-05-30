"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ShieldCheck, ShieldOff, Lock, LockOpen, Mail, Calendar,
  Zap, Flame, BookOpen, Languages, GraduationCap, Activity, Trash2,
} from "lucide-react";
import { BarsChart, ChartCard, PALETTE } from "../../charts";
import { EXAM_SPECS } from "@/lib/exam-data";
import { OverridesPanel } from "./OverridesPanel";

type UserDetail = {
  overview: {
    user_id: string; email: string; role: string; blocked: boolean;
    blocked_at: string | null; blocked_reason: string | null;
    registered_at: string; last_sign_in_at: string | null;
    xp: number; streak: number; vocab_learned: number; characters_learned: number;
    lessons_completed: number; exams_taken: number; minutes_total: number;
    last_seen_at: string | null;
  };
  profile: Record<string, unknown> | null;
  progress: Record<string, unknown> | null;
  dailyActivity: { date: string; sessions: number; minutes: number }[];
  events: { event_type: string; payload: unknown; created_at: string }[];
  exams:  { id: string; level: number; score: number; created_at: string }[];
};

const EVENT_LABELS: Record<string, string> = {
  vocab_learned:     "So'z o'rganildi",
  character_learned: "Ieroglif o'rganildi",
  lesson_completed:  "Dars tugatildi",
  exam_submitted:    "Imtihon topshirildi",
  xp_gained:         "XP olindi",
  session_start:     "Sessiya boshlandi",
  session_end:       "Sessiya tugadi",
  admin_block:       "Bloklandi (admin)",
  admin_unblock:     "Blokdan chiqarildi (admin)",
};

const GOAL_LABELS: Record<string, string> = {
  work: "Ish", study: "O'qish", exam: "Imtihon",
  travel: "Sayohat", culture: "Madaniyat", other: "Boshqa",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("uz-UZ", { dateStyle: "medium", timeStyle: "short" });
}

function fmtMinutes(m: number) {
  if (!m) return "0 daq";
  if (m < 60) return `${Math.round(m)} daq`;
  return `${Math.floor(m / 60)} soat ${Math.round(m % 60)} daq`;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)     return "hozir";
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)} daq oldin`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} soat oldin`;
  return new Date(iso).toLocaleDateString();
}

function Kpi({ icon: Icon, label, value, accent }: { icon: typeof Zap; label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${accent ?? "bg-brand/10 text-brand"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="mt-0.5 text-sm font-medium text-muted-foreground">{label}</div>
    </div>
  );
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/users/${id}/detail`);
    if (r.ok) setData(await r.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>;
  if (!data)   return <p className="text-sm text-red-600">Foydalanuvchi topilmadi.</p>;

  const u = data.overview;
  const prof = data.profile as Record<string, unknown> | null;
  const currentLv = (prof?.current_level as number | null) ?? null;
  const targetLv  = (prof?.target_level  as number | null) ?? null;
  const goal      = (prof?.goal          as string | null) ?? null;
  const onboardedAt = (prof?.onboarded_at as string | null) ?? null;

  async function toggleBlock() {
    setBusy(true);
    if (u.blocked) {
      await fetch(`/api/admin/users/${u.user_id}/block`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked: false }),
      });
    } else {
      const reason = prompt("Bloklash sababi (ixtiyoriy):", "");
      if (reason === null) { setBusy(false); return; }
      await fetch(`/api/admin/users/${u.user_id}/block`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked: true, reason: reason || null }),
      });
    }
    setBusy(false);
    await load();
  }

  async function toggleRole() {
    const next = u.role === "admin" ? "user" : "admin";
    if (!confirm(next === "admin" ? "Admin huquqi berilsinmi?" : "Admin huquqi olib tashlansinmi?")) return;
    setBusy(true);
    await fetch(`/api/admin/users/${u.user_id}/role`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: next }),
    });
    setBusy(false);
    await load();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Foydalanuvchilar
          </Link>
          <h1 className="mt-1.5 flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {u.email}
            {u.role === "admin" && <span className="rounded bg-brand/15 px-2 py-0.5 text-xs font-bold uppercase text-brand">ADMIN</span>}
            {u.blocked && <span className="rounded bg-red-500/15 px-2 py-0.5 text-xs font-bold uppercase text-red-600">BLOKLANGAN</span>}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {u.email}</span>
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> ro&apos;yxatdan: {fmtDate(u.registered_at)}</span>
            <span>Oxirgi faollik: {u.last_seen_at ? relativeTime(u.last_seen_at) : "—"}</span>
          </div>
          {u.blocked_reason && (
            <p className="mt-2 text-sm text-red-600">Bloklash sababi: <b>{u.blocked_reason}</b> · {fmtDate(u.blocked_at)}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={toggleRole}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm hover:border-brand/40 disabled:opacity-50"
          >
            {u.role === "admin" ? <><ShieldOff className="h-4 w-4" /> Adminlikni olib tashlash</> : <><ShieldCheck className="h-4 w-4" /> Admin qilish</>}
          </button>
          <button
            onClick={toggleBlock}
            disabled={busy}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-white hover:opacity-90 disabled:opacity-50 ${u.blocked ? "bg-green-600" : "bg-red-600"}`}
          >
            {u.blocked ? <><LockOpen className="h-4 w-4" /> Blokdan chiqarish</> : <><Lock className="h-4 w-4" /> Bloklash</>}
          </button>
        </div>
      </header>

      {/* ── Progress KPIs ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <Kpi icon={Zap}           label="XP"            value={u.xp}                 accent="bg-orange-500/10 text-orange-600" />
        <Kpi icon={Flame}         label="Streak"        value={u.streak}             accent="bg-red-500/10 text-red-600" />
        <Kpi icon={BookOpen}      label="So'z"          value={u.vocab_learned}      accent="bg-blue-500/10 text-blue-600" />
        <Kpi icon={Languages}     label="Ieroglif"      value={u.characters_learned} accent="bg-violet-500/10 text-violet-600" />
        <Kpi icon={GraduationCap} label="Tugatgan dars" value={u.lessons_completed} />
        <Kpi icon={GraduationCap} label="Imtihon"       value={u.exams_taken}        accent="bg-green-500/10 text-green-600" />
        <Kpi icon={Activity}      label="Jami vaqt"     value={fmtMinutes(u.minutes_total)} />
      </div>

      {/* ── Profile / plan summary ───────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Profil va reja">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Joriy daraja</dt>
              <dd className="mt-1 text-base font-semibold">{currentLv == null ? "—" : currentLv === 0 ? "Boshlovchi" : `HSK ${currentLv}`}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Maqsad daraja</dt>
              <dd className="mt-1 text-base font-semibold">{targetLv == null ? "—" : `HSK ${targetLv}`}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Maqsad turi</dt>
              <dd className="mt-1 text-base font-semibold">{goal ? (GOAL_LABELS[goal] ?? goal) : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Onboarding</dt>
              <dd className="mt-1 text-base font-semibold">{onboardedAt ? `tugatgan · ${fmtDate(onboardedAt)}` : "tugatmagan"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Oxirgi kirish</dt>
              <dd className="mt-1 text-base font-semibold">{fmtDate(u.last_sign_in_at)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rol</dt>
              <dd className="mt-1 text-base font-semibold">{u.role}</dd>
            </div>
          </dl>
        </ChartCard>

        <ChartCard title="So'nggi 30 kun faolligi" hint="kunlik sessiyalar">
          <BarsChart
            data={data.dailyActivity.map((d) => ({ label: d.date.slice(5), value: d.sessions }))}
            labelEvery={5}
          />
        </ChartCard>
      </div>

      {/* ── Per-user feature gate ────────────────────────────────────── */}
      <ChartCard title="Modul va funksiyalarga ruxsat" hint="shu foydalanuvchi uchun">
        <OverridesPanel userId={u.user_id} />
      </ChartCard>

      {/* ── Exam history ─────────────────────────────────────────────── */}
      <ChartCard title="Imtihon tarixi" hint={`${data.exams.length} ta yozuv`}>
        {data.exams.length === 0 ? (
          <p className="text-sm text-muted-foreground">Hali imtihon topshirilmagan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5 text-left">Sana</th>
                  <th className="px-3 py-2.5 text-left">HSK</th>
                  <th className="px-3 py-2.5 text-right">Ball</th>
                  <th className="px-3 py-2.5 text-right">%</th>
                  <th className="px-3 py-2.5 text-left">Natija</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.exams.map((e) => {
                  const spec  = EXAM_SPECS[e.level];
                  const total = spec?.totalPoints ?? 0;
                  const passed = spec ? e.score >= spec.passPoints : false;
                  const pct = total > 0 ? Math.round((e.score / total) * 100) : 0;
                  return (
                    <tr key={e.id}>
                      <td className="px-3 py-2.5 text-muted-foreground">{fmtDate(e.created_at)}</td>
                      <td className="px-3 py-2.5 font-semibold">HSK {e.level}</td>
                      <td className="px-3 py-2.5 text-right font-medium tabular-nums">{e.score}{total ? ` / ${total}` : ""}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{pct}%</td>
                      <td className="px-3 py-2.5">
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${passed ? "bg-green-500/15 text-green-600" : "bg-red-500/15 text-red-600"}`}>
                          {passed ? "O'tdi" : "O'tmadi"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>

      {/* ── Event timeline ───────────────────────────────────────────── */}
      <ChartCard title="So'nggi tadbirlar" hint={`${data.events.length} ta`}>
        {data.events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Hali tadbir yo&apos;q.</p>
        ) : (
          <ul className="max-h-96 space-y-2.5 overflow-y-auto pr-1 text-sm">
            {data.events.map((e, i) => {
              const color = PALETTE[i % PALETTE.length];
              return (
                <li key={i} className="flex items-center gap-3 border-b border-border/40 pb-2 last:border-0">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
                  <span className="min-w-0 flex-1 truncate">
                    <b className="font-semibold">{EVENT_LABELS[e.event_type] ?? e.event_type}</b>
                    {!!e.payload && Object.keys(e.payload as object).length > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {JSON.stringify(e.payload).slice(0, 80)}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">{relativeTime(e.created_at)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </ChartCard>

      {/* Hidden router so back button works on success */}
      <div className="hidden" aria-hidden onClick={() => router.refresh()} />
    </div>
  );
}
