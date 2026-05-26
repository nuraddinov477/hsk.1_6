"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AuthShell } from "@/components/marketing/AuthShell";
import { useT } from "@/lib/i18n/provider";
import { useAuth, AuthError } from "@/lib/auth";

export default function LoginPage() {
  const t = useT();
  const l = t.auth.login;
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Surface failures bounced back from the OAuth callback (?error=oauth).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "oauth") {
      setError(t.auth.errors.generic);
    }
  }, [t]);

  function messageFor(err: unknown) {
    return err instanceof AuthError ? t.auth.errors[err.code] : t.auth.errors.generic;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!email.trim() || !password) { setError(t.auth.errors.missing_fields); return; }
    setBusy(true);
    try {
      await login(email, password);
      // Honour ?next= from the proxy, but only same-origin paths (no open redirect).
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await loginWithGoogle(); // redirects to Google on success
    } catch (err) {
      setError(messageFor(err));
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={l.title}
      subtitle={l.subtitle}
      footer={
        <>
          {l.noAccount}{" "}
          <Link href="/register" className="font-medium text-brand hover:underline">
            {l.register}
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label={l.email} name="email" type="email" placeholder="siz@example.com" value={email} onChange={setEmail} />
        <Field label={l.password} name="password" type="password" placeholder="••••••••" value={password} onChange={setPassword} />
        <div className="-mt-2 text-right">
          <Link href="/forgot-password" className="text-xs text-brand hover:underline">{l.forgot}</Link>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {notice && <p className="rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:text-green-400">{notice}</p>}
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-brand text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-60"
        >
          {l.submit}
        </button>
      </form>
      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> {l.or} <span className="h-px flex-1 bg-border" />
      </div>
      <button
        type="button"
        onClick={onGoogle}
        disabled={busy}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border text-sm font-medium hover:bg-muted disabled:opacity-60"
      >
        {l.google}
      </button>
    </AuthShell>
  );
}

function Field({
  label, name, type, placeholder, value, onChange,
}: {
  label: string; name: string; type: string; placeholder: string;
  value: string; onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 block h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}
