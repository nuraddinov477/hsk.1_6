import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// POST { type: string, payload?: object } — one activity log entry.
// type is a free-form string the client picks (e.g. "vocab_learned").
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { type?: string; payload?: unknown };
  if (!body.type || typeof body.type !== "string") {
    return NextResponse.json({ error: "type required" }, { status: 400 });
  }

  const { error } = await supabase.from("user_events").insert({
    user_id: user.id,
    event_type: body.type.slice(0, 64),
    payload: body.payload ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
