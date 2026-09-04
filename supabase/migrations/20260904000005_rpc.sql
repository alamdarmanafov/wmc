-- =============================================================================
-- Migration 0005: RPC functions called by the apps
--   discover_people()       – matching feed (privacy-safe distance)
--   home_summary()          – "12 people · 8 communities · 4 events"
--   update_my_location()    – writes private location; never readable back
--   respond_connection()    – accept / decline
--   mark_conversation_read()
--   my_conversations()      – inbox with last message + unread count
--   admin_dashboard_stats() – admin analytics
--   admin_set_user_status() – ban / suspend / reactivate (audited)
-- =============================================================================

-- ---- Location (write-only from client) ------------------------------------------------
create or replace function public.update_my_location(p_lat double precision, p_lng double precision)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  insert into public.profile_private (user_id, location, location_updated_at, updated_at)
  values (
    auth.uid(),
    case when p_lat is null or p_lng is null then null
         else extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography end,
    now(), now()
  )
  on conflict (user_id) do update
    set location = excluded.location, location_updated_at = now(), updated_at = now();
end $$;

-- ---- Push token (write-only) ---------------------------------------------------------------
create or replace function public.set_push_token(p_token text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  insert into public.profile_private (user_id, push_token, updated_at) values (auth.uid(), p_token, now())
  on conflict (user_id) do update set push_token = excluded.push_token, updated_at = now();
end $$;

-- ---- Distance bucket: never exact ---------------------------------------------------------
create or replace function public.distance_label(km double precision)
returns text language sql immutable as $$
  select case
    when km is null then 'In your city'
    when km <= 1  then 'Near you'
    when km <= 3  then '~2 km away'
    when km <= 6  then '~5 km away'
    when km <= 15 then '~10 km away'
    else 'In your city'
  end;
$$;

-- ---- Matching feed ---------------------------------------------------------------------------
-- Scoring (see docs/05-matching.md):
--   same city +30 · shared interest +10 each (max 40) · shared language +15
--   shared goal +20 · age within 5 years +10        → max 115
create or replace function public.discover_people(
  p_limit        int default 20,
  p_offset       int default 0,
  p_interest     text default null,   -- filter: interest slug
  p_language     text default null,   -- filter: language code
  p_looking_for  text default null,   -- filter: goal slug
  p_min_age      int default null,
  p_max_age      int default null,
  p_gender       public.gender default null,
  p_max_km       double precision default null
)
returns table (
  id                   uuid,
  first_name           text,
  photo_url            text,
  age                  smallint,
  city_name            text,
  profession           text,
  bio                  text,
  languages            text[],
  interests            text[],
  shared_interests     text[],
  shared_languages     text[],
  shared_goals         text[],
  score                int,
  compatibility        int,
  distance_label       text,
  connection_status    public.connection_status,
  connection_direction text
)
language plpgsql stable security definer set search_path = public, extensions as $$
declare
  me public.profiles%rowtype;
  my_location extensions.geography;
  my_interests text[];
begin
  select * into me from public.profiles where profiles.id = auth.uid();
  if me.id is null or me.status <> 'active' then
    return;
  end if;
  select pp.location into my_location from public.profile_private pp where pp.user_id = me.id;
  select coalesce(array_agg(i.name order by i.sort_order), '{}') into my_interests
    from public.user_interests ui join public.interests i on i.id = ui.interest_id
    where ui.user_id = me.id;

  return query
  with candidates as (
    select p.*,
      c.name as c_city_name,
      coalesce((select array_agg(i.name order by i.sort_order)
                from public.user_interests ui join public.interests i on i.id = ui.interest_id
                where ui.user_id = p.id), '{}') as p_interests,
      case when my_location is not null and pp.location is not null
             and me.location_visibility <> 'hidden' and p.location_visibility = 'approximate'
           then extensions.ST_Distance(my_location, pp.location) / 1000.0
           else null end as km
    from public.profiles p
    left join public.cities c on c.id = p.city_id
    left join public.profile_private pp on pp.user_id = p.id
    where p.id <> me.id
      and p.status = 'active'
      and p.onboarding_completed
      and not public.is_blocked_between(p.id, me.id)
      and (p_language is null or p_language = any(p.languages))
      and (p_looking_for is null or p_looking_for = any(p.looking_for))
      and (p_min_age is null or p.age >= p_min_age)
      and (p_max_age is null or p.age <= p_max_age)
      and (p_gender is null or p.gender = p_gender)
      and (p_interest is null or exists (
            select 1 from public.user_interests ui join public.interests i on i.id = ui.interest_id
            where ui.user_id = p.id and i.slug = p_interest))
      -- same city by default; when the user has no city, fall back to everyone
      and (me.city_id is null or p.city_id = me.city_id)
  ),
  scored as (
    select
      cd.*,
      (select coalesce(array_agg(x), '{}') from unnest(cd.p_interests) x where x = any(my_interests)) as s_interests,
      (select coalesce(array_agg(x), '{}') from unnest(cd.languages) x where x = any(me.languages)) as s_langs,
      (select coalesce(array_agg(x), '{}') from unnest(cd.looking_for) x where x = any(me.looking_for)) as s_goals
    from candidates cd
  ),
  final as (
    select
      s.*,
      (case when s.city_id = me.city_id then 30 else 0 end)
      + least(cardinality(s.s_interests) * 10, 40)
      + (case when cardinality(s.s_langs) > 0 then 15 else 0 end)
      + (case when cardinality(s.s_goals) > 0 then 20 else 0 end)
      + (case when me.age is not null and s.age is not null and abs(me.age - s.age) <= 5 then 10 else 0 end)
      as total
    from scored s
  )
  select
    f.id, f.first_name, f.photo_url, f.age, f.c_city_name, f.profession, f.bio,
    f.languages, f.p_interests, f.s_interests, f.s_langs, f.s_goals,
    f.total::int,
    least(100, round(f.total * 100.0 / 115))::int,
    public.distance_label(f.km),
    cn.status,
    case when cn.requester_id = me.id then 'sent' when cn.addressee_id = me.id then 'received' else null end
  from final f
  left join public.connections cn
    on least(cn.requester_id, cn.addressee_id) = least(me.id, f.id)
   and greatest(cn.requester_id, cn.addressee_id) = greatest(me.id, f.id)
  where (p_max_km is null or f.km is null or f.km <= p_max_km)
  order by f.total desc, f.last_active_at desc
  limit p_limit offset p_offset;
end $$;

-- ---- Home summary ---------------------------------------------------------------------------------------
create or replace function public.home_summary()
returns table (people_count bigint, community_count bigint, event_count bigint, activity_count bigint)
language sql stable security definer set search_path = public as $$
  with me as (select city_id from public.profiles where id = auth.uid())
  select
    (select count(*) from public.profiles p, me where p.status='active' and p.onboarding_completed and p.city_id = me.city_id and p.id <> auth.uid()),
    (select count(*) from public.communities c, me where c.status='approved' and c.city_id = me.city_id),
    (select count(*) from public.events e, me where e.status='approved' and e.city_id = me.city_id and e.starts_at > now()),
    (select count(*) from public.activities a, me where a.status='open' and a.city_id = me.city_id and a.expires_at > now());
$$;

-- ---- Onboarding result: "We found 12 people & 8 communities for you." ------------------------------------
create or replace function public.onboarding_summary()
returns table (people_count bigint, community_count bigint, event_count bigint)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.discover_people(500, 0)),
    (select count(*) from public.communities c join public.profiles me on me.id = auth.uid()
       where c.status = 'approved' and c.city_id = me.city_id),
    (select count(*) from public.events e join public.profiles me on me.id = auth.uid()
       where e.status = 'approved' and e.city_id = me.city_id and e.starts_at > now());
$$;

-- ---- Connections ---------------------------------------------------------------------------------------------
create or replace function public.respond_connection(p_connection_id uuid, p_accept boolean)
returns public.connections language plpgsql security definer set search_path = public as $$
declare
  v_row public.connections;
begin
  update public.connections
    set status = (case when p_accept then 'accepted' else 'declined' end)::public.connection_status,
        responded_at = now()
    where id = p_connection_id and addressee_id = auth.uid() and status = 'pending'
    returning * into v_row;
  if v_row.id is null then
    raise exception 'Connection request not found' using errcode = 'P0002';
  end if;
  return v_row;
end $$;

-- direct conversation id with a connected user (null if not connected)
create or replace function public.direct_conversation_with(p_user_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select c.id
    from public.conversations c
    join public.conversation_participants a on a.conversation_id = c.id and a.user_id = auth.uid()
    join public.conversation_participants b on b.conversation_id = c.id and b.user_id = p_user_id
    where c.type = 'direct'
    limit 1;
$$;

-- ---- Chat inbox ------------------------------------------------------------------------------------------------
create or replace function public.my_conversations()
returns table (
  id               uuid,
  type             public.conversation_type,
  title            text,
  image_url        text,
  event_id         uuid,
  activity_id      uuid,
  other_user_id    uuid,
  last_message     text,
  last_message_at  timestamptz,
  unread_count     bigint
)
language sql stable security definer set search_path = public as $$
  select
    c.id, c.type,
    case c.type
      when 'direct'   then (select p.first_name from public.conversation_participants cp join public.profiles p on p.id = cp.user_id
                            where cp.conversation_id = c.id and cp.user_id <> auth.uid() limit 1)
      when 'event'    then (select e.title from public.events e where e.id = c.event_id)
      when 'activity' then (select a.text from public.activities a where a.id = c.activity_id)
    end as title,
    case c.type
      when 'direct'   then (select p.photo_url from public.conversation_participants cp join public.profiles p on p.id = cp.user_id
                            where cp.conversation_id = c.id and cp.user_id <> auth.uid() limit 1)
      when 'event'    then (select e.image_url from public.events e where e.id = c.event_id)
      else null
    end as image_url,
    c.event_id, c.activity_id,
    case when c.type = 'direct' then (select cp.user_id from public.conversation_participants cp
                                      where cp.conversation_id = c.id and cp.user_id <> auth.uid() limit 1) end,
    (select m.content from public.messages m where m.conversation_id = c.id and m.deleted_at is null
       order by m.created_at desc limit 1),
    c.last_message_at,
    (select count(*) from public.messages m
       where m.conversation_id = c.id and m.sender_id <> auth.uid()
         and m.created_at > coalesce(me.last_read_at, 'epoch'::timestamptz))
  from public.conversations c
  join public.conversation_participants me on me.conversation_id = c.id and me.user_id = auth.uid()
  order by c.last_message_at desc nulls last, c.created_at desc;
$$;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.conversation_participants set last_read_at = now()
    where conversation_id = p_conversation_id and user_id = auth.uid();
$$;

-- ---- Reports helper: report + optionally block in one call ------------------------------------------------------
create or replace function public.report_target(
  p_target_type public.report_target_type,
  p_target_id uuid,
  p_reason text,
  p_details text default null,
  p_block_user boolean default false
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  insert into public.reports (reporter_id, target_type, target_id, reason, details)
    values (auth.uid(), p_target_type, p_target_id, p_reason, p_details)
    returning id into v_id;
  if p_block_user and p_target_type = 'user' then
    insert into public.blocks (blocker_id, blocked_id) values (auth.uid(), p_target_id) on conflict do nothing;
  end if;
  return v_id;
end $$;

-- ---- Admin -------------------------------------------------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns table (
  total_users bigint, active_users_7d bigint, active_users_30d bigint,
  new_users_7d bigint, new_users_30d bigint,
  communities bigint, pending_communities bigint,
  events bigint, upcoming_events bigint, pending_events bigint,
  connections bigint, messages bigint, pending_reports bigint,
  retention_d7 numeric, retention_d30 numeric
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_moderator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
  select
    (select count(*) from public.profiles),
    (select count(*) from public.profiles where last_active_at > now() - interval '7 days'),
    (select count(*) from public.profiles where last_active_at > now() - interval '30 days'),
    (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    (select count(*) from public.profiles where created_at > now() - interval '30 days'),
    (select count(*) from public.communities where status = 'approved'),
    (select count(*) from public.communities where status = 'pending'),
    (select count(*) from public.events where status = 'approved'),
    (select count(*) from public.events where status = 'approved' and starts_at > now()),
    (select count(*) from public.events where status = 'pending'),
    (select count(*) from public.connections where status = 'accepted'),
    (select count(*) from public.messages),
    (select count(*) from public.reports where status = 'pending'),
    -- D7 retention: of users who signed up 7–14 days ago, % active on/after day 7
    coalesce((select round(100.0 * count(*) filter (where exists (
                 select 1 from public.user_daily_activity d where d.user_id = p.id and d.day >= (p.created_at + interval '7 days')::date))
               / nullif(count(*), 0), 1)
      from public.profiles p where p.created_at between now() - interval '14 days' and now() - interval '7 days'), 0),
    coalesce((select round(100.0 * count(*) filter (where exists (
                 select 1 from public.user_daily_activity d where d.user_id = p.id and d.day >= (p.created_at + interval '30 days')::date))
               / nullif(count(*), 0), 1)
      from public.profiles p where p.created_at between now() - interval '60 days' and now() - interval '30 days'), 0);
end $$;

create or replace function public.admin_signups_by_day(p_days int default 30)
returns table (day date, signups bigint, active bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_moderator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
  select d::date,
    (select count(*) from public.profiles p where p.created_at::date = d::date),
    (select count(*) from public.user_daily_activity a where a.day = d::date)
  from generate_series(current_date - (p_days - 1), current_date, interval '1 day') d
  order by 1;
end $$;

create or replace function public.admin_set_user_status(p_user_id uuid, p_status public.user_status, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.profiles set status = p_status, status_reason = p_reason where id = p_user_id;
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, meta)
    values (auth.uid(), 'set_user_status', 'user', p_user_id::text, jsonb_build_object('status', p_status, 'reason', p_reason));
end $$;

create or replace function public.admin_set_user_verified(p_user_id uuid, p_verified boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.profiles set is_verified = p_verified where id = p_user_id;
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, meta)
    values (auth.uid(), 'set_user_verified', 'user', p_user_id::text, jsonb_build_object('verified', p_verified));
end $$;

create or replace function public.admin_log(p_action text, p_target_type text, p_target_id text, p_meta jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, meta)
    select auth.uid(), p_action, p_target_type, p_target_id, p_meta where public.is_moderator();
$$;

-- ---- Grants -------------------------------------------------------------------------------------------------------
revoke all on function public.admin_dashboard_stats() from public;
grant execute on function public.admin_dashboard_stats() to authenticated;
grant execute on function public.admin_signups_by_day(int) to authenticated;
grant execute on function public.admin_set_user_status(uuid, public.user_status, text) to authenticated;
grant execute on function public.admin_set_user_verified(uuid, boolean) to authenticated;
grant execute on function public.admin_log(text, text, text, jsonb) to authenticated;
grant execute on function public.discover_people(int, int, text, text, text, int, int, public.gender, double precision) to authenticated;
grant execute on function public.home_summary() to authenticated;
grant execute on function public.onboarding_summary() to authenticated;
grant execute on function public.update_my_location(double precision, double precision) to authenticated;
grant execute on function public.set_push_token(text) to authenticated;
grant execute on function public.respond_connection(uuid, boolean) to authenticated;
grant execute on function public.direct_conversation_with(uuid) to authenticated;
grant execute on function public.my_conversations() to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.report_target(public.report_target_type, uuid, text, text, boolean) to authenticated;
grant execute on function public.touch_activity() to authenticated;
