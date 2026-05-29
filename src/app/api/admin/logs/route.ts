import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/admin/logs?page=1 — recent admin-side activity from user_events.
// Filters for events with type beginning "admin_" so it stays focused on
// what an operator did (create / update / delete / bulk_delete / role / block).
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = 50;
  const from = (page - 1) * pageSize;

  const { data, count, error } = await supabase
    .from("user_events")
    .select("id, user_id, event_type, payload, created_at", { count: "exact" })
    .like("event_type", "admin_%")
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Join in actor emails so the log is readable without a second round-trip.
  const userIds = Array.from(new Set((data ?? []).map((r) => r.user_id))).filter(Boolean);
  let actors: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profs } = await supabase
      .from("admin_user_overview")
      .select("id, email")
      .in("id", userIds);
    actors = Object.fromEntries((profs ?? []).map((p: { id: string; email: string }) => [p.id, p.email]));
  }

  return NextResponse.json({
    rows: (data ?? []).map((r) => ({ ...r, actor_email: actors[r.user_id] ?? null })),
    total: count ?? 0, page, page_size: pageSize,
  });
}
