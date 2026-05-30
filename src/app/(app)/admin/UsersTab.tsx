"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, ShieldOff, Lock, LockOpen, Eye } from "lucide-react";
import { UsersAnalytics } from "./UsersAnalytics";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function fmtMinutes(m: number) {
  if (!m) return "0 daq";
  if (m < 60) return `${Math.round(m)} daq`;
  return `${Math.floor(m / 60)} soat ${Math.round(m % 60)} daq`;
}

function relativeTime(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)      return "hozir";
  if (diff < 3_600_000)   return `${Math.floor(diff / 60_000)} daq oldin`;
  if (diff < 86_400_000)  return `${Math.floor(diff / 3_600_000)} soat oldin`;
  if (diff < 30 * 86_400_000) return `${Math.floor(diff / 86_400_000)} kun oldin`;
  return new Date(iso).toLocaleDateString();
}

function fmtJoinedDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("uz-UZ", { year: "numeric", month: "short", day: "numeric" });
}

export function UsersTab() {
  const [users, setUsers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/users");
    setUsers(r.ok ? await r.json() : []);
    setLoading(false);
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  async function toggleBlock(u: Row) {
    if (u.blocked) {
      if (!confirm(`${u.email} — blokdan chiqarilsinmi?`)) return;
      await fetch(`/api/admin/users/${u.user_id}/block`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked: false }),
      });
    } else {
      const reason = prompt(`${u.email} ni bloklash sababi (ixtiyoriy):`, "");
      if (reason === null) return;
      await fetch(`/api/admin/users/${u.user_id}/block`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked: true, reason: reason || null }),
      });
    }
    await reload();
  }

  async function toggleRole(u: Row) {
    const next = u.role === "admin" ? "user" : "admin";
    const msg = next === "admin"
      ? `${u.email} ga admin huquqi berilsinmi?`
      : `${u.email} dan admin huquqi olib tashlansinmi?`;
    if (!confirm(msg)) return;
    await fetch(`/api/admin/users/${u.user_id}/role`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: next }),
    });
    await reload();
  }

  const q = query.trim().toLowerCase();
  const filtered = q ? users.filter((u) => (u.email as string).toLowerCase().includes(q)) : users;

  return (
    <div className="space-y-6">
      <UsersAnalytics />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <div>
          <h2 className="text-base font-bold tracking-tight">Foydalanuvchilar ro&apos;yxati</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} ta foydalanuvchi · oxirgi faollik bo&apos;yicha tartiblangan</p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Email bo'yicha qidirish…"
          className="h-10 w-full max-w-sm rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left">Email</th>
                <th className="px-3 py-3 text-left">Birinchi kirgan</th>
                <th className="px-3 py-3 text-right">XP</th>
                <th className="px-3 py-3 text-right">Streak</th>
                <th className="px-3 py-3 text-right">Vaqt</th>
                <th className="px-3 py-3 text-right">So'z</th>
                <th className="px-3 py-3 text-right">Dars</th>
                <th className="px-3 py-3 text-right">Imtihon</th>
                <th className="px-3 py-3 text-left">Oxirgi faollik</th>
                <th className="px-3 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr key={u.user_id} className={u.blocked ? "bg-red-500/5" : undefined}>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">{u.email}</span>
                      {u.role === "admin" && (
                        <span className="rounded bg-brand/15 px-1.5 py-0.5 text-xs font-bold uppercase text-brand">ADMIN</span>
                      )}
                      {u.blocked && (
                        <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-xs font-bold uppercase text-red-600">BLOKLANGAN</span>
                      )}
                    </div>
                    {u.blocked_reason && (
                      <div className="mt-1 text-xs text-red-600">Sabab: <b>{u.blocked_reason}</b></div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-sm text-muted-foreground">{fmtJoinedDate(u.registered_at)}</td>
                  <td className="px-3 py-2.5 text-right font-medium tabular-nums">{u.xp}</td>
                  <td className="px-3 py-2.5 text-right font-medium tabular-nums">{u.streak}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{fmtMinutes(u.minutes_total ?? 0)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{u.vocab_learned}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{u.lessons_completed}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{u.exams_taken}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{relativeTime(u.last_seen_at)}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/admin/users/${u.user_id}`}
                        title="Batafsil"
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-brand/10 hover:text-brand"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => toggleRole(u)}
                        title={u.role === "admin" ? "Adminlikdan olib tashlash" : "Admin qilish"}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-brand/10 hover:text-brand"
                      >
                        {u.role === "admin" ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => toggleBlock(u)}
                        title={u.blocked ? "Blokdan chiqarish" : "Bloklash"}
                        className={`rounded-lg p-1.5 ${u.blocked
                          ? "text-green-600 hover:bg-green-500/10"
                          : "text-muted-foreground hover:bg-red-500/10 hover:text-red-600"}`}
                      >
                        {u.blocked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">Foydalanuvchilar topilmadi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
