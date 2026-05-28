-- =====================================================================
-- HSKGo backend — daily missions + leaderboard + AI writing cache
-- Apply once via SQL Editor. Safe to re-run (idempotent).
-- =====================================================================

-- ───────────────────────── daily missions ─────────────────────────
-- mission_templates: catalog of mission kinds (admin-tunable).
--   kind: free-form string, matched in code (e.g. 'learn_vocab', 'learn_chars',
--         'complete_lesson', 'take_exam').
--   target: how many of the thing must be done that day.
--   xp_reward: XP granted on completion.
create table if not exists public.mission_templates (
  id          text primary key default gen_random_uuid()::text,
  kind        text not null,
  target      integer not null check (target > 0),
  xp_reward   integer not null default 10,
  title       jsonb not null,   -- { uz, ru, en }
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- user_missions: per-user, per-day mission state.
--   day: the date this mission is "for" (UTC date).
--   progress: how many counted so far.
--   completed_at: when target hit (null = in progress).
--   claimed_at: when XP was claimed (null = not yet claimed).
create table if not exists public.user_missions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  template_id   text not null references public.mission_templates(id) on delete cascade,
  day           date not null,
  progress      integer not null default 0,
  completed_at  timestamptz,
  claimed_at    timestamptz,
  created_at    timestamptz not null default now(),
  unique (user_id, template_id, day)
);
create index if not exists user_missions_user_day_idx on public.user_missions(user_id, day desc);

-- Seed a small default catalog. The admin can edit/disable later from
-- the admin panel.
insert into public.mission_templates (id, kind, target, xp_reward, title) values
  ('mission_vocab_5',   'learn_vocab',     5,  20, jsonb_build_object('uz', '5 ta yangi so''z o''rganing',           'ru', 'Изучите 5 новых слов',           'en', 'Learn 5 new words')),
  ('mission_chars_3',   'learn_chars',     3,  15, jsonb_build_object('uz', '3 ta ieroglif o''rganing',              'ru', 'Изучите 3 иероглифа',            'en', 'Learn 3 characters')),
  ('mission_lesson_1',  'complete_lesson', 1,  25, jsonb_build_object('uz', '1 dars yakunlang',                       'ru', 'Завершите 1 урок',                'en', 'Complete 1 lesson')),
  ('mission_xp_50',     'gain_xp',         50, 10, jsonb_build_object('uz', 'Bugun 50 XP to''plang',                  'ru', 'Заработайте 50 XP сегодня',       'en', 'Earn 50 XP today'))
on conflict (id) do nothing;

-- ───────────────────────── AI writing reviews ─────────────────────────
-- Optional cache of past AI feedback so users can revisit their drafts.
create table if not exists public.writing_reviews (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  prompt        text,
  draft         text not null,
  score         integer,
  feedback      jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists writing_reviews_user_idx on public.writing_reviews(user_id, created_at desc);

-- ───────────────────────── RLS ─────────────────────────
alter table public.mission_templates enable row level security;
alter table public.user_missions     enable row level security;
alter table public.writing_reviews   enable row level security;

drop policy if exists "mission_templates_read"  on public.mission_templates;
create policy "mission_templates_read"  on public.mission_templates for select using (true);
drop policy if exists "mission_templates_write" on public.mission_templates;
create policy "mission_templates_write" on public.mission_templates
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "user_missions_own" on public.user_missions;
create policy "user_missions_own" on public.user_missions
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

drop policy if exists "writing_reviews_own" on public.writing_reviews;
create policy "writing_reviews_own" on public.writing_reviews
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- ───────────────────────── leaderboard view ─────────────────────────
-- Anonymised public leaderboard: show display name + XP only.
-- Joins profiles.name (or first part of email) + user_progress.xp.
create or replace view public.leaderboard_alltime as
  select
    p.id                                                                            as user_id,
    coalesce(p.name, split_part(u.email, '@', 1))                                   as display_name,
    coalesce(up.xp, 0)                                                              as xp,
    coalesce(up.streak, 0)                                                          as streak,
    coalesce(array_length(up.vocab_learned, 1), 0)                                  as vocab_learned
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.user_progress up on up.user_id = p.id
  where coalesce(p.blocked, false) = false
  order by xp desc;

-- Weekly leaderboard: sum of XP from xp_gained events in the last 7 days.
create or replace view public.leaderboard_week as
  select
    p.id                                                                            as user_id,
    coalesce(p.name, split_part(u.email, '@', 1))                                   as display_name,
    coalesce(sum((e.payload->>'amount')::int), 0)                                   as xp,
    coalesce(up.streak, 0)                                                          as streak
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.user_progress up on up.user_id = p.id
  left join public.user_events e
    on e.user_id = p.id
   and e.event_type = 'xp_gained'
   and e.created_at >= now() - interval '7 days'
  where coalesce(p.blocked, false) = false
  group by p.id, u.email, p.name, up.streak
  order by xp desc;
