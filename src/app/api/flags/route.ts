import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Public read-only flags endpoint — anyone (signed in or not) can fetch
// the current state, since hiding a disabled module on the client is just
// a UX nicety. The RLS policy permits SELECT to all.
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.from("feature_flags").select("key, enabled, description, category");
  const flags: Record<string, boolean> = {};
  for (const r of data ?? []) flags[r.key] = !!r.enabled;
  return NextResponse.json({ flags, all: data ?? [] });
}
