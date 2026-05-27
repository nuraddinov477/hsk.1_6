import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require an authenticated session.
const PROTECTED_PREFIXES = ["/dashboard", "/learn", "/admin"];
// Auth pages a logged-in user has no reason to see (so we bounce them to the app).
// NOTE: `/reset-password` is intentionally excluded — the recovery link logs the
// user in *before* they reach it, so it must stay reachable while authenticated.
const AUTH_PAGES = ["/login", "/register", "/forgot-password"];

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Refreshes the Supabase auth session on every request and enforces optimistic
 * auth redirects at the edge (before any protected page renders).
 *
 * This is an optimistic check — defense in depth alongside the client guard in
 * AppShell. The app holds no server-side user data, so there is nothing to leak
 * past this point; it exists to stop unauthenticated users ever seeing the app
 * shell, and to keep signed-in users out of the auth screens.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() revalidates the token and triggers cookie refresh.
  // Do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated user hitting a protected route → send to login (remember
  // where they were headed so we can return them there after sign-in).
  if (!user && startsWithAny(pathname, PROTECTED_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return redirectKeepingCookies(url, supabaseResponse);
  }

  // Authenticated user hitting an auth screen → send to the dashboard.
  if (user && startsWithAny(pathname, AUTH_PAGES)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return redirectKeepingCookies(url, supabaseResponse);
  }

  return supabaseResponse;
}

/**
 * Redirect while preserving any auth cookies Supabase just refreshed — without
 * this, a redirect would drop the freshly rotated session cookie.
 */
function redirectKeepingCookies(url: URL, from: NextResponse) {
  const response = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}
