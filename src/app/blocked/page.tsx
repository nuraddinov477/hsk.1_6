import { ShieldX } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function BlockedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("blocked, blocked_reason").eq("id", user.id).maybeSingle()
    : { data: null };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-8 text-center">
        <ShieldX className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="mt-4 text-xl font-semibold">Hisobingiz bloklangan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Administrator sizning hisobingizdan foydalanishni vaqtinchalik to&apos;xtatgan.
        </p>
        {profile?.blocked_reason && (
          <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm">
            <b>Sabab:</b> {profile.blocked_reason}
          </p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Savol va e&apos;tirozlar uchun:{" "}
          <a href="mailto:support@hskgo.uz" className="underline">support@hskgo.uz</a>
        </p>
        <Link
          href="/auth/signout"
          className="mt-6 inline-flex h-10 items-center rounded-full border border-border px-5 text-sm font-medium hover:bg-muted"
        >
          Chiqish
        </Link>
      </div>
    </div>
  );
}
