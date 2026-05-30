-- =====================================================================
-- HSKGo backend — per-user feature overrides
-- Apply once: Supabase dashboard -> SQL Editor -> paste this -> Run.
-- Safe to re-run (idempotent).
-- =====================================================================

-- One row per (user, flag) the admin has overridden. Absence = inherit the
-- global feature_flags value. Presence with enabled=false disables that
-- module/feature for that user only.
create table if not exists public.user_module_overrides (
  user_id    uuid not null references auth.users(id) on delete cascade,
  flag_key   text not null references public.feature_flags(key) on delete cascade,
  enabled    boolean not null,
  reason     text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  primary key (user_id, flag_key)
);

create index if not exists user_module_overrides_user_idx on public.user_module_overrides(user_id);

alter table public.user_module_overrides enable row level security;

-- The user can read their own overrides (so the client can hide modules);
-- admins can read everyone's.
drop policy if exists "umo_select" on public.user_module_overrides;
create policy "umo_select" on public.user_module_overrides
  for select using (auth.uid() = user_id or public.is_admin());

-- Only admins can write. Setting `updated_by` is enforced by the API.
drop policy if exists "umo_write"  on public.user_module_overrides;
create policy "umo_write"  on public.user_module_overrides
  for all using (public.is_admin()) with check (public.is_admin());
