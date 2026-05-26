"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import type { AuthErrorCode, PublicUser } from "./auth-types";

export type User = PublicUser;

/** Thrown by login/register so pages can show a localized message via `.code`. */
export class AuthError extends Error {
  code: AuthErrorCode;
  constructor(code: AuthErrorCode) {
    super(code);
    this.code = code;
  }
}

export type RegisterResult = { user: User | null; needsConfirmation: boolean };

type Ctx = {
  user: User | null;
  loading: boolean;
  register: (name: string, email: string, password: string) => Promise<RegisterResult>;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<void>;
  /** Emails a recovery link that lands the user on /reset-password. */
  sendPasswordReset: (email: string) => Promise<void>;
  /** Sets a new password for the currently-recovered session. */
  updatePassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

function toUser(u: SupabaseUser): User {
  const metaName = (u.user_metadata?.name as string | undefined)?.trim();
  return {
    id: u.id,
    email: u.email ?? "",
    name: metaName && metaName.length > 0 ? metaName : (u.email?.split("@")[0] ?? "user"),
    createdAt: u.created_at ?? new Date().toISOString(),
  };
}

/** Best-effort mapping of Supabase auth error messages to our localized codes. */
function mapError(message?: string): AuthErrorCode {
  const m = (message ?? "").toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered") || m.includes("already exists")) return "email_taken";
  if (m.includes("invalid login") || m.includes("invalid credentials")) return "invalid_credentials";
  if (m.includes("password")) return "weak_password";
  if (m.includes("email") || m.includes("missing")) return "missing_fields";
  return "generic";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ? toUser(data.user) : null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toUser(session.user) : null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const register = useCallback<Ctx["register"]>(async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name: name.trim() } },
    });
    if (error) throw new AuthError(mapError(error.message));
    const u = data.user ? toUser(data.user) : null;
    // When email confirmation is enabled, signUp returns no session yet.
    if (data.session && u) setUser(u);
    return { user: u, needsConfirmation: !data.session };
  }, [supabase]);

  const login = useCallback<Ctx["login"]>(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error || !data.user) throw new AuthError(mapError(error?.message));
    const u = toUser(data.user);
    setUser(u);
    return u;
  }, [supabase]);

  const loginWithGoogle = useCallback<Ctx["loginWithGoogle"]>(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // On success the browser is redirected to Google; this line is only reached on error.
    if (error) throw new AuthError("generic");
  }, [supabase]);

  const sendPasswordReset = useCallback<Ctx["sendPasswordReset"]>(async (email) => {
    // The recovery link carries a code → /auth/callback exchanges it for a
    // session, then forwards to /reset-password where the user sets a new one.
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) throw new AuthError(mapError(error.message));
  }, [supabase]);

  const updatePassword = useCallback<Ctx["updatePassword"]>(async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new AuthError(mapError(error.message));
  }, [supabase]);

  const logout = useCallback<Ctx["logout"]>(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{ user, loading, register, login, loginWithGoogle, sendPasswordReset, updatePassword, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
