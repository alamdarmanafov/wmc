-- =============================================================================
-- Migration 0008: scheduled maintenance
--   enqueue_event_reminders() – "Your event starts in 2 hours" notifications
--   close_expired_activities() – "Join me" posts expire after 24h
-- Schedule with pg_cron (Supabase Dashboard → Database → Extensions → pg_cron):
--   select cron.schedule('wmc-event-reminders', '*/15 * * * *', $$select public.enqueue_event_reminders()$$);
--   select cron.schedule('wmc-close-activities', '*/30 * * * *', $$select public.close_expired_activities()$$);
-- =============================================================================

create table public.event_reminders_sent (
  event_id  uuid not null references public.events(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  sent_at   timestamptz not null default now(),
  primary key (event_id, user_id)
);
alter table public.event_reminders_sent enable row level security;

create or replace function public.enqueue_event_reminders()
returns int language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  with due as (
    select ep.event_id, ep.user_id, e.title
      from public.event_participants ep
      join public.events e on e.id = ep.event_id
      join public.profiles p on p.id = ep.user_id
      where e.status = 'approved'
        and e.starts_at between now() + interval '105 minutes' and now() + interval '135 minutes'
        and coalesce((p.notification_prefs ->> 'events')::boolean, true)
        and not exists (select 1 from public.event_reminders_sent s where s.event_id = ep.event_id and s.user_id = ep.user_id)
  ),
  ins as (
    insert into public.notifications (user_id, type, title, body, data)
      select user_id, 'event_reminder', 'Your event starts in 2 hours', title, jsonb_build_object('event_id', event_id)
      from due returning 1
  ),
  mark as (
    insert into public.event_reminders_sent (event_id, user_id) select event_id, user_id from due returning 1
  )
  select count(*) into v_count from ins;
  return v_count;
end $$;

create or replace function public.close_expired_activities()
returns int language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  with upd as (
    update public.activities set status = 'closed'
      where status = 'open' and expires_at < now() returning 1
  )
  select count(*) into v_count from upd;
  return v_count;
end $$;

revoke all on function public.enqueue_event_reminders() from public, anon, authenticated;
revoke all on function public.close_expired_activities() from public, anon, authenticated;
