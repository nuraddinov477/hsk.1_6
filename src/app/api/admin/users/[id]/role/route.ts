import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// POST /api/admin/users/:id/role { role: 'admin' | 'user' }
// Promotes / demotes a user. Self-demotion is rejected so the panel can't
// be locked out by accident.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: targetId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { role?: string };
  if (body.role !== "admin" && body.role !== "user") {
    return NextResponse.json({ error: "role must be admin or user" }, { status: 400 });
  }
  if (targetId === user.id && body.role !== "admin") {
    return NextResponse.json({ error: "cannot demote yourself" }, { status: 400 });
  }

  const { error } = await supabase.from("profiles").update({ role: body.role }).eq("id", targetId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
