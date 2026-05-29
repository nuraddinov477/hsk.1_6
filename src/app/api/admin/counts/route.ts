import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/admin/counts — one row counts per content model. Used by the admin
// home to render Django-style "X rows" badges next to each section.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const tables = ["vocabulary", "characters", "passages", "exam_questions", "lessons", "profiles"] as const;
  const counts: Record<string, number> = {};
  await Promise.all(
    tables.map(async (t) => {
      const { count } = await supabase.from(t).select("id", { count: "exact", head: true });
      counts[t] = count ?? 0;
    })
  );
  return NextResponse.json(counts);
}
