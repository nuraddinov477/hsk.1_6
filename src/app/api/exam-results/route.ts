import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Append-only exam scores. POST records one result; GET lists the user's.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("exam_results")
    .select("level, score, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return NextResponse.json((data ?? []).map((e) => ({ date: e.created_at, score: e.score, level: e.level })));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { score, level } = await request.json();
  if (typeof score !== "number") return NextResponse.json({ error: "score required" }, { status: 400 });

  const { error } = await supabase.from("exam_results").insert({
    user_id: user.id,
    score,
    level: typeof level === "number" ? level : null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
