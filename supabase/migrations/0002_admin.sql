-- =====================================================================
-- HSKGo backend — admin v2: analytics, feature flags, user block
-- Apply once: Supabase dashboard -> SQL Editor -> paste this -> Run.
-- Safe to re-run (idempotent).
-- =====================================================================

-- ───────────────────────── profiles: block columns ─────────────────────────
alter table public.profiles
  add column if not exists blocked        boolean not null default false,
  add column if not exists blocked_at     timestamptz,
  add column if not exists blocked_reason text;

-- ───────────────────────── user_sessions ─────────────────────────
-- One row per "I opened the app" — opened from app-shell mount; heartbeat
-- bumps last_seen_at every 30s; ended_at set on tab close / visibilitychange.
-- Time-on-platform per user = sum of (last_seen_at - started_at).
create table if not exists public.user_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  started_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at     timestamptz,
  user_agent   text
);
create index if not exists user_sessions_user_idx     on public.user_sessions(user_id, started_at desc);
create index if not exists user_sessions_last_seen_ix on public.user_sessions(last_seen_at desc);

-- ───────────────────────── user_events ─────────────────────────
-- Activity log: what the user did, when. Used by the admin "recent activity"
-- feed and aggregate counts. Generic payload jsonb keeps the schema future-proof.
create table if not exists public.user_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  payload    jsonb,
  created_at timestamptz not null default now()
);
create index if not exists user_events_user_idx    on public.user_events(user_id, created_at desc);
create index if not exists user_events_type_idx    on public.user_events(event_type, created_at desc);
create index if not exists user_events_recent_idx  on public.user_events(created_at desc);

-- ───────────────────────── feature_flags ─────────────────────────
-- key/enabled pairs. Public read (so the client can hide off-modules) +
-- admin-only write.
create table if not exists public.feature_flags (
  key         text primary key,
  enabled     boolean not null default true,
  description text,
  category    text not null default 'general' check (category in ('module', 'feature', 'auth', 'general')),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);

-- Seed defaults (only inserts what isn't there — never resets a flag you flipped).
insert into public.feature_flags (key, enabled, description, category) values
  ('module.characters',  true, 'Ieroglif moduli',                'module'),
  ('module.vocabulary',  true, 'Lug''at moduli',                 'module'),
  ('module.listening',   true, 'Tinglash moduli',                'module'),
  ('module.reading',     true, 'O''qish moduli',                 'module'),
  ('module.writing',     true, 'Yozish moduli',                  'module'),
  ('module.speaking',    true, 'Gapirish moduli',                'module'),
  ('module.exam',        true, 'Imtihon moduli',                 'module'),
  ('feature.tts',                true, 'Avto-talaffuz (TTS)',           'feature'),
  ('feature.stroke_animation',   true, 'Ieroglif chiziq animatsiyasi',  'feature'),
  ('feature.srs',                true, 'Spaced repetition (SRS)',       'feature'),
  ('feature.leaderboard',        true, 'Reyting / leaderboard',         'feature'),
  ('auth.registration',     true, 'Yangi ro''yxatdan o''tish',          'auth'),
  ('auth.google_oauth',     true, 'Google bilan kirish',                'auth')
on conflict (key) do nothing;

-- ───────────────────────── Row Level Security ─────────────────────────
alter table public.user_sessions enable row level security;
alter table public.user_events   enable row level security;
alter table public.feature_flags enable row level security;

-- Sessions: a user manages their own; admins read all.
drop policy if exists "user_sessions_select"  on public.user_sessions;
create policy "user_sessions_select" on public.user_sessions
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "user_sessions_insert"  on public.user_sessions;
create policy "user_sessions_insert" on public.user_sessions
  for insert with check (auth.uid() = user_id);
drop policy if exists "user_sessions_update"  on public.user_sessions;
create policy "user_sessions_update" on public.user_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Events: a user writes their own; admins read all.
drop policy if exists "user_events_select" on public.user_events;
create policy "user_events_select" on public.user_events
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "user_events_insert" on public.user_events;
create policy "user_events_insert" on public.user_events
  for insert with check (auth.uid() = user_id);

-- Flags: world-readable, admin-write.
drop policy if exists "feature_flags_read"  on public.feature_flags;
create policy "feature_flags_read"  on public.feature_flags for select using (true);
drop policy if exists "feature_flags_write" on public.feature_flags;
create policy "feature_flags_write" on public.feature_flags
  for all using (public.is_admin()) with check (public.is_admin());

-- ───────────────────────── admin_user_overview view ─────────────────────────
-- One row per user with the aggregates the admin Users tab needs. View runs
-- under the caller's RLS, so only admins (who can read all sessions/events)
-- see other users' rows.
create or replace view public.admin_user_overview as
  select
    u.id                                                                            as user_id,
    u.email,
    u.created_at                                                                    as registered_at,
    u.last_sign_in_at,
    p.role,
    p.blocked,
    p.blocked_at,
    p.blocked_reason,
    coalesce(up.xp, 0)                                                              as xp,
    coalesce(up.streak, 0)                                                          as streak,
    coalesce(array_length(up.vocab_learned, 1), 0)                                  as vocab_learned,
    coalesce(array_length(up.characters_learned, 1), 0)                             as characters_learned,
    coalesce(array_length(up.completed_lessons, 1), 0)                              as lessons_completed,
    (select count(*) from public.exam_results e where e.user_id = u.id)             as exams_taken,
    (select max(last_seen_at) from public.user_sessions s where s.user_id = u.id)   as last_seen_at,
    -- minutes on platform = sum across sessions of (last_seen - started), capped at 8h/session
    coalesce((
      select sum(least(extract(epoch from (s.last_seen_at - s.started_at)) / 60.0, 480))
      from public.user_sessions s
      where s.user_id = u.id
    ), 0)::int                                                                      as minutes_total
  from auth.users u
  left join public.profiles      p  on p.id      = u.id
  left join public.user_progress up on up.user_id = u.id;
