-- =============================================================================
-- Migration 0007: landing-page waitlist
-- Anonymous visitors can add their email; only admins can read the list.
-- =============================================================================

create table public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  city        text,
  created_at  timestamptz not null default now(),
  unique (email)
);

alter table public.waitlist enable row level security;

create policy "waitlist: anyone can join" on public.waitlist
  for insert to anon, authenticated
  with check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

create policy "waitlist: admins read" on public.waitlist
  for select using (public.is_admin());

create policy "waitlist: admins delete" on public.waitlist
  for delete using (public.is_admin());
