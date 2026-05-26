"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthShell } from "@/components/marketing/AuthShell";
import { useT } from "@/lib/i18n/provider";
import { useAuth, AuthError } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const t = useT();
  const f = t.auth.forgot;
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError(t.auth.errors.missing_fields); return; }
    setBusy(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof AuthError ? t.auth.errors[err.code] : t.auth.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={f.title}
      subtitle={f.subtitle}
      footer={
        <Link href="/login" className="font-medium text-brand hover:underline">
          {f.backToLogin}
        </Link>
      }
    >
      {sent ? (
        <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          {f.sent}
        </p>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-sm font-medium">{f.email}</span>
            <input
              name="email"
              type="email"
              placeholder="siz@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 block h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-brand text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-60"
          >
            {f.submit}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
