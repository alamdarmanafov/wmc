-- =============================================================================
-- WMC — combined schema for the Supabase SQL Editor (generated from migrations/)
-- Paste the whole file into Dashboard → SQL Editor → Run, on a fresh project.
-- Regenerate: npm run db:bundle
-- =============================================================================

-- >>> migrations/20260904000001_extensions_and_enums.sql
-- =============================================================================
-- WMC — World Muslim Community
-- Migration 0001: extensions + enums
-- =============================================================================

create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "postgis" with schema extensions;
create extension if not exists "pg_trgm" with schema extensions;

-- ---- Enums ------------------------------------------------------------------
create type public.user_status as enum ('active', 'suspended', 'banned');
create type public.user_role as enum ('user', 'moderator', 'admin');
create type public.gender as enum ('male', 'female', 'prefer_not_to_say');
create type public.location_visibility as enum ('city_only', 'approximate', 'hidden');

create type public.community_status as enum ('pending', 'approved', 'rejected');
create type public.membership_role as enum ('member', 'moderator', 'owner');

create type public.event_status as enum ('pending', 'approved', 'cancelled', 'rejected');
create type public.activity_status as enum ('open', 'closed', 'cancelled');

create type public.connection_status as enum ('pending', 'accepted', 'declined');
create type public.conversation_type as enum ('direct', 'event', 'activity');

create type public.report_target_type as enum ('user', 'event', 'message', 'community', 'activity');
create type public.report_status as enum ('pending', 'reviewed', 'actioned', 'dismissed');

create type public.notification_type as enum (
  'connection_request',
  'connection_accepted',
  'event_joined',
  'event_reminder',
  'activity_joined',
  'new_community',
  'nearby_people',
  'message',
  'system'
);

-- >>> migrations/20260904000002_tables.sql
-- =============================================================================
-- Migration 0002: core tables
-- Naming: snake_case, plural table names, `id` uuid PK, timestamptz.
-- =============================================================================

-- ---- Geography ---------------------------------------------------------------
create table public.countries (
  id    serial primary key,
  code  char(2) not null unique,      -- ISO 3166-1 alpha-2
  name  text not null
);

create table public.cities (
  id          serial primary key,
  country_id  int not null references public.countries(id) on delete cascade,
  name        text not null,
  slug        text not null unique,
  lat         double precision not null,
  lng         double precision not null,
  timezone    text not null default 'UTC',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index cities_country_idx on public.cities(country_id);
create index cities_name_trgm_idx on public.cities using gin (name extensions.gin_trgm_ops);

-- ---- Users / profiles ----------------------------------------------------------
-- auth.users is managed by Supabase Auth. `profiles` is the public projection.
create table public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  first_name            text not null default '',
  photo_url             text,
  age                   smallint check (age is null or (age between 16 and 99)),
  gender                public.gender,
  city_id               int references public.cities(id) on delete set null,
  bio                   text check (bio is null or char_length(bio) <= 200),
  languages             text[] not null default '{}',
  looking_for           text[] not null default '{}',
  profession            text check (profession is null or char_length(profession) <= 60),
  -- Exact location lives in profile_private (never readable through the API).
  location_visibility   public.location_visibility not null default 'approximate',
  role                  public.user_role not null default 'user',
  status                public.user_status not null default 'active',
  status_reason         text,
  is_verified           boolean not null default false,
  onboarding_completed  boolean not null default false,
  notification_prefs    jsonb not null default '{"connections":true,"events":true,"activities":true,"communities":true,"messages":true,"nearby":true}'::jsonb,
  last_active_at        timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index profiles_city_idx on public.profiles(city_id);
create index profiles_status_idx on public.profiles(status);
create index profiles_last_active_idx on public.profiles(last_active_at desc);

-- Private, server-only data. RLS enabled with NO policies → unreachable via the API.
-- Only security-definer functions (update_my_location, discover_people, set_push_token) touch it.
create table public.profile_private (
  user_id              uuid primary key references public.profiles(id) on delete cascade,
  location             extensions.geography(Point, 4326),
  location_updated_at  timestamptz,
  push_token           text,
  updated_at           timestamptz not null default now()
);
create index profile_private_location_idx on public.profile_private using gist(location);

create table public.interests (
  id          serial primary key,
  slug        text not null unique,
  name        text not null,
  emoji       text,
  sort_order  int not null default 0
);

create table public.user_interests (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  interest_id  int not null references public.interests(id) on delete cascade,
  primary key (user_id, interest_id)
);
create index user_interests_interest_idx on public.user_interests(interest_id);

-- ---- Communities ---------------------------------------------------------------
create table public.communities (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 80),
  slug          text not null unique,
  description   text check (description is null or char_length(description) <= 1000),
  city_id       int references public.cities(id) on delete set null,
  category      text not null default 'general',
  image_url     text,
  owner_id      uuid references public.profiles(id) on delete set null,
  parent_id     uuid references public.communities(id) on delete set null, -- sub-community
  status        public.community_status not null default 'pending',
  is_featured   boolean not null default false,
  member_count  int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index communities_city_idx on public.communities(city_id);
create index communities_status_idx on public.communities(status);
create index communities_category_idx on public.communities(category);
create index communities_parent_idx on public.communities(parent_id);

create table public.community_members (
  community_id  uuid not null references public.communities(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  role          public.membership_role not null default 'member',
  joined_at     timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index community_members_user_idx on public.community_members(user_id);

-- ---- Conversations & messages (created before events so events can FK to it) ---
create table public.conversations (
  id               uuid primary key default gen_random_uuid(),
  type             public.conversation_type not null,
  event_id         uuid,      -- FK added after events table exists
  activity_id      uuid,      -- FK added after activities table exists
  last_message_at  timestamptz,
  created_at       timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  last_read_at     timestamptz,
  joined_at        timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index conversation_participants_user_idx on public.conversation_participants(user_id);

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  sender_id        uuid not null references public.profiles(id) on delete cascade,
  content          text not null check (char_length(content) between 1 and 2000),
  created_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
create index messages_conversation_idx on public.messages(conversation_id, created_at desc);

-- ---- Events ---------------------------------------------------------------------
create table public.events (
  id                 uuid primary key default gen_random_uuid(),
  community_id       uuid references public.communities(id) on delete set null,
  creator_id         uuid not null references public.profiles(id) on delete cascade,
  title              text not null check (char_length(title) between 3 and 80),
  description        text check (description is null or char_length(description) <= 2000),
  category           text not null default 'social',
  image_url          text,
  starts_at          timestamptz not null,
  ends_at            timestamptz,
  location_name      text,
  location_address   text,
  city_id            int references public.cities(id) on delete set null,
  location           extensions.geography(Point, 4326),
  max_participants   int check (max_participants is null or max_participants between 2 and 5000),
  participant_count  int not null default 0,
  status             public.event_status not null default 'approved', -- auto-approve in MVP; admin can reject
  is_featured        boolean not null default false,
  conversation_id    uuid references public.conversations(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);
create index events_city_starts_idx on public.events(city_id, starts_at);
create index events_community_idx on public.events(community_id);
create index events_creator_idx on public.events(creator_id);
create index events_status_idx on public.events(status);

create table public.event_participants (
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index event_participants_user_idx on public.event_participants(user_id);

-- ---- "Join me" activities --------------------------------------------------------
create table public.activities (
  id                 uuid primary key default gen_random_uuid(),
  creator_id         uuid not null references public.profiles(id) on delete cascade,
  city_id            int references public.cities(id) on delete set null,
  community_id       uuid references public.communities(id) on delete set null,
  text               text not null check (char_length(text) between 3 and 140),
  category           text not null default 'social',
  happens_at         timestamptz,
  location_name      text,
  max_participants   int check (max_participants is null or max_participants between 2 and 200),
  participant_count  int not null default 0,
  status             public.activity_status not null default 'open',
  expires_at         timestamptz not null default (now() + interval '24 hours'),
  conversation_id    uuid references public.conversations(id) on delete set null,
  created_at         timestamptz not null default now()
);
create index activities_city_expires_idx on public.activities(city_id, expires_at desc);
create index activities_creator_idx on public.activities(creator_id);

create table public.activity_participants (
  activity_id  uuid not null references public.activities(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  joined_at    timestamptz not null default now(),
  primary key (activity_id, user_id)
);

alter table public.conversations
  add constraint conversations_event_fk foreign key (event_id) references public.events(id) on delete cascade,
  add constraint conversations_activity_fk foreign key (activity_id) references public.activities(id) on delete cascade;
create unique index conversations_event_uidx on public.conversations(event_id) where event_id is not null;
create unique index conversations_activity_uidx on public.conversations(activity_id) where activity_id is not null;

-- ---- Connections (friend requests) --------------------------------------------------
create table public.connections (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.profiles(id) on delete cascade,
  addressee_id  uuid not null references public.profiles(id) on delete cascade,
  status        public.connection_status not null default 'pending',
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  check (requester_id <> addressee_id)
);
-- one connection row per unordered pair
create unique index connections_pair_uidx on public.connections (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index connections_addressee_idx on public.connections(addressee_id, status);
create index connections_requester_idx on public.connections(requester_id, status);

-- ---- Safety -------------------------------------------------------------------------
create table public.blocks (
  blocker_id  uuid not null references public.profiles(id) on delete cascade,
  blocked_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on public.blocks(blocked_id);

create table public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.profiles(id) on delete cascade,
  target_type  public.report_target_type not null,
  target_id    uuid not null,
  reason       text not null check (reason in ('harassment','spam','fake_profile','inappropriate_content','hate_speech','other')),
  details      text check (details is null or char_length(details) <= 1000),
  status       public.report_status not null default 'pending',
  reviewed_by  uuid references public.profiles(id) on delete set null,
  reviewed_at  timestamptz,
  admin_note   text,
  created_at   timestamptz not null default now()
);
create index reports_status_idx on public.reports(status, created_at desc);
create index reports_target_idx on public.reports(target_type, target_id);

-- ---- Notifications ------------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        public.notification_type not null,
  title       text not null,
  body        text,
  data        jsonb not null default '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);

-- ---- Admin audit --------------------------------------------------------------------
create table public.admin_audit_log (
  id           bigserial primary key,
  admin_id     uuid references public.profiles(id) on delete set null,
  action       text not null,
  target_type  text,
  target_id    text,
  meta         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- ---- Daily activity (retention analytics) ---------------------------------------------
create table public.user_daily_activity (
  user_id  uuid not null references public.profiles(id) on delete cascade,
  day      date not null,
  primary key (user_id, day)
);

-- >>> migrations/20260904000003_functions_and_triggers.sql
-- =============================================================================
-- Migration 0003: helper functions + triggers
-- =============================================================================

-- ---- Generic updated_at --------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger communities_set_updated_at before update on public.communities
  for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events
  for each row execute function public.set_updated_at();

-- ---- Auth helpers ------------------------------------------------------------------------
create or replace function public.current_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_moderator()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin','moderator') from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select status = 'active' from public.profiles where id = auth.uid()), false);
$$;

-- true if either user has blocked the other
create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function public.are_connected(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.connections
    where status = 'accepted'
      and least(requester_id, addressee_id) = least(a, b)
      and greatest(requester_id, addressee_id) = greatest(a, b)
  );
$$;

create or replace function public.is_conversation_participant(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = p_conversation_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_community_member(p_community_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.community_members
    where community_id = p_community_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_community_admin(p_community_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.community_members
    where community_id = p_community_id and user_id = auth.uid() and role in ('owner','moderator')
  ) or public.is_moderator();
$$;

-- ---- New user → profile -----------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data ->> 'first_name',
    split_part(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), ' ', 1),
    ''
  );
  insert into public.profiles (id, first_name, photo_url)
  values (new.id, v_name, new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  insert into public.profile_private (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- Counters ---------------------------------------------------------------------------
create or replace function public.community_members_count_trg()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.communities set member_count = member_count + 1 where id = new.community_id;
  elsif tg_op = 'DELETE' then
    update public.communities set member_count = greatest(member_count - 1, 0) where id = old.community_id;
  end if;
  return null;
end $$;
create trigger community_members_count after insert or delete on public.community_members
  for each row execute function public.community_members_count_trg();

-- Event join: enforce capacity, bump counter, add to event chat, notify creator.
create or replace function public.event_participants_trg()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_event public.events%rowtype;
begin
  if tg_op = 'INSERT' then
    select * into v_event from public.events where id = new.event_id for update;
    if v_event.status <> 'approved' then
      raise exception 'Event is not open for joining' using errcode = 'P0001';
    end if;
    if v_event.max_participants is not null and v_event.participant_count >= v_event.max_participants then
      raise exception 'Event is full' using errcode = 'P0001';
    end if;
    update public.events set participant_count = participant_count + 1 where id = new.event_id;
    if v_event.conversation_id is not null then
      insert into public.conversation_participants (conversation_id, user_id)
      values (v_event.conversation_id, new.user_id) on conflict do nothing;
    end if;
    if v_event.creator_id <> new.user_id then
      insert into public.notifications (user_id, type, title, body, data)
      values (
        v_event.creator_id, 'event_joined',
        'Someone joined your event',
        (select first_name from public.profiles where id = new.user_id) || ' joined "' || v_event.title || '"',
        jsonb_build_object('event_id', new.event_id, 'user_id', new.user_id)
      );
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    update public.events set participant_count = greatest(participant_count - 1, 0) where id = old.event_id;
    delete from public.conversation_participants cp
      using public.events e
      where e.id = old.event_id and cp.conversation_id = e.conversation_id and cp.user_id = old.user_id
        and e.creator_id <> old.user_id;
    return old;
  end if;
  return null;
end $$;
create trigger event_participants_manage before insert or delete on public.event_participants
  for each row execute function public.event_participants_trg();

-- Event created: create group conversation, auto-join creator.
create or replace function public.event_after_insert_trg()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_conv uuid;
begin
  insert into public.conversations (type, event_id) values ('event', new.id) returning id into v_conv;
  update public.events set conversation_id = v_conv where id = new.id;
  insert into public.event_participants (event_id, user_id) values (new.id, new.creator_id)
    on conflict do nothing;
  return new;
end $$;
create trigger event_after_insert after insert on public.events
  for each row execute function public.event_after_insert_trg();

-- Activity ("Join me") lifecycle — same pattern as events.
create or replace function public.activity_participants_trg()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_act public.activities%rowtype;
begin
  if tg_op = 'INSERT' then
    select * into v_act from public.activities where id = new.activity_id for update;
    if v_act.status <> 'open' or v_act.expires_at < now() then
      raise exception 'Activity is no longer open' using errcode = 'P0001';
    end if;
    if v_act.max_participants is not null and v_act.participant_count >= v_act.max_participants then
      raise exception 'Activity is full' using errcode = 'P0001';
    end if;
    update public.activities set participant_count = participant_count + 1 where id = new.activity_id;
    if v_act.conversation_id is not null then
      insert into public.conversation_participants (conversation_id, user_id)
      values (v_act.conversation_id, new.user_id) on conflict do nothing;
    end if;
    if v_act.creator_id <> new.user_id then
      insert into public.notifications (user_id, type, title, body, data)
      values (
        v_act.creator_id, 'activity_joined',
        'Someone joined your activity',
        (select first_name from public.profiles where id = new.user_id) || ' is in: "' || v_act.text || '"',
        jsonb_build_object('activity_id', new.activity_id, 'user_id', new.user_id)
      );
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    update public.activities set participant_count = greatest(participant_count - 1, 0) where id = old.activity_id;
    delete from public.conversation_participants cp
      using public.activities a
      where a.id = old.activity_id and cp.conversation_id = a.conversation_id and cp.user_id = old.user_id
        and a.creator_id <> old.user_id;
    return old;
  end if;
  return null;
end $$;
create trigger activity_participants_manage before insert or delete on public.activity_participants
  for each row execute function public.activity_participants_trg();

create or replace function public.activity_after_insert_trg()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_conv uuid;
begin
  insert into public.conversations (type, activity_id) values ('activity', new.id) returning id into v_conv;
  update public.activities set conversation_id = v_conv where id = new.id;
  insert into public.activity_participants (activity_id, user_id) values (new.id, new.creator_id)
    on conflict do nothing;
  return new;
end $$;
create trigger activity_after_insert after insert on public.activities
  for each row execute function public.activity_after_insert_trg();

-- Community created: owner auto-joins as owner.
create or replace function public.community_after_insert_trg()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.owner_id is not null then
    insert into public.community_members (community_id, user_id, role)
    values (new.id, new.owner_id, 'owner') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger community_after_insert after insert on public.communities
  for each row execute function public.community_after_insert_trg();

-- ---- Connections ---------------------------------------------------------------------------
-- Validate request + notify addressee.
create or replace function public.connections_before_insert_trg()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_today int;
begin
  if public.is_blocked_between(new.requester_id, new.addressee_id) then
    raise exception 'Cannot connect with this user' using errcode = 'P0001';
  end if;
  select count(*) into v_today from public.connections
    where requester_id = new.requester_id and created_at > now() - interval '24 hours';
  if v_today >= 20 then
    raise exception 'Daily connection request limit reached' using errcode = 'P0001';
  end if;
  new.status := 'pending';
  new.responded_at := null;
  return new;
end $$;
create trigger connections_before_insert before insert on public.connections
  for each row execute function public.connections_before_insert_trg();

create or replace function public.connections_after_insert_trg()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body, data)
  values (
    new.addressee_id, 'connection_request',
    'New connection request',
    (select first_name from public.profiles where id = new.requester_id) || ' wants to connect with you',
    jsonb_build_object('connection_id', new.id, 'user_id', new.requester_id)
  );
  return new;
end $$;
create trigger connections_after_insert after insert on public.connections
  for each row execute function public.connections_after_insert_trg();

-- On accept: create direct conversation + notify requester.
create or replace function public.connections_after_update_trg()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_conv uuid;
begin
  if new.status = 'accepted' and old.status <> 'accepted' then
    -- direct conversation for the pair (idempotent)
    select c.id into v_conv
      from public.conversations c
      join public.conversation_participants p1 on p1.conversation_id = c.id and p1.user_id = new.requester_id
      join public.conversation_participants p2 on p2.conversation_id = c.id and p2.user_id = new.addressee_id
      where c.type = 'direct' limit 1;
    if v_conv is null then
      insert into public.conversations (type) values ('direct') returning id into v_conv;
      insert into public.conversation_participants (conversation_id, user_id)
        values (v_conv, new.requester_id), (v_conv, new.addressee_id);
    end if;
    insert into public.notifications (user_id, type, title, body, data)
    values (
      new.requester_id, 'connection_accepted',
      'Connection accepted',
      (select first_name from public.profiles where id = new.addressee_id) || ' accepted your connection request',
      jsonb_build_object('connection_id', new.id, 'user_id', new.addressee_id, 'conversation_id', v_conv)
    );
  end if;
  return new;
end $$;
create trigger connections_after_update after update on public.connections
  for each row execute function public.connections_after_update_trg();

-- ---- Blocks: sever connection + drop pending requests -------------------------------------------
create or replace function public.blocks_after_insert_trg()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.connections
    where least(requester_id, addressee_id) = least(new.blocker_id, new.blocked_id)
      and greatest(requester_id, addressee_id) = greatest(new.blocker_id, new.blocked_id);
  return new;
end $$;
create trigger blocks_after_insert after insert on public.blocks
  for each row execute function public.blocks_after_insert_trg();

-- ---- Messages: bump conversation, notify other participants ---------------------------------------
create or replace function public.messages_after_insert_trg()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_sender text;
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  select first_name into v_sender from public.profiles where id = new.sender_id;
  insert into public.notifications (user_id, type, title, body, data)
  select cp.user_id, 'message', v_sender, left(new.content, 120),
         jsonb_build_object('conversation_id', new.conversation_id, 'message_id', new.id)
    from public.conversation_participants cp
    join public.profiles p on p.id = cp.user_id
    where cp.conversation_id = new.conversation_id
      and cp.user_id <> new.sender_id
      and coalesce((p.notification_prefs ->> 'messages')::boolean, true)
      and not public.is_blocked_between(cp.user_id, new.sender_id);
  return new;
end $$;
create trigger messages_after_insert after insert on public.messages
  for each row execute function public.messages_after_insert_trg();

-- Message sender must be a participant, active, and not blocked by all others in a direct chat.
create or replace function public.messages_before_insert_trg()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_type public.conversation_type;
  v_other uuid;
begin
  if not exists (select 1 from public.conversation_participants where conversation_id = new.conversation_id and user_id = new.sender_id) then
    raise exception 'Not a participant of this conversation' using errcode = 'P0001';
  end if;
  select type into v_type from public.conversations where id = new.conversation_id;
  if v_type = 'direct' then
    select user_id into v_other from public.conversation_participants
      where conversation_id = new.conversation_id and user_id <> new.sender_id limit 1;
    if v_other is not null and public.is_blocked_between(new.sender_id, v_other) then
      raise exception 'You cannot message this user' using errcode = 'P0001';
    end if;
    if v_other is not null and not public.are_connected(new.sender_id, v_other) then
      raise exception 'Connect first to start chatting' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
create trigger messages_before_insert before insert on public.messages
  for each row execute function public.messages_before_insert_trg();

-- ---- Community approved → notify city users (batched by trigger) -------------------------------------
create or replace function public.communities_after_update_trg()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and old.status <> 'approved' and new.city_id is not null then
    insert into public.notifications (user_id, type, title, body, data)
    select p.id, 'new_community', 'New community near you',
           new.name || ' is now on WMC in your city',
           jsonb_build_object('community_id', new.id)
      from public.profiles p
      where p.city_id = new.city_id and p.status = 'active'
        and coalesce((p.notification_prefs ->> 'communities')::boolean, true)
      limit 5000;
  end if;
  return new;
end $$;
create trigger communities_after_update after update on public.communities
  for each row execute function public.communities_after_update_trg();

-- ---- Activity heartbeat (retention) ----------------------------------------------------------------
create or replace function public.touch_activity()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set last_active_at = now() where id = auth.uid();
  insert into public.user_daily_activity (user_id, day) values (auth.uid(), current_date)
    on conflict do nothing;
end $$;

-- >>> migrations/20260904000004_rls_policies.sql
-- =============================================================================
-- Migration 0004: Row Level Security
-- Principle: deny by default; users see only what the product needs to show.
-- Admin/moderator bypass via is_moderator()/is_admin().
-- =============================================================================

alter table public.countries               enable row level security;
alter table public.cities                  enable row level security;
alter table public.profiles                enable row level security;
alter table public.profile_private         enable row level security; -- no policies on purpose: API can never read/write it
alter table public.interests               enable row level security;
alter table public.user_interests          enable row level security;
alter table public.communities             enable row level security;
alter table public.community_members       enable row level security;
alter table public.conversations           enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages                enable row level security;
alter table public.events                  enable row level security;
alter table public.event_participants      enable row level security;
alter table public.activities              enable row level security;
alter table public.activity_participants   enable row level security;
alter table public.connections             enable row level security;
alter table public.blocks                  enable row level security;
alter table public.reports                 enable row level security;
alter table public.notifications           enable row level security;
alter table public.admin_audit_log         enable row level security;
alter table public.user_daily_activity     enable row level security;

-- ---- Reference data: readable by everyone (incl. anon for landing page) ----------------------------
create policy "countries readable" on public.countries for select using (true);
create policy "cities readable"    on public.cities    for select using (true);
create policy "interests readable" on public.interests for select using (true);
create policy "admin manages cities" on public.cities for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages countries" on public.countries for all using (public.is_admin()) with check (public.is_admin());

-- ---- Profiles -----------------------------------------------------------------------------------
-- Belt and braces: even a future policy mistake must not expose private data through PostgREST.
revoke all on public.profile_private from anon, authenticated;

create policy "profiles: own row" on public.profiles
  for select using (id = auth.uid());
create policy "profiles: active users visible to active users" on public.profiles
  for select using (
    status = 'active'
    and public.is_active_user()
    and not public.is_blocked_between(id, auth.uid())
  );
create policy "profiles: moderators see all" on public.profiles
  for select using (public.is_moderator());
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid())
  with check (
    id = auth.uid()
    -- users cannot escalate their own role / status
    and role = (select role from public.profiles where id = auth.uid())
    and status = (select status from public.profiles where id = auth.uid())
  );
create policy "profiles: admin update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

create policy "user_interests: readable by active users" on public.user_interests
  for select using (public.is_active_user() or public.is_moderator());
create policy "user_interests: manage own" on public.user_interests
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- Communities ---------------------------------------------------------------------------------
create policy "communities: approved visible" on public.communities
  for select using (status = 'approved' or owner_id = auth.uid() or public.is_moderator());
create policy "communities: create (pending)" on public.communities
  for insert with check (public.is_active_user() and owner_id = auth.uid() and status = 'pending' and is_featured = false);
create policy "communities: owner/mod update" on public.communities
  for update using (public.is_community_admin(id))
  with check (
    public.is_community_admin(id)
    and (public.is_moderator() or (status = (select c.status from public.communities c where c.id = communities.id)
                                    and is_featured = (select c.is_featured from public.communities c where c.id = communities.id)))
  );
create policy "communities: admin delete" on public.communities
  for delete using (public.is_admin() or owner_id = auth.uid());

create policy "community_members: readable" on public.community_members
  for select using (public.is_active_user() or public.is_moderator());
create policy "community_members: join" on public.community_members
  for insert with check (user_id = auth.uid() and public.is_active_user() and role = 'member');
create policy "community_members: leave" on public.community_members
  for delete using (user_id = auth.uid() or public.is_community_admin(community_id));
create policy "community_members: admin role change" on public.community_members
  for update using (public.is_community_admin(community_id)) with check (public.is_community_admin(community_id));

-- ---- Events ---------------------------------------------------------------------------------------
create policy "events: approved visible" on public.events
  for select using (status = 'approved' or creator_id = auth.uid() or public.is_moderator());
create policy "events: create" on public.events
  for insert with check (
    public.is_active_user() and creator_id = auth.uid()
    and is_featured = false and status = 'approved'
    and (community_id is null or public.is_community_member(community_id))
  );
create policy "events: creator update" on public.events
  for update using (creator_id = auth.uid() or public.is_moderator())
  with check (
    (creator_id = auth.uid() or public.is_moderator())
    and (public.is_moderator() or is_featured = (select e.is_featured from public.events e where e.id = events.id))
  );
create policy "events: delete" on public.events
  for delete using (creator_id = auth.uid() or public.is_admin());

create policy "event_participants: readable" on public.event_participants
  for select using (public.is_active_user() or public.is_moderator());
create policy "event_participants: join" on public.event_participants
  for insert with check (user_id = auth.uid() and public.is_active_user());
create policy "event_participants: leave" on public.event_participants
  for delete using (user_id = auth.uid() or public.is_moderator());

-- ---- Activities ("Join me") --------------------------------------------------------------------------
create policy "activities: visible" on public.activities
  for select using (
    (public.is_active_user() and not public.is_blocked_between(creator_id, auth.uid()))
    or public.is_moderator()
  );
create policy "activities: create" on public.activities
  for insert with check (public.is_active_user() and creator_id = auth.uid()
    and (community_id is null or public.is_community_member(community_id)));
create policy "activities: creator update" on public.activities
  for update using (creator_id = auth.uid() or public.is_moderator());
create policy "activities: delete" on public.activities
  for delete using (creator_id = auth.uid() or public.is_admin());

create policy "activity_participants: readable" on public.activity_participants
  for select using (public.is_active_user() or public.is_moderator());
create policy "activity_participants: join" on public.activity_participants
  for insert with check (user_id = auth.uid() and public.is_active_user());
create policy "activity_participants: leave" on public.activity_participants
  for delete using (user_id = auth.uid() or public.is_moderator());

-- ---- Connections -------------------------------------------------------------------------------------
create policy "connections: involved parties" on public.connections
  for select using (requester_id = auth.uid() or addressee_id = auth.uid() or public.is_moderator());
create policy "connections: send request" on public.connections
  for insert with check (requester_id = auth.uid() and public.is_active_user());
create policy "connections: addressee responds" on public.connections
  for update using (addressee_id = auth.uid() and status = 'pending')
  with check (addressee_id = auth.uid() and status in ('accepted','declined'));
create policy "connections: withdraw / remove" on public.connections
  for delete using (requester_id = auth.uid() or addressee_id = auth.uid());

-- ---- Conversations & messages ------------------------------------------------------------------------
create policy "conversations: participants" on public.conversations
  for select using (public.is_conversation_participant(id) or public.is_moderator());
create policy "conversation_participants: same conversation" on public.conversation_participants
  for select using (public.is_conversation_participant(conversation_id) or public.is_moderator());
create policy "conversation_participants: update own read marker" on public.conversation_participants
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "conversation_participants: leave" on public.conversation_participants
  for delete using (user_id = auth.uid());

create policy "messages: participants read" on public.messages
  for select using (
    (public.is_conversation_participant(conversation_id) and not public.is_blocked_between(sender_id, auth.uid()))
    or public.is_moderator()
  );
create policy "messages: send" on public.messages
  for insert with check (sender_id = auth.uid() and public.is_active_user());
create policy "messages: soft delete own" on public.messages
  for update using (sender_id = auth.uid() or public.is_moderator())
  with check (sender_id = auth.uid() or public.is_moderator());

-- ---- Safety -------------------------------------------------------------------------------------------
create policy "blocks: own" on public.blocks
  for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
create policy "blocks: moderators read" on public.blocks
  for select using (public.is_moderator());

create policy "reports: create own" on public.reports
  for insert with check (reporter_id = auth.uid() and public.is_active_user() and status = 'pending');
create policy "reports: read own" on public.reports
  for select using (reporter_id = auth.uid());
create policy "reports: moderators" on public.reports
  for all using (public.is_moderator()) with check (public.is_moderator());

-- ---- Notifications --------------------------------------------------------------------------------------
create policy "notifications: own" on public.notifications
  for select using (user_id = auth.uid());
create policy "notifications: mark read / delete own" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications: delete own" on public.notifications
  for delete using (user_id = auth.uid());

-- ---- Admin audit / analytics ------------------------------------------------------------------------------
create policy "audit: admins" on public.admin_audit_log
  for all using (public.is_admin()) with check (public.is_admin());
create policy "daily activity: own + admin" on public.user_daily_activity
  for select using (user_id = auth.uid() or public.is_admin());

-- >>> migrations/20260904000005_rpc.sql
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

-- >>> migrations/20260904000006_storage_and_realtime.sql
-- =============================================================================
-- Migration 0006: storage buckets + realtime publication
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',   'avatars',   true, 5242880,  array['image/jpeg','image/png','image/webp']),
  ('community', 'community', true, 5242880,  array['image/jpeg','image/png','image/webp']),
  ('events',    'events',    true, 5242880,  array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Path convention: <bucket>/<user_id>/<filename>. Users may only write inside their own folder.
create policy "public read images" on storage.objects
  for select using (bucket_id in ('avatars','community','events'));

create policy "users upload own folder" on storage.objects
  for insert with check (
    bucket_id in ('avatars','community','events')
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users update own folder" on storage.objects
  for update using (
    bucket_id in ('avatars','community','events')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete own folder" on storage.objects
  for delete using (
    bucket_id in ('avatars','community','events')
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- Realtime: chat + notifications
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.activities;
alter table public.messages replica identity full;

-- >>> migrations/20260904000007_waitlist.sql
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

-- >>> migrations/20260904000008_reminders_and_maintenance.sql
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
