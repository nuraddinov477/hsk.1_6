"use client";

import Link from "next/link";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Search, Plus, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowDown, ArrowUp, X } from "lucide-react";
import type { Resource } from "./resources";

// Generic resource list view — search box, HSK-level filter, sortable column
// headers, pagination, bulk select + bulk delete. Wires straight to
// /api/admin/resource and is the only thing each per-resource page renders.

type Row = Record<string, unknown> & { id: string };

const PAGE_SIZE = 25;

export function ResourceTable({ resource }: { resource: Resource }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [level, setLevel] = useState<number>(0);
  const [sort, setSort] = useState(resource.defaultSort ?? "created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Debounce search input → q so we don't refetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setQ(qInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [qInput]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      type: resource.name,
      page: String(page),
      page_size: String(PAGE_SIZE),
      sort, order,
    });
    if (q) params.set("q", q);
    if (level) params.set("level", String(level));
    const r = await fetch(`/api/admin/resource?${params}`);
    if (r.ok) {
      const j = await r.json();
      setRows(j.rows ?? []);
      setTotal(j.total ?? 0);
    } else {
      setRows([]); setTotal(0);
    }
    setSelected(new Set());
    setLoading(false);
  }, [resource.name, page, q, level, sort, order]);

  useEffect(() => { void load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = selected.size > 0;

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function bulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`${ids.length} ta yozuv o'chirilsinmi?`)) return;
    setBusy(true);
    await fetch("/api/admin/resource", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: resource.name, action: "bulk_delete", ids }),
    });
    setBusy(false);
    await load();
  }

  function onSort(key: string) {
    if (sort === key) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(key); setOrder("asc");
    }
  }

  const showing = useMemo(() => {
    if (total === 0) return "0 ta yozuv";
    const from = (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, total);
    return `${from}–${to} / ${total}`;
  }, [page, total]);

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Qidirish…"
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-9 text-sm outline-none focus:border-brand"
          />
          {qInput && (
            <button onClick={() => setQInput("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-muted" aria-label="Tozalash">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {resource.levelFilter && (
          <select
            value={level}
            onChange={(e) => { setLevel(Number(e.target.value)); setPage(1); }}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
          >
            <option value="0">Barcha HSK</option>
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>HSK {n}</option>)}
          </select>
        )}

        <Link
          href={`/admin/${resource.name}/new`}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-medium text-brand-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Qo&apos;shish
        </Link>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/5 px-4 py-2 text-sm">
          <span><b>{selected.size}</b> ta tanlandi</span>
          <button
            onClick={bulkDelete}
            disabled={busy}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-red-600 px-3 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> O&apos;chirish
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-10 px-3 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Hammasi" />
              </th>
              {resource.list.map((c) => {
                const active = sort === c.key;
                const Icon = active ? (order === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th key={c.key} style={{ width: c.width }} className="px-3 py-3 text-left">
                    <button
                      onClick={() => onSort(c.key)}
                      className={`inline-flex items-center gap-1 transition ${active ? "text-foreground" : "hover:text-foreground"}`}
                    >
                      {c.label} <Icon className="h-3 w-3" />
                    </button>
                  </th>
                );
              })}
              <th className="w-12 px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={resource.list.length + 2} className="px-3 py-8 text-center text-muted-foreground">Yuklanmoqda…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={resource.list.length + 2} className="px-3 py-8 text-center text-muted-foreground">
                Hech narsa topilmadi
              </td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className={selected.has(r.id) ? "bg-brand/5" : "hover:bg-muted/30"}>
                <td className="px-3 py-2">
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} aria-label="Tanlash" />
                </td>
                {resource.list.map((c) => (
                  <td key={c.key} className="px-3 py-2 align-top">
                    {c.render ? c.render(r) : String(r[c.key] ?? "—")}
                  </td>
                ))}
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/admin/${resource.name}/${r.id}`}
                    className="rounded-lg px-2 py-1 text-xs text-brand hover:bg-brand/10"
                  >
                    Tahrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{showing}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background disabled:opacity-40"
            aria-label="Oldingi"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 tabular-nums">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background disabled:opacity-40"
            aria-label="Keyingi"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
