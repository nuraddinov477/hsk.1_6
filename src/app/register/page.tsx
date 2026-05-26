"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthShell } from "@/components/marketing/AuthShell";
import { useT } from "@/lib/i18n/provider";
import { useAuth, AuthError } from "@/lib/auth";

export default function RegisterPage() {
  const t = useT();
  const r = t.auth.register;
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!email.trim() || !password) { setError(t.auth.errors.missing_fields); return; }
    setBusy(true);
    try {
      const { needsConfirmation } = await register(name, email, password);
      if (needsConfirmation) {
        setNotice(t.auth.confirmEmail);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof AuthError ? t.auth.errors[err.code] : t.auth.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={r.title}
      subtitle={r.subtitle}
      footer={
        <>
          {r.haveAccount}{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            {r.login}
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label={r.name} name="name" type="text" placeholder="Sarvarbek" value={name} onChange={setName} />
        <Field label={r.email} name="email" type="email" placeholder="siz@example.com" value={email} onChange={setEmail} />
        <Field label={r.password} name="password" type="password" placeholder={r.passwordHint} value={password} onChange={setPassword} />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {notice && <p className="rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:text-green-400">{notice}</p>}
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-brand text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-60"
        >
          {r.submit}
        </button>
      </form>
      <p className="text-center text-xs text-muted-foreground">
        {r.termsPrefix}{" "}
        <Link href="/legal/terms" className="underline">{r.terms}</Link>{" "}
        {r.and}{" "}
        <Link href="/legal/privacy" className="underline">{t.footer.privacy}</Link>.
      </p>
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
