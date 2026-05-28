import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /auth/signout — signs the user out and bounces them to /login.
// Used by the /blocked screen, since a blocked user can't reach the
// normal logout button (proxy keeps redirecting them back).
export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const url = new URL("/login", request.url);
  return NextResponse.redirect(url);
}
