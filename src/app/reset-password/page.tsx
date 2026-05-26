"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthShell } from "@/components/marketing/AuthShell";
import { useT } from "@/lib/i18n/provider";
import { useAuth, AuthError } from "@/lib/auth";

export default function ResetPasswordPage() {
  const t = useT();
  const rp = t.auth.reset;
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError(t.auth.errors.weak_password); return; }
    setBusy(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => router.replace("/dashboard"), 1200);
    } catch (err) {
      setError(err instanceof AuthError ? t.auth.errors[err.code] : t.auth.errors.generic);
      setBusy(false);
    }
  }

  return (
    <AuthShell title={rp.title} subtitle={rp.subtitle} footer={null}>
      {done ? (
        <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          {rp.success}
        </p>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-sm font-medium">{rp.password}</span>
            <input
              name="password"
              type="password"
              placeholder={rp.passwordHint}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 block h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-brand text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-60"
          >
            {rp.submit}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
