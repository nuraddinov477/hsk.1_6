"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Save, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Resource, FieldDef } from "./resources";

// Generic edit/create form driven by Resource.form definitions. Renders one
// field per FieldDef, validates required fields client-side, and POST/PATCHes
// to /api/admin/resource. On save it bounces back to the list.

type FormData = Record<string, unknown>;
type ML = { uz?: string; ru?: string; en?: string };

function emptyMl(): ML { return { uz: "", ru: "", en: "" }; }

function getInitial(resource: Resource): FormData {
  const init: FormData = {};
  for (const f of resource.form) {
    if (f.kind === "ml") init[f.key] = emptyMl();
    else if (f.kind === "tags") init[f.key] = [];
    else if (f.kind === "boolean") init[f.key] = false;
    else if (f.kind === "number") init[f.key] = "";
    else if (f.kind === "json") init[f.key] = "[]";
    else init[f.key] = "";
  }
  return init;
}

function rowToForm(resource: Resource, row: Record<string, unknown>): FormData {
  const out: FormData = {};
  for (const f of resource.form) {
    const v = row[f.key];
    if (f.kind === "ml") out[f.key] = v ?? emptyMl();
    else if (f.kind === "tags") out[f.key] = Array.isArray(v) ? v : [];
    else if (f.kind === "json") out[f.key] = JSON.stringify(v ?? [], null, 2);
    else if (f.kind === "boolean") out[f.key] = !!v;
    else if (f.kind === "number") out[f.key] = v != null ? String(v) : "";
    else out[f.key] = v ?? "";
  }
  return out;
}

function formToPayload(resource: Resource, data: FormData): { ok: boolean; payload?: Record<string, unknown>; error?: string } {
  const out: Record<string, unknown> = {};
  for (const f of resource.form) {
    const v = data[f.key];
    if (f.required) {
      if (f.kind === "ml") {
        const ml = (v ?? {}) as ML;
        if (!ml.uz?.trim()) return { ok: false, error: `"${f.label}" — kamida UZ to'ldiring` };
      } else if (f.kind === "json") {
        if (typeof v !== "string" || !v.trim()) return { ok: false, error: `"${f.label}" — bo'sh` };
      } else if (typeof v === "string" && !v.trim()) {
        return { ok: false, error: `"${f.label}" — bo'sh` };
      } else if (v === undefined || v === null) {
        return { ok: false, error: `"${f.label}" — bo'sh` };
      }
    }
    if (f.kind === "number") {
      const n = Number(v);
      if (v === "" || Number.isNaN(n)) {
        if (f.required) return { ok: false, error: `"${f.label}" — raqam kiriting` };
        out[f.key] = null;
      } else out[f.key] = n;
    } else if (f.kind === "json") {
      try {
        out[f.key] = JSON.parse(String(v));
      } catch {
        return { ok: false, error: `"${f.label}" — JSON noto'g'ri` };
      }
    } else {
      out[f.key] = v;
    }
  }
  return { ok: true, payload: out };
}

export function ResourceForm({ resource, id }: { resource: Resource; id?: string }) {
  const router = useRouter();
  const [data, setData] = useState<FormData>(() => getInitial(resource));
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      const r = await fetch(`/api/admin/resource/${id}?type=${resource.name}`);
      if (r.ok && alive) {
        const row = await r.json();
        setData(rowToForm(resource, row));
      }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [id, resource]);

  function setField(key: string, value: unknown) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function save() {
    setError(null);
    const built = formToPayload(resource, data);
    if (!built.ok) { setError(built.error ?? "Xatolik"); return; }
    setSaving(true);
    const r = id
      ? await fetch(`/api/admin/resource/${id}?type=${resource.name}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(built.payload),
        })
      : await fetch(`/api/admin/resource`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: resource.name, data: built.payload }),
        });
    setSaving(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setError(j.error ?? "Saqlanmadi");
      return;
    }
    router.push(`/admin/${resource.name}`);
    router.refresh();
  }

  async function del() {
    if (!id) return;
    if (!confirm("Yozuvni o'chirishni xohlaysizmi?")) return;
    setDeleting(true);
    await fetch(`/api/admin/resource/${id}?type=${resource.name}`, { method: "DELETE" });
    setDeleting(false);
    router.push(`/admin/${resource.name}`);
    router.refresh();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href={`/admin/${resource.name}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {resource.label} ro&apos;yxati
      </Link>

      <div className="space-y-4 rounded-2xl border border-border bg-background p-5 sm:p-6">
        <h1 className="text-xl font-bold tracking-tight">
          {id ? "Tahrirlash" : "Yangi qo'shish"} · <span className="text-muted-foreground font-normal">{resource.label}</span>
        </h1>

        <div className="space-y-4">
          {resource.form.map((f) => (
            <FormField key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} />
          ))}
        </div>

        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-700 dark:text-red-400">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-5 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? "Saqlanmoqda…" : "Saqlash"}
            </button>
            <Link
              href={`/admin/${resource.name}`}
              className="inline-flex h-10 items-center rounded-full border border-border bg-background px-5 text-sm font-medium hover:bg-muted"
            >
              Bekor qilish
            </Link>
          </div>
          {id && (
            <button
              onClick={del}
              disabled={deleting}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-red-500/30 px-4 text-sm font-medium text-red-700 hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> {deleting ? "O'chirilmoqda…" : "O'chirish"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FormField({ field, value, onChange }: {
  field: FieldDef; value: unknown; onChange: (v: unknown) => void;
}) {
  const label = (
    <span className="text-sm font-medium">
      {field.label}{field.required && <span className="ml-0.5 text-red-500">*</span>}
    </span>
  );
  const help = field.help && <p className="mt-1 text-xs text-muted-foreground">{field.help}</p>;
  const baseInput = "block h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand";

  switch (field.kind) {
    case "text":
      return (
        <label className="block">
          {label}
          <input
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={`mt-1 ${baseInput}`}
          />
          {help}
        </label>
      );
    case "textarea":
      return (
        <label className="block">
          {label}
          <textarea
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className="mt-1 block w-full rounded-lg border border-border bg-background p-3 text-sm font-cn outline-none focus:border-brand"
          />
          {help}
        </label>
      );
    case "markdown":
      return (
        <label className="block">
          {label}
          <textarea
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={10}
            className="mt-1 block w-full rounded-lg border border-border bg-background p-3 text-sm font-mono outline-none focus:border-brand"
          />
          {help}
        </label>
      );
    case "number":
      return (
        <label className="block">
          {label}
          <input
            type="number"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={`mt-1 ${baseInput}`}
          />
          {help}
        </label>
      );
    case "select":
      return (
        <label className="block">
          {label}
          <select
            value={(value as string | number) ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              // Preserve number type when the options are numbers.
              const optType = field.options?.[0] && typeof field.options[0].value;
              onChange(optType === "number" ? Number(raw) : raw);
            }}
            className={`mt-1 ${baseInput}`}
          >
            <option value="">— tanlang —</option>
            {field.options?.map((o) => (
              <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
            ))}
          </select>
          {help}
        </label>
      );
    case "ml": {
      const ml = (value ?? {}) as ML;
      const langs = field.langs ?? ["uz", "ru", "en"];
      return (
        <div>
          {label}
          <div className="mt-1 grid grid-cols-3 gap-2">
            {langs.map((k) => (
              <input
                key={k}
                value={ml[k] ?? ""}
                placeholder={k.toUpperCase()}
                onChange={(e) => onChange({ ...ml, [k]: e.target.value })}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
              />
            ))}
          </div>
          {help}
        </div>
      );
    }
    case "tags": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <label className="block">
          {label}
          <input
            type="text"
            value={arr.join(", ")}
            onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            placeholder={field.placeholder}
            className={`mt-1 ${baseInput} font-cn`}
          />
          {help}
        </label>
      );
    }
    case "json":
      return (
        <label className="block">
          {label}
          <textarea
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={8}
            className="mt-1 block w-full rounded-lg border border-border bg-background p-3 text-xs font-mono outline-none focus:border-brand"
          />
          {help}
        </label>
      );
    case "boolean":
      return (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-brand"
          />
          {label}
          {help}
        </label>
      );
  }
}
