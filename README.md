# HSKGo

A Next.js 16 app for learning Chinese (HSK): marketing landing, email/password +
Google auth, a dashboard, and learn modules (characters, vocabulary, reading,
listening, speaking, writing, exam). UI in Uzbek (default), Russian, and English.

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Supabase Auth** via `@supabase/ssr` (email/password + Google OAuth)
- `framer-motion`, `hanzi-writer`, `pinyin-pro`, `lucide-react`

## Getting started

1. Install dependencies (a peer-dep conflict in the toolchain requires the flag):

   ```bash
   npm install --legacy-peer-deps
   ```

2. Create `.env.local` from the template and fill in your Supabase values:

   ```bash
   cp .env.example .env.local
   ```

   Required variables (Supabase dashboard → Project Settings → API):

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the public/anon key — safe in the browser)

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>.

## Supabase dashboard setup

Auth needs a little configuration in the Supabase dashboard:

1. **Redirect URLs** (Authentication → URL Configuration): add
   - `http://localhost:3000/auth/callback` (dev)
   - `https://<your-domain>/auth/callback` (production)
2. **Google OAuth** (Authentication → Providers → Google): enable it and paste a
   Google Cloud OAuth client ID/secret. Until this is done, the "Continue with
   Google" button fails gracefully with an error message.
3. **Email confirmation** (Authentication → Providers → Email): on by default —
   new users must click the email link before they can sign in. Turn it off for
   faster local testing if you like.

Password reset works out of the box: `/forgot-password` emails a recovery link
that routes through `/auth/callback` to `/reset-password`.

## Security

- **Route protection** runs in `src/proxy.ts` (Next.js 16 renamed `middleware` →
  `proxy`): unauthenticated users are redirected away from `/dashboard` and
  `/learn/*`; signed-in users are redirected away from the auth screens. The
  client guard in `AppShell` is defense in depth.
- **Security headers** (HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`) are set in `next.config.ts`. The
  speaking module needs the microphone, so `microphone=(self)` is allowed.

## Data (current state)

- **Auth** → Supabase (real).
- **Learning progress + SRS** → still in the browser (`localStorage`), not yet
  synced to the database. Content is static in `src/lib/learn-data.ts` (HSK 1–3).

## Deploy (Vercel)

1. Push this repo to GitHub and import it into Vercel.
2. Set the two `NEXT_PUBLIC_SUPABASE_*` env vars in the Vercel project.
3. Add your production `https://<domain>/auth/callback` URL to Supabase Redirect
   URLs (see above).
4. Deploy. Build command `next build`, no extra setup required.
