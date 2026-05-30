"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, Sparkles, Target, Calendar,
  Briefcase, GraduationCap, ScrollText, Plane, Heart, MoreHorizontal,
} from "lucide-react";
import { useAuth, AuthError } from "@/lib/auth";
import { useT } from "@/lib/i18n/provider";
import { setStudyLevel } from "@/lib/learn-store";

// /start — the pre-registration wizard. Four content steps + one auth step.
// We persist progress in sessionStorage so a reload doesn't wipe answers; that
// data is cleared the moment we successfully sync to the server.
//
// Why we set study_level locally on success: the rest of the app reads it from
// localStorage to filter content; the server profile is the source of truth,
// but mirroring it locally avoids one extra fetch on first dashboard paint.

const DRAFT_KEY = "hskgo.onboarding.draft";

type Goal = "work" | "study" | "exam" | "travel" | "culture" | "other";

type Draft = {
  current_level: number | null;   // 0 = none yet, 1..6 = HSK level already known
  target_level: number | null;    // 1..6
  goal: Goal | null;
  target_days: number | null;     // 30, 60, 90, 180, 365
};

const EMPTY: Draft = { current_level: null, target_level: null, goal: null, target_days: null };

const CURRENT_OPTIONS: { value: number; label: string; sub: string }[] = [
  { value: 0, label: "Hech qaysi", sub: "Birinchi marta o'rganaman" },
  { value: 1, label: "HSK 1", sub: "Salomlashish, sanoq" },
  { value: 2, label: "HSK 2", sub: "Oddiy gaplar" },
  { value: 3, label: "HSK 3", sub: "Kundalik suhbat" },
  { value: 4, label: "HSK 4", sub: "Erkin suhbat" },
  { value: 5, label: "HSK 5", sub: "Gazeta, film" },
];

const TARGET_OPTIONS = [1, 2, 3, 4, 5, 6];

const GOAL_OPTIONS: { value: Goal; label: string; sub: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "work",    label: "Ish uchun",            sub: "Xitoy kompaniyalari bilan ishlash",  icon: Briefcase },
  { value: "study",   label: "O'qish uchun",         sub: "Xitoyda universitetga kirish",       icon: GraduationCap },
  { value: "exam",    label: "HSK imtihoni",         sub: "Sertifikat olish",                   icon: ScrollText },
  { value: "travel",  label: "Sayohat",              sub: "Xitoyga borish va gaplashish",       icon: Plane },
  { value: "culture", label: "Madaniyat va film",    sub: "Xitoy filmi, musiqasi, tarixi",      icon: Heart },
  { value: "other",   label: "Boshqa sabab",         sub: "Shaxsiy qiziqish uchun",             icon: MoreHorizontal },
];

const TIMELINE_OPTIONS: { days: number; label: string; sub: string }[] = [
  { days: 30,  label: "1 oy",   sub: "Tez sur'at — kuniga 30+ daq." },
  { days: 60,  label: "2 oy",   sub: "Faol sur'at — kuniga 25 daq." },
  { days: 90,  label: "3 oy",   sub: "Muvozanatli — kuniga 20 daq." },
  { days: 180, label: "6 oy",   sub: "Bemalol — kuniga 15 daq." },
  { days: 365, label: "1 yil",  sub: "Sekin va barqaror" },
];

// Rough HSK word counts per level (cumulative). Used for the "words/day" hint.
const HSK_WORD_COUNTS: Record<number, number> = { 0: 0, 1: 150, 2: 300, 3: 600, 4: 1200, 5: 2500, 6: 5000 };

function readDraft(): Draft {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Draft;
    return { ...EMPTY, ...parsed };
  } catch { return EMPTY; }
}

function writeDraft(d: Draft) {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* ignore */ }
}

function clearDraft() {
  if (typeof window === "undefined") return;
  try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

function wordsPerDay(d: Draft): number {
  if (!d.target_level || !d.target_days) return 0;
  const from = HSK_WORD_COUNTS[d.current_level ?? 0] ?? 0;
  const to = HSK_WORD_COUNTS[d.target_level] ?? 0;
  const delta = Math.max(0, to - from);
  return Math.max(1, Math.ceil(delta / d.target_days));
}

export default function StartWizardPage() {
  const router = useRouter();
  const { user, register } = useAuth();
  const t = useT();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  // Inline auth fields live on the final (timeline) step for anonymous users —
  // no separate "create account" screen. Submit collects timeline + credentials
  // and runs register → persistPlan → redirect to /profile in one shot.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setDraft(readDraft()); setHydrated(true); }, []);
  useEffect(() => { if (hydrated) writeDraft(draft); }, [draft, hydrated]);

  const isLoggedIn = !!user;
  const totalSteps = 4;
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  function back() { setStep((s) => Math.max(0, s - 1)); }
  function next() { setStep((s) => Math.min(totalSteps - 1, s + 1)); }

  // Step 3 also gates on email + password when the user isn't signed in.
  const emailLooksOk = /\S+@\S+\.\S+/.test(email.trim());
  const passwordOk = password.length >= 8;
  const canAdvance =
    (step === 0 && draft.current_level !== null) ||
    (step === 1 && draft.target_level !== null && (draft.current_level === null || draft.target_level > draft.current_level)) ||
    (step === 2 && draft.goal !== null) ||
    (step === 3 && draft.target_days !== null && (isLoggedIn || (emailLooksOk && passwordOk)));

  async function persistPlan() {
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!res.ok) throw new Error("could not save plan");
    // Mirror the target level to local content filter so dashboard paints instantly.
    if (draft.target_level) setStudyLevel(draft.target_level as 1 | 2 | 3 | 4 | 5 | 6);
    clearDraft();
  }

  // Single submit path for the final step: registers (if anon) and saves the
  // plan, then takes the user to their freshly-provisioned profile.
  async function finish() {
    if (submitting) return;
    setAuthError(null); setNotice(null);
    setSubmitting(true);
    try {
      if (!isLoggedIn) {
        // No "name" field on this flow — the profile page lets them set it later.
        const { needsConfirmation } = await register("", email, password);
        if (needsConfirmation) {
          // Their session isn't live yet, so the plan can't be saved as them
          // right now. They'll be sent through /start again after confirming.
          setNotice(t.auth.confirmEmail);
          return;
        }
      }
      await persistPlan();
      // Hard navigation so we beat any in-flight client effects that might try
      // to redirect us elsewhere (e.g. the "already onboarded → /dashboard" bounce).
      window.location.assign("/profile");
    } catch (err) {
      setAuthError(err instanceof AuthError ? t.auth.errors[err.code] : t.auth.errors.generic);
      setSubmitting(false);
    }
  }

  // If they hit /start while already onboarded, send them straight to the app.
  // Runs once on mount only — we don't want this firing after the user just
  // registered inside the wizard, since finish() owns the post-save navigation.
  useEffect(() => {
    if (!isLoggedIn || submitting) return;
    fetch("/api/onboarding").then((r) => r.json()).then((j: { done?: boolean }) => {
      if (j.done) router.replace("/dashboard");
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-1 items-start justify-center bg-muted/30 px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl">
        <Link href="/" className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-brand-foreground font-cn text-lg font-bold">汉</span>
          <span className="text-lg font-semibold tracking-tight">HSKGo</span>
        </Link>

        {/* Progress bar */}
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{step + 1} / {totalSteps}</span>
          <span>{progress}%</span>
        </div>
        <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="rounded-3xl border border-border bg-background p-6 shadow-xl shadow-red-500/5 sm:p-8">
          {step === 0 && <StepCurrent draft={draft} set={setDraft} />}
          {step === 1 && <StepTarget draft={draft} set={setDraft} />}
          {step === 2 && <StepGoal draft={draft} set={setDraft} />}
          {step === 3 && (
            <StepTimeline
              draft={draft}
              set={setDraft}
              showAuth={!isLoggedIn}
              email={email}
              password={password}
              setEmail={setEmail}
              setPassword={setPassword}
              authError={authError}
              notice={notice}
              passwordHint={t.auth.register.passwordHint}
            />
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={back}
              disabled={step === 0 || submitting}
              className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-background px-5 text-sm font-medium disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> Orqaga
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={next}
                disabled={!canAdvance}
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-brand px-6 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-50"
              >
                Davom etish <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!canAdvance || submitting}
                onClick={finish}
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-brand px-6 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Saqlanmoqda…" : "Rejani saqlash"} <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {!isLoggedIn && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Allaqachon hisobingiz bormi?{" "}
            <Link href="/login" className="font-medium text-brand hover:underline">Kirish</Link>
          </p>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────── Step 0 — Current level ──────────────────────── */
function StepCurrent({ draft, set }: { draft: Draft; set: (d: Draft) => void }) {
  return (
    <div className="space-y-4">
      <Heading icon={Sparkles} eyebrow="1-savol" title="Hozir qaysi darajadasiz?" sub="Halol bo'ling — biz darslarni shu yerdan boshlaymiz." />
      <div className="grid gap-2 sm:grid-cols-2">
        {CURRENT_OPTIONS.map((o) => {
          const active = draft.current_level === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => set({ ...draft, current_level: o.value, target_level: draft.target_level && draft.target_level <= o.value ? null : draft.target_level })}
              className={`group flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition ${
                active ? "border-brand bg-brand/10" : "border-border hover:border-brand/40 hover:bg-muted/40"
              }`}
            >
              <div>
                <div className="text-sm font-semibold">{o.label}</div>
                <div className="text-xs text-muted-foreground">{o.sub}</div>
              </div>
              {active && <Check className="h-5 w-5 text-brand" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────── Step 1 — Target level ───────────────────────── */
function StepTarget({ draft, set }: { draft: Draft; set: (d: Draft) => void }) {
  const minTarget = (draft.current_level ?? 0) + 1;
  return (
    <div className="space-y-4">
      <Heading icon={Target} eyebrow="2-savol" title="Qaysi darajaga yetishni xohlaysiz?" sub="Maqsadingizga qarab dastur shaxsiy reja tuzadi." />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {TARGET_OPTIONS.map((lv) => {
          const disabled = lv < minTarget;
          const active = draft.target_level === lv;
          return (
            <button
              key={lv}
              type="button"
              disabled={disabled}
              onClick={() => set({ ...draft, target_level: lv })}
              className={`relative aspect-square rounded-2xl border text-center transition ${
                active
                  ? "border-brand bg-brand text-brand-foreground"
                  : disabled
                    ? "border-border bg-muted/40 text-muted-foreground opacity-40"
                    : "border-border hover:border-brand/40 hover:bg-muted/40"
              }`}
            >
              <div className="text-[10px] font-medium uppercase tracking-wide opacity-70">HSK</div>
              <div className="mt-0.5 text-3xl font-bold">{lv}</div>
            </button>
          );
        })}
      </div>
      {draft.current_level !== null && draft.current_level > 0 && (
        <p className="text-xs text-muted-foreground">
          Siz HSK {draft.current_level} ni biladigan bo&apos;lganingiz uchun, undan yuqori darajalardan tanlang.
        </p>
      )}
    </div>
  );
}

/* ──────────────────────────── Step 2 — Goal ───────────────────────────────── */
function StepGoal({ draft, set }: { draft: Draft; set: (d: Draft) => void }) {
  return (
    <div className="space-y-4">
      <Heading icon={Heart} eyebrow="3-savol" title="Nima uchun xitoy tilini o'rganmoqchisiz?" sub="Sababingiz darslar ohangiga ta'sir qiladi." />
      <div className="grid gap-2 sm:grid-cols-2">
        {GOAL_OPTIONS.map((o) => {
          const Icon = o.icon;
          const active = draft.goal === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => set({ ...draft, goal: o.value })}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                active ? "border-brand bg-brand/10" : "border-border hover:border-brand/40 hover:bg-muted/40"
              }`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-brand text-brand-foreground" : "bg-muted text-foreground"}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{o.label}</div>
                <div className="text-xs text-muted-foreground">{o.sub}</div>
              </div>
              {active && <Check className="h-5 w-5 text-brand" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────── Step 3 — Timeline + inline auth ─────────────── */
function StepTimeline({
  draft, set, showAuth, email, password, setEmail, setPassword, authError, notice, passwordHint,
}: {
  draft: Draft; set: (d: Draft) => void;
  showAuth: boolean;
  email: string; password: string;
  setEmail: (v: string) => void; setPassword: (v: string) => void;
  authError: string | null; notice: string | null;
  passwordHint: string;
}) {
  const wpd = wordsPerDay(draft);
  return (
    <div className="space-y-4">
      <Heading icon={Calendar} eyebrow="4-savol" title="Qancha vaqtda yetmoqchisiz?" sub="Reja shu muddatga moslashtiriladi." />
      <div className="space-y-2">
        {TIMELINE_OPTIONS.map((o) => {
          const active = draft.target_days === o.days;
          return (
            <button
              key={o.days}
              type="button"
              onClick={() => set({ ...draft, target_days: o.days })}
              className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition ${
                active ? "border-brand bg-brand/10" : "border-border hover:border-brand/40 hover:bg-muted/40"
              }`}
            >
              <div>
                <div className="text-base font-semibold">{o.label}</div>
                <div className="text-xs text-muted-foreground">{o.sub}</div>
              </div>
              {active && <Check className="h-5 w-5 text-brand" />}
            </button>
          );
        })}
      </div>
      {wpd > 0 && (
        <div className="rounded-xl border border-brand/30 bg-brand/5 px-4 py-3 text-sm">
          <span className="font-semibold text-brand">≈ {wpd} so&apos;z / kun</span>
          <span className="ml-2 text-muted-foreground">— bu sur&apos;atda HSK {draft.target_level} ga yetasiz.</span>
        </div>
      )}

      {/* Inline auth: appears only for anonymous visitors. Keeps the wizard at
          a single 4-step flow — "Rejani saqlash" registers and persists in one
          tap, then lands them on /profile. */}
      {showAuth && draft.target_days !== null && (
        <div className="mt-5 space-y-3 border-t border-border pt-5">
          <div className="text-xs font-semibold text-muted-foreground">
            Email va parol — keyingi safar shu bilan kirasiz
          </div>
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="siz@example.com"
            autoComplete="email"
          />
          <Field
            label="Parol"
            value={password}
            onChange={setPassword}
            type="password"
            placeholder={passwordHint}
            autoComplete="new-password"
          />
          {authError && <p className="text-xs text-red-600">{authError}</p>}
          {notice && (
            <p className="rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:text-green-400">
              {notice}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── shared bits ─────────────────────────────────── */
function Heading({
  icon: Icon, eyebrow, title, sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string; title: string; sub: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand">
        <Icon className="h-3.5 w-3.5" /> {eyebrow}
      </div>
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function Field({
  label, value, onChange, type, placeholder, autoComplete,
}: {
  label: string; value: string; onChange: (v: string) => void; type: string; placeholder: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 block h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}
