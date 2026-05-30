import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// GET /api/admin/resource/export?type=X&q=foo&level=4
// Streams a CSV of all rows for the given type, honoring the same filters as
// the list view but without pagination. Multilingual jsonb fields are
// flattened (uz/ru/en) and array fields are joined with "; ".

const TABLES = ["vocabulary", "characters", "passages", "exam_questions", "lessons"] as const;
type T = (typeof TABLES)[number];

const SEARCHABLE: Record<T, string[]> = {
  vocabulary:     ["word", "pinyin"],
  characters:     ["hanzi", "pinyin"],
  passages:       ["text", "pinyin"],
  exam_questions: ["audio", "term", "passage"],
  lessons:        [],
};

const LEVEL_COL: Record<T, string> = {
  vocabulary: "hsk_level", characters: "hsk_level", passages: "hsk_level",
  lessons: "hsk_level", exam_questions: "level",
};

function parseType(v: string | null): T | null {
  return TABLES.includes(v as T) ? (v as T) : null;
}

async function requireAdmin(): Promise<
  { supabase: SupabaseClient; ok: true } | { ok: false; status: number }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401 };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { ok: false, status: 403 };
  return { supabase, ok: true };
}

function isMlObject(v: unknown): v is Record<string, string> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const k = Object.keys(v);
  return k.length > 0 && k.every((x) => ["uz", "ru", "en"].includes(x));
}

function stringifyCell(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(stringifyCell).join("; ");
  if (isMlObject(v)) return v.uz ?? v.ru ?? v.en ?? "";
  return JSON.stringify(v);
}

function csvEscape(s: string): string {
  if (s === "") return "";
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return new Response("forbidden", { status: auth.status });
  const { supabase } = auth;

  const url = new URL(request.url);
  const type = parseType(url.searchParams.get("type"));
  if (!type) return new Response("bad type", { status: 400 });

  const q = (url.searchParams.get("q") ?? "").trim();
  const level = Number(url.searchParams.get("level") ?? "0");

  let query = supabase.from(type).select("*").order("created_at", { ascending: false }).limit(10_000);
  if (level >= 1 && level <= 6) query = query.eq(LEVEL_COL[type], level);
  if (q && SEARCHABLE[type].length > 0) {
    const ors = SEARCHABLE[type].map((c) => `${c}.ilike.%${q}%`).join(",");
    query = query.or(ors);
  }

  const { data, error } = await query;
  if (error) return new Response(error.message, { status: 500 });

  let rows = data ?? [];
  if (type === "lessons" && q) {
    const needle = q.toLowerCase();
    rows = rows.filter((r: Record<string, unknown>) => {
      const t = (r.title ?? {}) as Record<string, string>;
      return Object.values(t).some((v) => (v ?? "").toLowerCase().includes(needle));
    });
  }

  // Build the column header from the union of keys we encountered, preserving
  // first-seen order. Skip noisy internal columns.
  const skip = new Set(["search_vector"]);
  const headers: string[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    for (const k of Object.keys(r)) {
      if (skip.has(k) || seen.has(k)) continue;
      seen.add(k);
      headers.push(k);
    }
  }

  const lines: string[] = [];
  lines.push(headers.map(csvEscape).join(","));
  for (const r of rows) {
    lines.push(headers.map((h) => csvEscape(stringifyCell((r as Record<string, unknown>)[h]))).join(","));
  }

  const filename = `${type}_${new Date().toISOString().slice(0, 10)}.csv`;
  // Prepend BOM so Excel detects UTF-8 properly.
  const body = "﻿" + lines.join("\n");

  return new Response(body, {
    headers: {
      "content-type":        "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control":       "no-store",
    },
  });
}
