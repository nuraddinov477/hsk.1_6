import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// PUT { key, enabled } — toggle a single flag. Admin-only (gated by RLS too).
export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { key?: string; enabled?: boolean };
  if (!body.key || typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "key and enabled required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("feature_flags")
    .update({ enabled: body.enabled, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq("key", body.key);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
