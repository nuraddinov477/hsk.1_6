import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// POST /api/onboarding — finalise the wizard answers on a *signed-in* profile.
// The wizard runs anonymously; the user registers in the last step; this route
// is hit immediately after a successful sign-up (or by an existing user filling
// in the plan from /profile).
//
// Body:
//   current_level: 0..6
//   target_level:  1..6
//   goal:          'work'|'study'|'exam'|'travel'|'culture'|'other'
//   target_days:   7..730

const GOALS = new Set(["work", "study", "exam", "travel", "culture", "other"]);

type Body = Partial<{
  current_level: number;
  target_level: number;
  goal: string;
  target_days: number;
}>;

function clampInt(v: unknown, min: number, max: number): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < min || i > max) return null;
  return i;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("profiles")
    .select("current_level, target_level, goal, target_days, plan_started_at, onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    current_level:    data?.current_level   ?? null,
    target_level:     data?.target_level    ?? null,
    goal:             data?.goal            ?? null,
    target_days:      data?.target_days     ?? null,
    plan_started_at:  data?.plan_started_at ?? null,
    onboarded_at:     data?.onboarded_at    ?? null,
    done:             !!data?.onboarded_at,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Body;
  const current = clampInt(body.current_level, 0, 6);
  const target  = clampInt(body.target_level, 1, 6);
  const days    = clampInt(body.target_days, 7, 730);
  const goal    = typeof body.goal === "string" && GOALS.has(body.goal) ? body.goal : null;

  if (current === null || target === null || days === null || !goal) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  if (target <= current) {
    return NextResponse.json({ error: "target must be above current level" }, { status: 400 });
  }

  // Preserve plan_started_at on repeat saves so "days left" math stays honest.
  const { data: existing } = await supabase
    .from("profiles").select("plan_started_at").eq("id", user.id).maybeSingle();
  const planStart = existing?.plan_started_at ?? new Date().toISOString();

  const { error } = await supabase
    .from("profiles")
    .update({
      current_level: current,
      target_level: target,
      goal,
      target_days: days,
      plan_started_at: planStart,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log the event so admin stats can see onboarding completion rate.
  await supabase.from("user_events").insert({
    user_id: user.id,
    event_type: "onboarded",
    payload: { current_level: current, target_level: target, goal, target_days: days },
  });

  return NextResponse.json({ ok: true });
}
