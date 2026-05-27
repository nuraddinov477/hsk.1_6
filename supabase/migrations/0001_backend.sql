-- =====================================================================
-- HSKGo backend schema + Row Level Security
-- Apply once: Supabase dashboard -> SQL Editor -> paste this -> Run.
-- Safe to re-run (idempotent: create-if-not-exists / drop-then-create).
-- =====================================================================

-- ───────────────────────── profiles ─────────────────────────
-- One row per auth user. `role` gates admin-only content writes.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- SECURITY DEFINER so RLS policies can call it without recursing into
-- the profiles table's own policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ──────────────────────── user data ────────────────────────
create table if not exists public.user_progress (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  xp                 integer not null default 0,
  streak             integer not null default 0,
  last_active_date   date,
  characters_learned text[]  not null default '{}',
  vocab_learned      text[]  not null default '{}',
  completed_lessons  text[]  not null default '{}',
  updated_at         timestamptz not null default now()
);

create table if not exists public.srs_cards (
  user_id       uuid not null references auth.users(id) on delete cascade,
  card_id       text not null,
  interval_days double precision not null default 0,
  ease          double precision not null default 2.5,
  reps          integer not null default 0,
  due_at        timestamptz not null default now(),
  primary key (user_id, card_id)
);

create table if not exists public.exam_results (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  level      integer,
  score      integer not null,
  created_at timestamptz not null default now()
);
create index if not exists exam_results_user_idx on public.exam_results(user_id, created_at desc);

-- ──────────────────────── content ────────────────────────
-- Multilingual fields are JSONB { "uz": "...", "ru": "...", "en": "..." }
-- to mirror the app's Translations type. Text ids stay stable for the
-- client (existing "v1"/"p1" ids; new rows default to a uuid string).
create table if not exists public.characters (
  id         text primary key default gen_random_uuid()::text,
  hanzi      text not null,
  pinyin     text not null,
  meaning    jsonb not null,
  hsk_level  integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.vocabulary (
  id             text primary key default gen_random_uuid()::text,
  word           text not null,
  pinyin         text not null,
  meaning        jsonb not null,
  hsk_level      integer not null,
  example_zh     text,
  example_pinyin text,
  example        jsonb,
  created_at     timestamptz not null default now()
);

create table if not exists public.passages (
  id          text primary key default gen_random_uuid()::text,
  hsk_level   integer not null,
  title       jsonb not null,
  text        text not null,
  pinyin      text not null,
  translation jsonb not null,
  question    jsonb not null,
  options     jsonb not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.exam_questions (
  id             text primary key default gen_random_uuid()::text,
  level          integer not null,
  section        text not null check (section in ('listening', 'reading')),
  audio          text,
  passage        text,
  passage_pinyin text,
  term           text,
  term_pinyin    text,
  prompt         jsonb not null,
  choices        jsonb not null,
  created_at     timestamptz not null default now()
);

-- ──────────────────────── Row Level Security ────────────────────────
alter table public.profiles       enable row level security;
alter table public.user_progress  enable row level security;
alter table public.srs_cards      enable row level security;
alter table public.exam_results   enable row level security;
alter table public.characters     enable row level security;
alter table public.vocabulary     enable row level security;
alter table public.passages       enable row level security;
alter table public.exam_questions enable row level security;

-- profiles: a user sees/edits only their own row; admins can read all.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- user_progress / srs_cards / exam_results: each user owns their rows.
drop policy if exists "progress_own" on public.user_progress;
create policy "progress_own" on public.user_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "srs_own" on public.srs_cards;
create policy "srs_own" on public.srs_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "exam_select_own" on public.exam_results;
create policy "exam_select_own" on public.exam_results
  for select using (auth.uid() = user_id);
drop policy if exists "exam_insert_own" on public.exam_results;
create policy "exam_insert_own" on public.exam_results
  for insert with check (auth.uid() = user_id);

-- content: anyone may read; only admins may write. Repeated per table.
do $$
declare t text;
begin
  foreach t in array array['characters', 'vocabulary', 'passages', 'exam_questions'] loop
    execute format('drop policy if exists "%1$s_read" on public.%1$s', t);
    execute format('create policy "%1$s_read" on public.%1$s for select using (true)', t);
    execute format('drop policy if exists "%1$s_admin_write" on public.%1$s', t);
    execute format('create policy "%1$s_admin_write" on public.%1$s for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- ──────────────────────── auto-provisioning ────────────────────────
-- Create a profile + empty progress row whenever a new auth user appears.
-- SECURITY DEFINER + on-conflict guards so it can never break sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.user_progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill rows for users that already exist (e.g. test accounts).
insert into public.profiles (id, name)
  select id, coalesce(raw_user_meta_data->>'name', split_part(email, '@', 1))
  from auth.users
  on conflict (id) do nothing;

insert into public.user_progress (user_id)
  select id from auth.users
  on conflict (user_id) do nothing;

-- ──────────────────────── make yourself admin ────────────────────────
-- After you register on the site, run this with YOUR login email:
--   update public.profiles set role = 'admin'
--   where id in (select id from auth.users where email = 'YOUR_EMAIL_HERE');
