import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Gender, LocationVisibility, NotificationPrefs, ReportTargetType } from '@wmc/shared';

import { PROFILE_COLUMNS, toProfile, useAuth, useUserId } from './auth';
import type {
  ActivityRow,
  CommunityRow,
  ConnectionRow,
  ConversationSummaryRow,
  DiscoverPersonRow,
  EventRow,
  InterestRow,
  MessageRow,
  NotificationRow,
} from './database.types';
import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------
export const keys = {
  cities: ['cities'] as const,
  interests: ['interests'] as const,
  myInterests: (userId: string) => ['my-interests', userId] as const,
  myStats: (userId: string) => ['my-stats', userId] as const,
  myMemberships: (userId: string) => ['my-memberships', userId] as const,
  homeSummary: ['home-summary'] as const,
  activities: (cityId: number | null) => ['activities', cityId] as const,
  activity: (id: string) => ['activity', id] as const,
  activityParticipants: (id: string) => ['activity-participants', id] as const,
  events: (scope: string, cityId: number | null) => ['events', scope, cityId] as const,
  event: (id: string) => ['event', id] as const,
  eventParticipants: (id: string) => ['event-participants', id] as const,
  communities: (cityId: number | null, search: string, category: string | null) =>
    ['communities', cityId, search, category] as const,
  community: (id: string) => ['community', id] as const,
  communityMembers: (id: string) => ['community-members', id] as const,
  communityEvents: (id: string) => ['community-events', id] as const,
  discover: (filters: DiscoverFilters) => ['discover', filters] as const,
  connections: ['connections'] as const,
  connectionWith: (userId: string) => ['connection-with', userId] as const,
  conversations: ['conversations'] as const,
  messages: (id: string) => ['messages', id] as const,
  notifications: ['notifications'] as const,
  unread: ['notifications', 'unread'] as const,
  user: (id: string) => ['user', id] as const,
  userInterests: (id: string) => ['user-interests', id] as const,
  blocked: ['blocked'] as const,
  onboardingSummary: ['onboarding-summary'] as const,
};

export type PersonPreview = { id: string; first_name: string; photo_url: string | null };

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------
export function useCities() {
  return useQuery({
    queryKey: keys.cities,
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const { data, error } = await supabase.from('cities').select('*').eq('is_active', true).order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useInterests() {
  return useQuery({
    queryKey: keys.interests,
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const { data, error } = await supabase.from('interests').select('*').order('sort_order');
      if (error) throw error;
      return data;
    },
  });
}

export function useCityName(cityId: number | null | undefined): string | null {
  const { data } = useCities();
  if (!cityId || !data) return null;
  return data.find((c) => c.id === cityId)?.name ?? null;
}

// ---------------------------------------------------------------------------
// My profile
// ---------------------------------------------------------------------------
export function useMyInterests() {
  const userId = useUserId();
  return useUserInterests(userId, keys.myInterests(userId));
}

export function useUserInterests(userId: string, queryKey: readonly unknown[] = keys.userInterests(userId)) {
  return useQuery({
    queryKey,
    queryFn: async (): Promise<InterestRow[]> => {
      const { data, error } = await supabase
        .from('user_interests')
        .select('interests(id, slug, name, emoji, sort_order)')
        .eq('user_id', userId);
      if (error) throw error;
      return data.map((r) => r.interests).sort((a, b) => a.sort_order - b.sort_order);
    },
  });
}

export function useSaveInterests() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (interestIds: number[]) => {
      const del = await supabase.from('user_interests').delete().eq('user_id', userId);
      if (del.error) throw del.error;
      if (interestIds.length === 0) return;
      const ins = await supabase
        .from('user_interests')
        .insert(interestIds.map((interest_id) => ({ user_id: userId, interest_id })));
      if (ins.error) throw ins.error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.myInterests(userId) });
      void qc.invalidateQueries({ queryKey: keys.userInterests(userId) });
      void qc.invalidateQueries({ queryKey: ['discover'] });
    },
  });
}

export interface ProfileUpdate {
  first_name?: string;
  photo_url?: string | null;
  age?: number | null;
  gender?: Gender | null;
  city_id?: number | null;
  bio?: string | null;
  languages?: string[];
  looking_for?: string[];
  profession?: string | null;
  location_visibility?: LocationVisibility;
  onboarding_completed?: boolean;
  notification_prefs?: NotificationPrefs;
}

export function useUpdateProfile() {
  const { user, refreshProfile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (update: ProfileUpdate) => {
      if (!user) throw new Error('Not signed in');
      const { notification_prefs, ...rest } = update;
      const payload = notification_prefs ? { ...rest, notification_prefs: { ...notification_prefs } } : rest;
      const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
      if (error) throw error;
      return refreshProfile();
    },
    onSuccess: () => {
      if (user) void qc.invalidateQueries({ queryKey: keys.user(user.id) });
    },
  });
}

export function useUpdateLocation() {
  return useMutation({
    mutationFn: async (coords: { lat: number; lng: number } | null) => {
      const { error } = await supabase.rpc('update_my_location', {
        p_lat: coords?.lat ?? null,
        p_lng: coords?.lng ?? null,
      });
      if (error) throw error;
    },
  });
}

export function useMyStats() {
  const userId = useUserId();
  return useQuery({
    queryKey: keys.myStats(userId),
    queryFn: async () => {
      const [communities, events, connections] = await Promise.all([
        supabase.from('community_members').select('community_id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('event_participants').select('event_id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase
          .from('connections')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'accepted')
          .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
      ]);
      return {
        communities: communities.count ?? 0,
        events: events.count ?? 0,
        connections: connections.count ?? 0,
      };
    },
  });
}

export function useMyMemberships() {
  const userId = useUserId();
  return useQuery({
    queryKey: keys.myMemberships(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_members')
        .select('community_id, role, communities(id, name, category, status)')
        .eq('user_id', userId);
      if (error) throw error;
      return data.map((r) => ({ ...r.communities, role: r.role }));
    },
  });
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------
export function useHomeSummary() {
  return useQuery({
    queryKey: keys.homeSummary,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('home_summary').single();
      if (error) throw error;
      return data;
    },
  });
}

export function useOnboardingSummary() {
  return useQuery({
    queryKey: keys.onboardingSummary,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('onboarding_summary').single();
      if (error) throw error;
      return data;
    },
  });
}

export type ActivityListItem = ActivityRow & { creator: PersonPreview };

export function useOpenActivities(cityId: number | null, limit = 5) {
  return useQuery({
    queryKey: [...keys.activities(cityId), limit],
    queryFn: async (): Promise<ActivityListItem[]> => {
      let q = supabase
        .from('activities')
        .select('*, creator:profiles!activities_creator_id_fkey(id, first_name, photo_url)')
        .eq('status', 'open')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);
      if (cityId) q = q.eq('city_id', cityId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export type EventListItem = EventRow & { communities: { name: string } | null };
const EVENT_LIST_SELECT = '*, communities(name)';

export function useUpcomingEvents(cityId: number | null, limit = 20) {
  return useQuery({
    queryKey: [...keys.events('upcoming', cityId), limit],
    queryFn: async (): Promise<EventListItem[]> => {
      let q = supabase
        .from('events')
        .select(EVENT_LIST_SELECT)
        .eq('status', 'approved')
        .gt('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(limit);
      if (cityId) q = q.eq('city_id', cityId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useMyEvents() {
  const userId = useUserId();
  return useQuery({
    queryKey: keys.events('mine', null),
    queryFn: async (): Promise<EventListItem[]> => {
      const { data, error } = await supabase
        .from('event_participants')
        .select(`events(${EVENT_LIST_SELECT})`)
        .eq('user_id', userId);
      if (error) throw error;
      return data
        .map((r) => r.events)
        .filter((e) => e.status !== 'cancelled')
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    },
  });
}

export function useRecommendedCommunities(cityId: number | null, limit = 5) {
  return useQuery({
    queryKey: [...keys.communities(cityId, '', null), 'recommended', limit],
    queryFn: async () => {
      let q = supabase
        .from('communities')
        .select('*')
        .eq('status', 'approved')
        .order('is_featured', { ascending: false })
        .order('member_count', { ascending: false })
        .limit(limit);
      if (cityId) q = q.eq('city_id', cityId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

// ---------------------------------------------------------------------------
// Discover
// ---------------------------------------------------------------------------
export interface DiscoverFilters {
  interest: string | null;
  language: string | null;
  lookingFor: string | null;
  minAge: number | null;
  maxAge: number | null;
  maxKm: number | null;
}

export const EMPTY_FILTERS: DiscoverFilters = {
  interest: null,
  language: null,
  lookingFor: null,
  minAge: null,
  maxAge: null,
  maxKm: null,
};

export function useDiscoverPeople(filters: DiscoverFilters) {
  return useQuery({
    queryKey: keys.discover(filters),
    queryFn: async (): Promise<DiscoverPersonRow[]> => {
      const { data, error } = await supabase.rpc('discover_people', {
        p_limit: 50,
        p_offset: 0,
        p_interest: filters.interest,
        p_language: filters.language,
        p_looking_for: filters.lookingFor,
        p_min_age: filters.minAge,
        p_max_age: filters.maxAge,
        p_max_km: filters.maxKm,
      });
      if (error) throw error;
      return data;
    },
  });
}

function invalidateSocial(qc: ReturnType<typeof useQueryClient>, otherUserId?: string) {
  void qc.invalidateQueries({ queryKey: ['discover'] });
  void qc.invalidateQueries({ queryKey: keys.connections });
  void qc.invalidateQueries({ queryKey: ['my-stats'] });
  void qc.invalidateQueries({ queryKey: keys.conversations });
  if (otherUserId) void qc.invalidateQueries({ queryKey: keys.connectionWith(otherUserId) });
}

/** The single connection row (any status) between me and another user. */
export function useConnectionWith(otherUserId: string) {
  const userId = useUserId();
  return useQuery({
    queryKey: keys.connectionWith(otherUserId),
    queryFn: async (): Promise<ConnectionRow | null> => {
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .or(
          `and(requester_id.eq.${userId},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${userId})`,
        )
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useConnect() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (addresseeId: string) => {
      const { error } = await supabase.from('connections').insert({ requester_id: userId, addressee_id: addresseeId });
      if (error) throw error;
      return addresseeId;
    },
    onSuccess: (addresseeId) => invalidateSocial(qc, addresseeId),
  });
}

export function useRespondConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ connectionId, accept }: { connectionId: string; accept: boolean }) => {
      const { data, error } = await supabase.rpc('respond_connection', {
        p_connection_id: connectionId,
        p_accept: accept,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (row) => invalidateSocial(qc, row.requester_id),
  });
}

/** Accepts the pending request from `otherUserId` (looks up the connection id first). */
export function useAcceptFrom() {
  const userId = useUserId();
  const respond = useRespondConnection();
  return useMutation({
    mutationFn: async (otherUserId: string) => {
      const { data, error } = await supabase
        .from('connections')
        .select('id')
        .eq('requester_id', otherUserId)
        .eq('addressee_id', userId)
        .eq('status', 'pending')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Request no longer available');
      return respond.mutateAsync({ connectionId: data.id, accept: true });
    },
  });
}

export function useRemoveConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase.from('connections').delete().eq('id', connectionId);
      if (error) throw error;
    },
    onSuccess: () => invalidateSocial(qc),
  });
}

export function useDirectConversation() {
  return useMutation({
    mutationFn: async (otherUserId: string) => {
      const { data, error } = await supabase.rpc('direct_conversation_with', { p_user_id: otherUserId });
      if (error) throw error;
      if (!data) throw new Error('Connect first to start chatting');
      return data;
    },
  });
}

export type ConnectionWithProfiles = ConnectionRow & { requester: PersonPreview; addressee: PersonPreview };

export function useConnections() {
  const userId = useUserId();
  return useQuery({
    queryKey: keys.connections,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('connections')
        .select(
          '*, requester:profiles!connections_requester_id_fkey(id, first_name, photo_url), addressee:profiles!connections_addressee_id_fkey(id, first_name, photo_url)',
        )
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows: ConnectionWithProfiles[] = data;
      return {
        received: rows.filter((c) => c.status === 'pending' && c.addressee_id === userId),
        sent: rows.filter((c) => c.status === 'pending' && c.requester_id === userId),
        accepted: rows
          .filter((c) => c.status === 'accepted')
          .map((c) => ({ ...c, other: c.requester_id === userId ? c.addressee : c.requester })),
      };
    },
  });
}

// ---------------------------------------------------------------------------
// Communities
// ---------------------------------------------------------------------------
export function useCommunities(cityId: number | null, search: string, category: string | null) {
  return useQuery({
    queryKey: keys.communities(cityId, search, category),
    queryFn: async (): Promise<CommunityRow[]> => {
      let q = supabase
        .from('communities')
        .select('*')
        .eq('status', 'approved')
        .order('is_featured', { ascending: false })
        .order('member_count', { ascending: false })
        .limit(50);
      if (cityId) q = q.eq('city_id', cityId);
      if (category) q = q.eq('category', category);
      if (search.trim()) q = q.ilike('name', `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCommunity(id: string) {
  return useQuery({
    queryKey: keys.community(id),
    queryFn: async () => {
      const { data, error } = await supabase.from('communities').select('*, cities(name)').eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCommunityMembers(id: string) {
  return useQuery({
    queryKey: keys.communityMembers(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_members')
        .select('user_id, role, profiles(id, first_name, photo_url)')
        .eq('community_id', id)
        .order('joined_at', { ascending: true })
        .limit(30);
      if (error) throw error;
      return data.map((m) => ({ ...m.profiles, role: m.role }));
    },
  });
}

export function useCommunityEvents(id: string) {
  return useQuery({
    queryKey: keys.communityEvents(id),
    queryFn: async (): Promise<EventListItem[]> => {
      const { data, error } = await supabase
        .from('events')
        .select(EVENT_LIST_SELECT)
        .eq('community_id', id)
        .eq('status', 'approved')
        .gt('starts_at', new Date().toISOString())
        .order('starts_at')
        .limit(10);
      if (error) throw error;
      return data;
    },
  });
}

export function useJoinCommunity() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (communityId: string) => {
      const { error } = await supabase.from('community_members').insert({ community_id: communityId, user_id: userId });
      if (error) throw error;
      return communityId;
    },
    onSuccess: (communityId) => invalidateCommunity(qc, communityId),
  });
}

export function useLeaveCommunity() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (communityId: string) => {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', userId);
      if (error) throw error;
      return communityId;
    },
    onSuccess: (communityId) => invalidateCommunity(qc, communityId),
  });
}

function invalidateCommunity(qc: ReturnType<typeof useQueryClient>, communityId: string) {
  void qc.invalidateQueries({ queryKey: keys.community(communityId) });
  void qc.invalidateQueries({ queryKey: keys.communityMembers(communityId) });
  void qc.invalidateQueries({ queryKey: ['communities'] });
  void qc.invalidateQueries({ queryKey: ['my-memberships'] });
  void qc.invalidateQueries({ queryKey: ['my-stats'] });
  void qc.invalidateQueries({ queryKey: keys.homeSummary });
}

export interface CreateCommunityInput {
  name: string;
  slug: string;
  description: string | null;
  category: string;
  image_url: string | null;
  city_id: number | null;
}

export function useCreateCommunity() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCommunityInput) => {
      const { data, error } = await supabase
        .from('communities')
        .insert({ ...input, owner_id: userId, status: 'pending' })
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-memberships'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
export function useEvent(id: string) {
  return useQuery({
    queryKey: keys.event(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, communities(id, name), creator:profiles!events_creator_id_fkey(id, first_name, photo_url)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useEventParticipants(id: string) {
  return useQuery({
    queryKey: keys.eventParticipants(id),
    queryFn: async (): Promise<PersonPreview[]> => {
      const { data, error } = await supabase
        .from('event_participants')
        .select('profiles(id, first_name, photo_url)')
        .eq('event_id', id)
        .order('joined_at')
        .limit(50);
      if (error) throw error;
      return data.map((p) => p.profiles);
    },
  });
}

function invalidateEvent(qc: ReturnType<typeof useQueryClient>, eventId: string) {
  void qc.invalidateQueries({ queryKey: keys.event(eventId) });
  void qc.invalidateQueries({ queryKey: keys.eventParticipants(eventId) });
  void qc.invalidateQueries({ queryKey: ['events'] });
  void qc.invalidateQueries({ queryKey: ['community-events'] });
  void qc.invalidateQueries({ queryKey: ['my-stats'] });
  void qc.invalidateQueries({ queryKey: ['my-participation'] });
  void qc.invalidateQueries({ queryKey: keys.homeSummary });
  void qc.invalidateQueries({ queryKey: keys.conversations });
}

export function useJoinEvent() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from('event_participants').insert({ event_id: eventId, user_id: userId });
      if (error) throw error;
      return eventId;
    },
    onSuccess: (eventId) => invalidateEvent(qc, eventId),
  });
}

export function useLeaveEvent() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from('event_participants').delete().eq('event_id', eventId).eq('user_id', userId);
      if (error) throw error;
      return eventId;
    },
    onSuccess: (eventId) => invalidateEvent(qc, eventId),
  });
}

export interface CreateEventInput {
  title: string;
  description: string | null;
  category: string;
  starts_at: string;
  location_name: string | null;
  location_address: string | null;
  max_participants: number | null;
  community_id: string | null;
  image_url: string | null;
  city_id: number | null;
}

export function useCreateEvent() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      const { data, error } = await supabase
        .from('events')
        .insert({ ...input, creator_id: userId })
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (eventId) => invalidateEvent(qc, eventId),
  });
}

export function useCancelEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from('events').update({ status: 'cancelled' }).eq('id', eventId);
      if (error) throw error;
      return eventId;
    },
    onSuccess: (eventId) => invalidateEvent(qc, eventId),
  });
}

// ---------------------------------------------------------------------------
// Activities ("Join me")
// ---------------------------------------------------------------------------
export function useActivity(id: string) {
  return useQuery({
    queryKey: keys.activity(id),
    queryFn: async (): Promise<ActivityListItem> => {
      const { data, error } = await supabase
        .from('activities')
        .select('*, creator:profiles!activities_creator_id_fkey(id, first_name, photo_url)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useActivityParticipants(id: string) {
  return useQuery({
    queryKey: keys.activityParticipants(id),
    queryFn: async (): Promise<PersonPreview[]> => {
      const { data, error } = await supabase
        .from('activity_participants')
        .select('profiles(id, first_name, photo_url)')
        .eq('activity_id', id)
        .order('joined_at')
        .limit(50);
      if (error) throw error;
      return data.map((p) => p.profiles);
    },
  });
}

function invalidateActivity(qc: ReturnType<typeof useQueryClient>, activityId: string) {
  void qc.invalidateQueries({ queryKey: keys.activity(activityId) });
  void qc.invalidateQueries({ queryKey: keys.activityParticipants(activityId) });
  void qc.invalidateQueries({ queryKey: ['activities'] });
  void qc.invalidateQueries({ queryKey: ['my-participation'] });
  void qc.invalidateQueries({ queryKey: keys.homeSummary });
  void qc.invalidateQueries({ queryKey: keys.conversations });
}

export function useJoinActivity() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase.from('activity_participants').insert({ activity_id: activityId, user_id: userId });
      if (error) throw error;
      return activityId;
    },
    onSuccess: (activityId) => invalidateActivity(qc, activityId),
  });
}

export function useLeaveActivity() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase
        .from('activity_participants')
        .delete()
        .eq('activity_id', activityId)
        .eq('user_id', userId);
      if (error) throw error;
      return activityId;
    },
    onSuccess: (activityId) => invalidateActivity(qc, activityId),
  });
}

export interface CreateActivityInput {
  text: string;
  category: string;
  happens_at: string | null;
  location_name: string | null;
  max_participants: number | null;
  city_id: number | null;
}

export function useCreateActivity() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateActivityInput) => {
      const { data, error } = await supabase
        .from('activities')
        .insert({ ...input, creator_id: userId })
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => invalidateActivity(qc, id),
  });
}

export function useCloseActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase.from('activities').update({ status: 'closed' }).eq('id', activityId);
      if (error) throw error;
      return activityId;
    },
    onSuccess: (id) => invalidateActivity(qc, id),
  });
}

// ---------------------------------------------------------------------------
// Public user profile
// ---------------------------------------------------------------------------
export function useUserProfile(id: string) {
  return useQuery({
    queryKey: keys.user(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`${PROFILE_COLUMNS}, cities(name)`)
        .eq('id', id)
        .single();
      if (error) throw error;
      return { ...toProfile(data), city_name: data.cities?.name ?? null };
    },
  });
}

export function useBlockUser() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blockedId: string) => {
      const { error } = await supabase.from('blocks').insert({ blocker_id: userId, blocked_id: blockedId });
      if (error) throw error;
      return blockedId;
    },
    onSuccess: (blockedId) => {
      invalidateSocial(qc, blockedId);
      void qc.invalidateQueries({ queryKey: keys.blocked });
      void qc.invalidateQueries({ queryKey: keys.user(blockedId) });
    },
  });
}

export function useBlockedUsers() {
  const userId = useUserId();
  return useQuery({
    queryKey: keys.blocked,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocks')
        .select('blocked_id, created_at, profiles!blocks_blocked_id_fkey(id, first_name, photo_url)')
        .eq('blocker_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((b) => ({ ...b.profiles, blocked_at: b.created_at }));
    },
  });
}

export function useUnblockUser() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blockedId: string) => {
      const { error } = await supabase.from('blocks').delete().eq('blocker_id', userId).eq('blocked_id', blockedId);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.blocked });
      void qc.invalidateQueries({ queryKey: ['discover'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------
export function useConversations() {
  return useQuery({
    queryKey: keys.conversations,
    queryFn: async (): Promise<ConversationSummaryRow[]> => {
      const { data, error } = await supabase.rpc('my_conversations');
      if (error) throw error;
      return data;
    },
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: keys.messages(conversationId),
    queryFn: async (): Promise<MessageRow[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

export function useSendMessage(conversationId: string) {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: userId, content })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (message) => {
      qc.setQueryData<MessageRow[]>(keys.messages(conversationId), (prev) => {
        if (!prev) return [message];
        return prev.some((m) => m.id === message.id) ? prev : [...prev, message];
      });
      void qc.invalidateQueries({ queryKey: keys.conversations });
    },
  });
}

export async function markConversationRead(conversationId: string) {
  await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId });
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export function useNotifications() {
  return useQuery({
    queryKey: keys.notifications,
    queryFn: async (): Promise<NotificationRow[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

export function useUnreadNotificationCount() {
  const userId = useUserId();
  return useQuery({
    queryKey: keys.unread,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useMarkAllNotificationsRead() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.notifications });
    },
  });
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
export interface ReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details: string | null;
  blockUser: boolean;
}

export function useReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReportInput) => {
      const { error } = await supabase.rpc('report_target', {
        p_target_type: input.targetType,
        p_target_id: input.targetId,
        p_reason: input.reason,
        p_details: input.details,
        p_block_user: input.blockUser,
      });
      if (error) throw error;
    },
    onSuccess: (_, input) => {
      if (input.blockUser) {
        invalidateSocial(qc, input.targetId);
        void qc.invalidateQueries({ queryKey: keys.blocked });
      }
    },
  });
}

// ---------------------------------------------------------------------------
// My participation (for "Joined" states on lists)
// ---------------------------------------------------------------------------
export function useMyParticipation() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['my-participation', userId],
    queryFn: async () => {
      const [events, activities] = await Promise.all([
        supabase.from('event_participants').select('event_id').eq('user_id', userId),
        supabase.from('activity_participants').select('activity_id').eq('user_id', userId),
      ]);
      if (events.error) throw events.error;
      if (activities.error) throw activities.error;
      return {
        eventIds: new Set(events.data.map((r) => r.event_id)),
        activityIds: new Set(activities.data.map((r) => r.activity_id)),
      };
    },
  });
}

export function useConversationParticipants(conversationId: string) {
  return useQuery({
    queryKey: ['conversation-participants', conversationId],
    queryFn: async (): Promise<PersonPreview[]> => {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select('profiles(id, first_name, photo_url)')
        .eq('conversation_id', conversationId);
      if (error) throw error;
      return data.map((p) => p.profiles);
    },
  });
}
