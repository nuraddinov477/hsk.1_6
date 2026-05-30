import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Flags endpoint. Public read so the marketing/login pages can read globals,
// but if the request carries an authenticated session we layer that user's
// per-user overrides (user_module_overrides) on top — so an admin can turn off
// individual sections for individual users.
export async function GET() {
  const supabase = await createClient();
  const { data: globals } = await supabase
    .from("feature_flags")
    .select("key, enabled, description, category");

  const flags: Record<string, boolean> = {};
  for (const r of globals ?? []) flags[r.key as string] = !!r.enabled;

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: overrides } = await supabase
      .from("user_module_overrides")
      .select("flag_key, enabled")
      .eq("user_id", user.id);
    for (const o of overrides ?? []) flags[o.flag_key as string] = !!o.enabled;
  }

  return NextResponse.json({ flags, all: globals ?? [] });
}
