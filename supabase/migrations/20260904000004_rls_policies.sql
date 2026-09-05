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
