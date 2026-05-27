import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type SrsCardBody = { id: string; intervalDays: number; ease: number; reps: number; dueAt: number };

// GET: the user's SRS cards as a { [cardId]: card } map (the client's SrsState).
// PUT: upsert the whole map. RLS scopes everything to the current user.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data } = await supabase.from("srs_cards").select("*").eq("user_id", user.id);
  const state: Record<string, SrsCardBody> = {};
  for (const c of data ?? []) {
    state[c.card_id] = {
      id: c.card_id,
      intervalDays: c.interval_days,
      ease: c.ease,
      reps: c.reps,
      dueAt: new Date(c.due_at).getTime(),
    };
  }
  return NextResponse.json(state);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const state = (await request.json()) as Record<string, SrsCardBody>;
  const rows = Object.values(state).map((c) => ({
    user_id: user.id,
    card_id: c.id,
    interval_days: c.intervalDays,
    ease: c.ease,
    reps: c.reps,
    due_at: new Date(c.dueAt).toISOString(),
  }));
  if (rows.length > 0) {
    const { error } = await supabase.from("srs_cards").upsert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
