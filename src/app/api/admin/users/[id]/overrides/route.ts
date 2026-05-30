import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET  /api/admin/users/:id/overrides
//   → { flags: [{ key, description, category, enabled (global) }],
//       overrides: { [flag_key]: { enabled, reason, updated_at } } }
//
// POST /api/admin/users/:id/overrides  { flag_key, enabled | null, reason? }
//   `enabled: true | false` → upsert the override
//   `enabled: null`         → delete (= revert to inherit-global)

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: targetId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const [flags, overrides] = await Promise.all([
    supabase.from("feature_flags").select("key, enabled, description, category").order("category").order("key"),
    supabase.from("user_module_overrides").select("flag_key, enabled, reason, updated_at").eq("user_id", targetId),
  ]);

  const map: Record<string, { enabled: boolean; reason: string | null; updated_at: string }> = {};
  for (const o of overrides.data ?? []) {
    map[o.flag_key as string] = {
      enabled:    !!o.enabled,
      reason:     (o.reason as string | null) ?? null,
      updated_at: o.updated_at as string,
    };
  }

  return NextResponse.json({ flags: flags.data ?? [], overrides: map });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: targetId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as {
    flag_key?: string; enabled?: boolean | null; reason?: string | null;
  };
  if (!body.flag_key || typeof body.flag_key !== "string") {
    return NextResponse.json({ error: "flag_key required" }, { status: 400 });
  }

  // null → delete the row → user inherits the global flag again.
  if (body.enabled === null) {
    const { error } = await supabase
      .from("user_module_overrides")
      .delete()
      .eq("user_id", targetId)
      .eq("flag_key", body.flag_key);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabase.from("user_events").insert({
      user_id: user.id, event_type: "admin_override_clear",
      payload: { target: targetId, flag_key: body.flag_key },
    });
    return NextResponse.json({ ok: true, cleared: true });
  }

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "enabled must be boolean or null" }, { status: 400 });
  }

  const row = {
    user_id:    targetId,
    flag_key:   body.flag_key,
    enabled:    body.enabled,
    reason:     body.reason ?? null,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };
  const { error } = await supabase.from("user_module_overrides").upsert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from("user_events").insert({
    user_id: user.id,
    event_type: body.enabled ? "admin_override_enable" : "admin_override_disable",
    payload: { target: targetId, flag_key: body.flag_key, reason: body.reason ?? null },
  });
  return NextResponse.json({ ok: true });
}
