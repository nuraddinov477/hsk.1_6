-- =====================================================================
-- HSKGo lessons / textbook curriculum
--
-- A `lesson` is the smallest chunk of curriculum: an ordered unit inside
-- an HSK level (Lesson 1, 2, 3 of HSK 1, etc). Each lesson carries a
-- multi-language title + body (Uzbek / Russian / English), and optionally
-- pins specific vocabulary words + characters that the learner should
-- master in that lesson. The body is markdown so the admin can write rich
-- explanations without needing a custom editor.
--
-- We DON'T add a new `lesson_completions` table — completions piggy-back
-- on user_progress.completed_lessons (existing text[]) so dashboard stats,
-- streaks and achievements all see lesson progress consistently.
--
-- Idempotent: safe to re-run.
-- =====================================================================

create table if not exists public.lessons (
  id            uuid primary key default gen_random_uuid(),
  hsk_level     int  not null check (hsk_level between 1 and 6),
  lesson_no     int  not null check (lesson_no > 0),
  title         jsonb not null,            -- { uz, ru, en }
  body          jsonb not null,            -- { uz, ru, en } — markdown text
  vocab_words   text[] not null default '{}',  -- list of vocabulary.word the lesson teaches
  char_hanzis   text[] not null default '{}',  -- list of characters.hanzi the lesson teaches
  audio_url     text,                      -- optional spoken-along audio
  est_minutes   int    not null default 15 check (est_minutes between 1 and 240),
  published     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (hsk_level, lesson_no)
);

create index if not exists lessons_level_no_idx on public.lessons(hsk_level, lesson_no) where published;

alter table public.lessons enable row level security;

-- Anyone (even anonymous) can read published lessons — they're the curriculum.
-- Only admins can write.
drop policy if exists "lessons_read"        on public.lessons;
drop policy if exists "lessons_admin_write" on public.lessons;
create policy "lessons_read"        on public.lessons for select using (published or public.is_admin());
create policy "lessons_admin_write" on public.lessons for all
  using (public.is_admin()) with check (public.is_admin());
