import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// POST /api/admin/users/:id/block { blocked: boolean, reason?: string }
// Flips the profiles.blocked flag — proxy.ts then redirects the user to
// /blocked on their next request.
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

  // Guardrail: don't let an admin block their own session out from under them.
  if (targetId === user.id) {
    return NextResponse.json({ error: "cannot block yourself" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as { blocked?: boolean; reason?: string };
  if (typeof body.blocked !== "boolean") {
    return NextResponse.json({ error: "blocked required" }, { status: 400 });
  }

  const update = body.blocked
    ? { blocked: true,  blocked_at: new Date().toISOString(), blocked_reason: body.reason ?? null }
    : { blocked: false, blocked_at: null,                     blocked_reason: null };

  const { error } = await supabase.from("profiles").update(update).eq("id", targetId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Audit log — best effort.
  await supabase.from("user_events").insert({
    user_id: user.id,
    event_type: body.blocked ? "admin_block" : "admin_unblock",
    payload: { type: "profiles", id: targetId, reason: body.reason ?? null },
  });
  return NextResponse.json({ ok: true });
}
