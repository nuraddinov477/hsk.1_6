"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, History, Plus, Pencil, Trash2, Layers, ShieldX, User as UserIcon } from "lucide-react";

// Audit log page — reads from /api/admin/logs (user_events filtered to
// admin_*) and renders each event with a contextual icon + actor email +
// relative timestamp. Pagination is server-driven.

type LogRow = {
  id: string;
  user_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
  actor_email: string | null;
};

const ICON_BY_TYPE: Record<string, React.ComponentType<{ className?: string }>> = {
  admin_create:       Plus,
  admin_update:       Pencil,
  admin_delete:       Trash2,
  admin_bulk_delete:  Layers,
  admin_block:        ShieldX,
  admin_unblock:      UserIcon,
  admin_role_change:  UserIcon,
};

const LABEL_BY_TYPE: Record<string, string> = {
  admin_create:       "Yaratildi",
  admin_update:       "Tahrirlandi",
  admin_delete:       "O'chirildi",
  admin_bulk_delete:  "Ommaviy o'chirish",
  admin_block:        "Bloklandi",
  admin_unblock:      "Blokdan chiqarildi",
  admin_role_change:  "Roli o'zgartirildi",
};

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec} soniya oldin`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} daqiqa oldin`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} soat oldin`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} kun oldin`;
  return new Date(iso).toLocaleDateString();
}

export default function AdminLogsPage() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const r = await fetch(`/api/admin/logs?page=${page}`);
      if (r.ok && alive) {
        const j = await r.json();
        setRows(j.rows ?? []);
        setTotal(j.total ?? 0);
      }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="space-y-4">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <History className="h-6 w-6 text-brand" /> Faoliyat tarixi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administratorlar tomonidan amalga oshirilgan barcha o&apos;zgarishlar.
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-12 px-3 py-3" />
              <th className="px-3 py-3 text-left">Amal</th>
              <th className="px-3 py-3 text-left">Kim</th>
              <th className="px-3 py-3 text-left">Qaerda</th>
              <th className="px-3 py-3 text-left">Qachon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Yuklanmoqda…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Hozircha tarixda yozuv yo&apos;q</td></tr>
            ) : rows.map((r) => {
              const Icon = ICON_BY_TYPE[r.event_type] ?? History;
              const label = LABEL_BY_TYPE[r.event_type] ?? r.event_type;
              const target = (r.payload?.type as string | undefined) ?? "—";
              const rowId = (r.payload?.id as string | undefined) ?? (r.payload?.count ? `${r.payload.count} ta` : "");
              return (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-medium">{label}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{r.actor_email ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-xs text-muted-foreground">{target}</span>
                    {rowId && <span className="ml-2 text-xs text-muted-foreground">· {rowId}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground" title={r.created_at}>{relTime(r.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{total} ta yozuv</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 tabular-nums">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
