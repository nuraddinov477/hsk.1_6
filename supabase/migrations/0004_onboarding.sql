-- =====================================================================
-- HSKGo onboarding wizard
-- Adds personalised study plan fields to profiles:
--   current_level     — HSK level the user already knows (0 = none, 1..6)
--   target_level      — HSK level the user wants to reach (1..6)
--   goal              — free-form reason key (work, study, exam, travel, culture, other)
--   target_days       — how many days they give themselves to hit target_level
--   plan_started_at   — when the plan began (filled on first save)
--   onboarded_at      — set when the wizard is completed; null = wizard not done
-- Idempotent: safe to re-run.
-- =====================================================================

alter table public.profiles
  add column if not exists current_level   int  check (current_level   between 0 and 6),
  add column if not exists target_level    int  check (target_level    between 1 and 6),
  add column if not exists goal            text,
  add column if not exists target_days     int  check (target_days     between 7 and 730),
  add column if not exists plan_started_at timestamptz,
  add column if not exists onboarded_at    timestamptz;

-- Goal is a short enum-ish string; we keep it as text + a check rather than a
-- pg enum so the admin panel can add new goal options without DDL.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_goal_check'
  ) then
    alter table public.profiles
      add constraint profiles_goal_check
      check (goal is null or goal in ('work','study','exam','travel','culture','other'));
  end if;
end$$;
