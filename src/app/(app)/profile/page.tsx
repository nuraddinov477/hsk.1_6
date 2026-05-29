"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User as UserIcon, Mail, Lock, Languages, Target, Save, LogOut, CheckCircle2, Sun, Moon, Monitor, Palette } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/dictionary";
import { useTheme, type Theme } from "@/lib/theme/provider";
import { getStudyLevel, setStudyLevel, type LevelChoice } from "@/lib/learn-store";

type Profile = { id: string; email: string; name: string | null; role: string; createdAt: string | null };

const LEVEL_OPTIONS: LevelChoice[] = ["all", 1, 2, 3, 4, 5, 6];

export default function ProfilePage() {
  const router = useRouter();
  const { logout, updatePassword } = useAuth();
  const { locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [studyLevel, setStudyLevelState] = useState<LevelChoice>("all");
  const [savedName, setSavedName] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordOk, setPasswordOk] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/profile");
      if (r.ok) {
        const j: Profile = await r.json();
        setProfile(j);
        setName(j.name ?? "");
      }
      setStudyLevelState(getStudyLevel());
    })();
  }, []);

  async function saveName() {
    if (!name.trim() || saving) return;
    setSaving(true);
    const r = await fetch("/api/profile", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (r.ok) { setSavedName(true); setTimeout(() => setSavedName(false), 2000); }
    setSaving(false);
  }

  function chooseLevel(l: LevelChoice) {
    setStudyLevelState(l);
    setStudyLevel(l);
  }

  async function changePassword() {
    setPasswordError(null);
    if (password.length < 8) { setPasswordError("Kamida 8 ta belgi"); return; }
    try {
      await updatePassword(password);
      setPasswordOk(true);
      setPassword("");
      setTimeout(() => setPasswordOk(false), 2000);
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : "Xato yuz berdi");
    }
  }

  function onLogout() {
    logout();
    router.replace("/");
  }

  if (!profile) {
    return <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <UserIcon className="h-6 w-6 text-brand" /> Profil
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hisobingiz sozlamalari va o&apos;qish afzalliklari.
        </p>
      </header>

      {/* ─── Hisob ─── */}
      <section className="space-y-3 rounded-2xl border border-border bg-background p-5">
        <h2 className="text-sm font-semibold">Hisob</h2>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Ism</span>
          <div className="mt-1 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
            />
            <button
              onClick={saveName}
              disabled={!name.trim() || saving}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-50"
            >
              {savedName ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {savedName ? "Saqlandi" : "Saqlash"}
            </button>
          </div>
        </label>

        <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
          <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="font-medium">{profile.email}</span>
          {profile.role === "admin" && (
            <span className="ml-auto rounded bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand">ADMIN</span>
          )}
        </div>
      </section>

      {/* ─── O'qish darajasi ─── */}
      <section className="space-y-3 rounded-2xl border border-border bg-background p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Target className="h-4 w-4 text-brand" /> O&apos;qish darajasi
        </h2>
        <p className="text-xs text-muted-foreground">
          Modullarda qaysi HSK darajadagi kontent ko&apos;rsatilsin.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {LEVEL_OPTIONS.map((l) => (
            <button
              key={String(l)}
              onClick={() => chooseLevel(l)}
              className={`h-9 rounded-full px-4 text-sm font-medium transition ${
                studyLevel === l ? "bg-brand text-brand-foreground" : "border border-border bg-background"
              }`}
            >
              {l === "all" ? "Hammasi" : `HSK ${l}`}
            </button>
          ))}
        </div>
      </section>

      {/* ─── Til ─── */}
      <section className="space-y-3 rounded-2xl border border-border bg-background p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Languages className="h-4 w-4 text-brand" /> Interfeys tili
        </h2>
        <div className="flex gap-1.5">
          {(["uz", "ru", "en"] as Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={`h-9 rounded-full px-4 text-sm font-medium ${
                locale === l ? "bg-brand text-brand-foreground" : "border border-border bg-background"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      {/* ─── Mavzu (Light / Dark / System) ─── */}
      <section className="space-y-3 rounded-2xl border border-border bg-background p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Palette className="h-4 w-4 text-brand" /> Mavzu
        </h2>
        <p className="text-xs text-muted-foreground">
          Saytning rangini tanlang. &quot;Tizim&quot; — qurilmangiz sozlamasiga moslashadi.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { value: "light",  label: "Yorug'", icon: Sun },
              { value: "dark",   label: "Tungi",  icon: Moon },
              { value: "system", label: "Tizim",  icon: Monitor },
            ] as { value: Theme; label: string; icon: typeof Sun }[]
          ).map(({ value, label, icon: Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 transition ${
                  active ? "border-brand bg-brand/10 text-brand" : "border-border hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Parol ─── */}
      <section className="space-y-3 rounded-2xl border border-border bg-background p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Lock className="h-4 w-4 text-brand" /> Parolni o&apos;zgartirish
        </h2>
        <div className="flex gap-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Yangi parol (kamida 8 ta belgi)"
            className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
          />
          <button
            onClick={changePassword}
            disabled={password.length < 8}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-50"
          >
            {passwordOk ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {passwordOk ? "Yangilandi" : "Yangilash"}
          </button>
        </div>
        {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
      </section>

      {/* ─── Chiqish ─── */}
      <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
        <h2 className="text-sm font-semibold text-red-700">Hisobdan chiqish</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Qaytadan kirish uchun pochta va parolingiz kerak bo&apos;ladi.
        </p>
        <button
          onClick={onLogout}
          className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-full border border-red-500/30 bg-background px-4 text-sm font-medium text-red-700 hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4" /> Chiqish
        </button>
      </section>
    </div>
  );
}
