import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Daily missions:
//   GET → returns today's 3 missions for this user. If they don't exist yet
//         we pick them randomly from active templates and seed the rows.
//   POST { template_id } → recompute progress for that mission (server reads
//         the user's events for today) and, if target hit, mark complete +
//         claim XP. Idempotent.

const PICK_COUNT = 3;

function todayUtc() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

async function ensureToday(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const day = todayUtc();
  // Already have rows? Return them.
  const { data: existing } = await supabase
    .from("user_missions").select("template_id").eq("user_id", userId).eq("day", day);
  if (existing && existing.length >= PICK_COUNT) {
    return existing.map((r) => r.template_id as string);
  }

  // Pick PICK_COUNT distinct active templates at random.
  const { data: templates } = await supabase
    .from("mission_templates").select("id").eq("active", true);
  const ids = (templates ?? []).map((t) => t.id as string);
  if (ids.length === 0) return [];
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const picked = ids.slice(0, PICK_COUNT);

  // Insert any that aren't there yet (idempotent via unique constraint).
  const existingIds = new Set((existing ?? []).map((r) => r.template_id as string));
  const toInsert = picked.filter((id) => !existingIds.has(id)).map((tid) => ({
    user_id: userId, template_id: tid, day,
  }));
  if (toInsert.length) await supabase.from("user_missions").insert(toInsert);
  return picked;
}

async function computeProgress(
  supabase: SupabaseClient, userId: string, kind: string, day: string,
): Promise<number> {
  // Count today's events of the kind that matches the template.
  // gain_xp summing payload.amount is a special case; others are simple counts.
  const dayStart = `${day}T00:00:00Z`;
  const dayEnd   = `${day}T23:59:59Z`;

  if (kind === "gain_xp") {
    const { data } = await supabase
      .from("user_events").select("payload, created_at")
      .eq("user_id", userId).eq("event_type", "xp_gained")
      .gte("created_at", dayStart).lte("created_at", dayEnd);
    return (data ?? []).reduce((sum, row) => {
      const p = row.payload as { amount?: number } | null;
      return sum + (p?.amount ?? 0);
    }, 0);
  }

  const eventType = {
    learn_vocab:     "vocab_learned",
    learn_chars:     "character_learned",
    complete_lesson: "lesson_completed",
    take_exam:       "exam_submitted",
  }[kind];
  if (!eventType) return 0;

  const { count } = await supabase
    .from("user_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId).eq("event_type", eventType)
    .gte("created_at", dayStart).lte("created_at", dayEnd);
  return count ?? 0;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await ensureToday(supabase, user.id);
  const day = todayUtc();

  const { data: rows } = await supabase
    .from("user_missions")
    .select("id, template_id, progress, completed_at, claimed_at, mission_templates(id, kind, target, xp_reward, title)")
    .eq("user_id", user.id).eq("day", day);

  type Tmpl = { id: string; kind: string; target: number; xp_reward: number; title: unknown };
  type MissionRow = {
    id: string; template_id: string; progress: number;
    completed_at: string | null; claimed_at: string | null;
    mission_templates: Tmpl | Tmpl[] | null;
  };

  // Recompute progress on every read so it stays accurate.
  const out: Array<{
    id: string; templateId: string; kind: string; target: number;
    progress: number; xpReward: number; title: unknown;
    completed: boolean; claimed: boolean;
  }> = [];
  for (const r of (rows ?? []) as unknown as MissionRow[]) {
    const rawTmpl = r.mission_templates;
    const tmpl: Tmpl | null = Array.isArray(rawTmpl) ? (rawTmpl[0] ?? null) : rawTmpl;
    if (!tmpl) continue;
    const progress = await computeProgress(supabase, user.id, tmpl.kind, day);
    const completed = progress >= tmpl.target;
    // Persist progress + completed_at if it moved.
    if (progress !== r.progress || (completed && !r.completed_at)) {
      await supabase.from("user_missions").update({
        progress,
        completed_at: completed ? (r.completed_at ?? new Date().toISOString()) : null,
      }).eq("id", r.id);
    }
    out.push({
      id: r.id,
      templateId: tmpl.id,
      kind: tmpl.kind,
      target: tmpl.target,
      progress,
      xpReward: tmpl.xp_reward,
      title: tmpl.title,
      completed,
      claimed: !!r.claimed_at,
    });
  }

  return NextResponse.json({ day, missions: out });
}

// POST { missionId } — claim XP for a completed mission. Idempotent.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { missionId?: string };
  if (!body.missionId) return NextResponse.json({ error: "missionId required" }, { status: 400 });

  const { data: row } = await supabase
    .from("user_missions")
    .select("id, template_id, completed_at, claimed_at, mission_templates(xp_reward)")
    .eq("id", body.missionId)
    .eq("user_id", user.id)
    .maybeSingle();
  type TmplReward = { xp_reward: number };
  type ClaimRow = {
    id: string; template_id: string; completed_at: string | null; claimed_at: string | null;
    mission_templates: TmplReward | TmplReward[] | null;
  };
  const r = row as unknown as ClaimRow | null;
  if (!r) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!r.completed_at) return NextResponse.json({ error: "not complete yet" }, { status: 400 });
  if (r.claimed_at)    return NextResponse.json({ ok: true, alreadyClaimed: true });

  const rt = r.mission_templates;
  const reward = (Array.isArray(rt) ? rt[0]?.xp_reward : rt?.xp_reward) ?? 0;
  const now = new Date().toISOString();

  // Mark claimed first to prevent double-claim races.
  const { error } = await supabase
    .from("user_missions").update({ claimed_at: now }).eq("id", r.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Bump XP server-side too (the client also adds it locally — server stays
  // authoritative on /api/progress next pull).
  if (reward > 0) {
    const { data: up } = await supabase
      .from("user_progress").select("xp").eq("user_id", user.id).maybeSingle();
    const newXp = (up?.xp ?? 0) + reward;
    await supabase.from("user_progress").upsert({
      user_id: user.id, xp: newXp, updated_at: now,
    });
  }

  return NextResponse.json({ ok: true, reward });
}
