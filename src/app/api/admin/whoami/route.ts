import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Lightweight check the UI uses to decide whether to show the Admin link.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ admin: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({ admin: profile?.role === "admin" });
}
