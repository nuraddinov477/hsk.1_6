import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// User session lifecycle:
//   POST   → start a session (returns its id)
//   PUT    → heartbeat (bumps last_seen_at to now)
//   DELETE → end the session (also sets last_seen_at to now)
// All silently no-op when unauthenticated — tracker.ts treats that as "skip".

const DAILY_BONUS_XP = 10;

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

  // Daily login bonus — first session of the UTC day grants +10 XP. Detected
  // by checking if any xp_gained event with kind='daily_login' already exists
  // for today. Best-effort: errors here don't block session creation.
  let bonus = 0;
  try {
    const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("user_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("event_type", "daily_login")
      .gte("created_at", todayStart.toISOString());
    if ((count ?? 0) === 0) {
      await supabase.from("user_events").insert({
        user_id: user.id,
        event_type: "daily_login",
        payload: { amount: DAILY_BONUS_XP },
      });
      await supabase.from("user_events").insert({
        user_id: user.id,
        event_type: "xp_gained",
        payload: { amount: DAILY_BONUS_XP, source: "daily_login" },
      });
      const { data: up } = await supabase
        .from("user_progress").select("xp").eq("user_id", user.id).maybeSingle();
      const newXp = (up?.xp ?? 0) + DAILY_BONUS_XP;
      await supabase.from("user_progress").upsert({
        user_id: user.id, xp: newXp, updated_at: new Date().toISOString(),
      });
      bonus = DAILY_BONUS_XP;
    }
  } catch { /* swallow — session still works */ }

  return NextResponse.json({ id: data.id, bonus });
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
