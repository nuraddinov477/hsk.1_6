import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/admin/counts — for each content table return total row count plus a
// 14-day "new rows per day" sparkline series (oldest → newest). The admin home
// uses this for the per-resource cards (count + trend at a glance).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const tables = ["vocabulary", "characters", "passages", "exam_questions", "lessons", "profiles"] as const;

  const DAYS = 14;
  const now = new Date();
  const cutoff = new Date(now.getTime() - DAYS * 86_400_000);

  const result: Record<string, { count: number; spark: number[]; lastAdded: string | null }> = {};
  await Promise.all(
    tables.map(async (t) => {
      const [{ count }, recent] = await Promise.all([
        supabase.from(t).select("id", { count: "exact", head: true }),
        supabase.from(t).select("created_at").gte("created_at", cutoff.toISOString()).order("created_at", { ascending: false }),
      ]);
      const spark = Array.from({ length: DAYS }, () => 0);
      let lastAdded: string | null = null;
      for (const row of recent.data ?? []) {
        const iso = (row as { created_at: string }).created_at;
        if (!lastAdded) lastAdded = iso;
        const d = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
        const idx = DAYS - 1 - d; // oldest → newest
        if (idx >= 0 && idx < DAYS) spark[idx] += 1;
      }
      result[t] = { count: count ?? 0, spark, lastAdded };
    }),
  );
  return NextResponse.json(result);
}
