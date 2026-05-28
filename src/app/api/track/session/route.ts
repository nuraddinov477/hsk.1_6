import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// User session lifecycle:
//   POST   → start a session (returns its id)
//   PUT    → heartbeat (bumps last_seen_at to now)
//   DELETE → end the session (also sets last_seen_at to now)
// All silently no-op when unauthenticated — tracker.ts treats that as "skip".

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { userAgent?: string };
  const { data, error } = await supabase
    .from("user_sessions")
    .insert({ user_id: user.id, user_agent: body.userAgent ?? null })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // RLS guarantees the session belongs to this user — no extra .eq("user_id") needed.
  const { error } = await supabase
    .from("user_sessions")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("user_sessions")
    .update({ last_seen_at: now, ended_at: now })
    .eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
