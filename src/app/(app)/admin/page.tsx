"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, Plus, ShieldAlert, BarChart3, Users as UsersIcon, ToggleLeft, BookOpenText, Layers, FileText, GraduationCap, Upload } from "lucide-react";
import { UsersTab } from "./UsersTab";
import { StatsTab } from "./StatsTab";
import { FlagsTab } from "./FlagsTab";
import { ImportTab } from "./ImportTab";

type Tab = "stats" | "users" | "flags" | "import" | "vocabulary" | "characters" | "passages" | "exam_questions";
const TABS: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
  { key: "stats",          label: "Statistika",     icon: BarChart3 },
  { key: "users",          label: "Foydalanuvchilar", icon: UsersIcon },
  { key: "flags",          label: "Sozlamalar",     icon: ToggleLeft },
  { key: "import",         label: "Ko'p yuklash",   icon: Upload },
  { key: "vocabulary",     label: "Lug'at",          icon: BookOpenText },
  { key: "characters",     label: "Ieroglif",       icon: Layers },
  { key: "passages",       label: "O'qish matni",   icon: FileText },
  { key: "exam_questions", label: "Imtihon savoli", icon: GraduationCap },
];

type ML = { uz: string; ru: string; en: string };
const emptyML = (): ML => ({ uz: "", ru: "", en: "" });
const mlFilled = (m: ML) => m.uz.trim() && m.ru.trim() && m.en.trim();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function useAdminList(type: Tab) {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/content?type=${type}`);
    setItems(r.ok ? await r.json() : []);
    setLoading(false);
  }, [type]);

  useEffect(() => { void reload(); }, [reload]);

  const add = useCallback(async (data: unknown) => {
    const r = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data }),
    });
    if (r.ok) await reload();
    return r.ok;
  }, [type, reload]);

  const remove = useCallback(async (id: string) => {
    await fetch(`/api/admin/content?type=${type}&id=${id}`, { method: "DELETE" });
    await reload();
  }, [type, reload]);

  return { items, loading, add, remove };
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
      />
    </label>
  );
}

function MlField({ label, value, onChange }: { label: string; value: ML; onChange: (v: ML) => void }) {
  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1 grid grid-cols-3 gap-2">
        {(["uz", "ru", "en"] as const).map((k) => (
          <input
            key={k}
            value={value[k]}
            placeholder={k.toUpperCase()}
            onChange={(e) => onChange({ ...value, [k]: e.target.value })}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
          />
        ))}
      </div>
    </div>
  );
}

function LevelField({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">HSK daraja</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 block h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
      >
        {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>HSK {n}</option>)}
      </select>
    </label>
  );
}

function AddButton({ disabled }: { disabled: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-5 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-50"
    >
      <Plus className="h-4 w-4" /> Qo'shish
    </button>
  );
}

function ItemList({ items, loading, render, onDelete }: {
  items: Row[]; loading: boolean; render: (r: Row) => React.ReactNode; onDelete: (id: string) => void;
}) {
  if (loading) return <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>;
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Hali qo'shilmagan.</p>;
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {items.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
          <span className="min-w-0 truncate">{render(r)}</span>
          <button onClick={() => onDelete(r.id)} className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600" aria-label="O'chirish">
            <Trash2 className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function VocabularyAdmin() {
  const { items, loading, add, remove } = useAdminList("vocabulary");
  const [word, setWord] = useState("");
  const [pinyin, setPinyin] = useState("");
  const [level, setLevel] = useState(4);
  const [meaning, setMeaning] = useState<ML>(emptyML());
  const valid = word.trim() && pinyin.trim() && mlFilled(meaning);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const ok = await add({ word: word.trim(), pinyin: pinyin.trim(), hskLevel: level, meaning });
    if (ok) { setWord(""); setPinyin(""); setMeaning(emptyML()); }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-background p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="So'z (汉字)" value={word} onChange={setWord} placeholder="经济" />
          <Field label="Pinyin" value={pinyin} onChange={setPinyin} placeholder="jīng jì" />
          <LevelField value={level} onChange={setLevel} />
        </div>
        <MlField label="Ma'nosi" value={meaning} onChange={setMeaning} />
        <AddButton disabled={!valid} />
      </form>
      <ItemList items={items} loading={loading} onDelete={remove}
        render={(r) => <><b className="font-cn">{r.word}</b> · {r.pinyin} · {r.meaning?.uz} · HSK {r.hsk_level}</>} />
    </div>
  );
}

function CharactersAdmin() {
  const { items, loading, add, remove } = useAdminList("characters");
  const [hanzi, setHanzi] = useState("");
  const [pinyin, setPinyin] = useState("");
  const [level, setLevel] = useState(4);
  const [meaning, setMeaning] = useState<ML>(emptyML());
  const valid = hanzi.trim() && pinyin.trim() && mlFilled(meaning);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const ok = await add({ hanzi: hanzi.trim(), pinyin: pinyin.trim(), hskLevel: level, meaning });
    if (ok) { setHanzi(""); setPinyin(""); setMeaning(emptyML()); }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-background p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Ieroglif (汉字)" value={hanzi} onChange={setHanzi} placeholder="经" />
          <Field label="Pinyin" value={pinyin} onChange={setPinyin} placeholder="jīng" />
          <LevelField value={level} onChange={setLevel} />
        </div>
        <MlField label="Ma'nosi" value={meaning} onChange={setMeaning} />
        <AddButton disabled={!valid} />
      </form>
      <ItemList items={items} loading={loading} onDelete={remove}
        render={(r) => <><b className="font-cn">{r.hanzi}</b> · {r.pinyin} · {r.meaning?.uz} · HSK {r.hsk_level}</>} />
    </div>
  );
}

function PassagesAdmin() {
  const { items, loading, add, remove } = useAdminList("passages");
  const [level, setLevel] = useState(4);
  const [title, setTitle] = useState<ML>(emptyML());
  const [text, setText] = useState("");
  const [pinyin, setPinyin] = useState("");
  const [translation, setTranslation] = useState<ML>(emptyML());
  const [question, setQuestion] = useState<ML>(emptyML());
  const [opts, setOpts] = useState([emptyML(), emptyML(), emptyML()]);
  const [optZh, setOptZh] = useState(["", "", ""]);
  const [correct, setCorrect] = useState(0);
  const valid = text.trim() && pinyin.trim() && mlFilled(title) && mlFilled(question) && opts.every(mlFilled);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const options = opts.map((label, i) => ({ label, zh: optZh[i] || undefined, correct: i === correct }));
    const ok = await add({ hskLevel: level, title, text: text.trim(), pinyin: pinyin.trim(), translation, question, options });
    if (ok) {
      setTitle(emptyML()); setText(""); setPinyin(""); setTranslation(emptyML());
      setQuestion(emptyML()); setOpts([emptyML(), emptyML(), emptyML()]); setOptZh(["", "", ""]); setCorrect(0);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-background p-4">
        <LevelField value={level} onChange={setLevel} />
        <MlField label="Sarlavha" value={title} onChange={setTitle} />
        <Field label="Matn (汉字)" value={text} onChange={setText} placeholder="我爱喝茶。" />
        <Field label="Pinyin" value={pinyin} onChange={setPinyin} placeholder="wǒ ài hē chá." />
        <MlField label="Tarjima" value={translation} onChange={setTranslation} />
        <MlField label="Savol" value={question} onChange={setQuestion} />
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Variantlar (to'g'risini belgilang)</span>
          {opts.map((o, i) => (
            <div key={i} className="flex items-start gap-2">
              <input type="radio" name="p-correct" checked={correct === i} onChange={() => setCorrect(i)} className="mt-3" />
              <input value={optZh[i]} placeholder="汉字" onChange={(e) => setOptZh(optZh.map((v, j) => j === i ? e.target.value : v))}
                className="h-10 w-24 shrink-0 rounded-lg border border-border bg-background px-2 text-sm font-cn outline-none focus:border-brand" />
              <div className="grid flex-1 grid-cols-3 gap-2">
                {(["uz", "ru", "en"] as const).map((k) => (
                  <input key={k} value={o[k]} placeholder={k.toUpperCase()}
                    onChange={(e) => setOpts(opts.map((x, j) => j === i ? { ...x, [k]: e.target.value } : x))}
                    className="h-10 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-brand" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <AddButton disabled={!valid} />
      </form>
      <ItemList items={items} loading={loading} onDelete={remove}
        render={(r) => <><b>{r.title?.uz}</b> · <span className="font-cn">{r.text}</span> · HSK {r.hsk_level}</>} />
    </div>
  );
}

function ExamAdmin() {
  const { items, loading, add, remove } = useAdminList("exam_questions");
  const [level, setLevel] = useState(4);
  const [section, setSection] = useState<"listening" | "reading">("listening");
  const [audio, setAudio] = useState("");
  const [term, setTerm] = useState("");
  const [termPinyin, setTermPinyin] = useState("");
  const [passage, setPassage] = useState("");
  const [prompt, setPrompt] = useState<ML>(emptyML());
  const [choices, setChoices] = useState([emptyML(), emptyML(), emptyML(), emptyML()]);
  const [correct, setCorrect] = useState(0);
  const hasStimulus = section === "listening" ? audio.trim() : (term.trim() || passage.trim());
  const valid = !!hasStimulus && mlFilled(prompt) && choices.every(mlFilled);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const data = {
      level, section,
      audio: section === "listening" ? audio.trim() : undefined,
      term: section === "reading" ? term.trim() || undefined : undefined,
      termPinyin: section === "reading" ? termPinyin.trim() || undefined : undefined,
      passage: section === "reading" ? passage.trim() || undefined : undefined,
      prompt,
      choices: choices.map((label, i) => ({ label, correct: i === correct })),
    };
    const ok = await add(data);
    if (ok) {
      setAudio(""); setTerm(""); setTermPinyin(""); setPassage("");
      setPrompt(emptyML()); setChoices([emptyML(), emptyML(), emptyML(), emptyML()]); setCorrect(0);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-background p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <LevelField value={level} onChange={setLevel} />
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Bo'lim</span>
            <select value={section} onChange={(e) => setSection(e.target.value as "listening" | "reading")}
              className="mt-1 block h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand">
              <option value="listening">Tinglash (audio)</option>
              <option value="reading">O'qish</option>
            </select>
          </label>
        </div>
        {section === "listening" ? (
          <Field label="Audio matni (xitoycha — ovoz chiqarib o'qiladi)" value={audio} onChange={setAudio} placeholder="你好,老师" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="So'z/ieroglif (ixtiyoriy)" value={term} onChange={setTerm} placeholder="经济" />
            <Field label="So'z pinyin (ixtiyoriy)" value={termPinyin} onChange={setTermPinyin} placeholder="jīng jì" />
            <div className="sm:col-span-2">
              <Field label="Yoki o'qish matni (ixtiyoriy)" value={passage} onChange={setPassage} placeholder="我喜欢旅游…" />
            </div>
          </div>
        )}
        <MlField label="Savol matni" value={prompt} onChange={setPrompt} />
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Variantlar (to'g'risini belgilang)</span>
          {choices.map((c, i) => (
            <div key={i} className="flex items-start gap-2">
              <input type="radio" name="e-correct" checked={correct === i} onChange={() => setCorrect(i)} className="mt-3" />
              <div className="grid flex-1 grid-cols-3 gap-2">
                {(["uz", "ru", "en"] as const).map((k) => (
                  <input key={k} value={c[k]} placeholder={k.toUpperCase()}
                    onChange={(e) => setChoices(choices.map((x, j) => j === i ? { ...x, [k]: e.target.value } : x))}
                    className="h-10 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-brand" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <AddButton disabled={!valid} />
      </form>
      <ItemList items={items} loading={loading} onDelete={remove}
        render={(r) => <>{r.section === "listening" ? "🎧" : "📖"} <b className="font-cn">{r.audio || r.term || r.passage}</b> · {r.prompt?.uz} · HSK {r.level}</>} />
    </div>
  );
}

export default function AdminPage() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("stats");

  useEffect(() => {
    fetch("/api/admin/whoami")
      .then((r) => r.json())
      .then((d) => setAdmin(!!d.admin))
      .catch(() => setAdmin(false));
  }, []);

  if (admin === null) return <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>;

  if (!admin) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-background p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-orange-500" />
        <h1 className="mt-4 text-lg font-semibold">Kirish taqiqlangan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bu sahifa faqat administratorlar uchun. Admin huquqini olish uchun Supabase&apos;da o&apos;z profilingiz <code>role</code> ustunini <code>admin</code> qiling.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">Kontent qo&apos;shish va boshqarish. Qo&apos;shilgan kontent saytda darhol ko&apos;rinadi.</p>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition ${
                tab === t.key ? "bg-brand text-brand-foreground" : "border border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "stats" && <StatsTab />}
      {tab === "users" && <UsersTab />}
      {tab === "flags" && <FlagsTab />}
      {tab === "import" && <ImportTab />}
      {tab === "vocabulary" && <VocabularyAdmin />}
      {tab === "characters" && <CharactersAdmin />}
      {tab === "passages" && <PassagesAdmin />}
      {tab === "exam_questions" && <ExamAdmin />}
    </div>
  );
}
