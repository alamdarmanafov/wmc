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
