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
