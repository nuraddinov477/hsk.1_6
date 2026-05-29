import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/profile — current user's profile + email.
// PUT /api/profile { name } — update display name in profiles.name.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("name, role, blocked, created_at").eq("id", user.id).maybeSingle();
  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: profile?.name ?? null,
    role: profile?.role ?? "user",
    blocked: !!profile?.blocked,
    createdAt: profile?.created_at ?? null,
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { name?: string };
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  if (name.length > 80) return NextResponse.json({ error: "name too long" }, { status: 400 });

  const { error } = await supabase.from("profiles").update({ name }).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, name });
}
