/**
 * Domain types shared by mobile + web. Keep in sync with supabase/migrations.
 * Enum values are the exact Postgres enum labels.
 */
export type UserStatus = 'active' | 'suspended' | 'banned';
export type UserRole = 'user' | 'moderator' | 'admin';
export type Gender = 'male' | 'female' | 'prefer_not_to_say';
export type LocationVisibility = 'city_only' | 'approximate' | 'hidden';

export type CommunityStatus = 'pending' | 'approved' | 'rejected';
export type MembershipRole = 'member' | 'moderator' | 'owner';
export type EventStatus = 'pending' | 'approved' | 'cancelled' | 'rejected';
export type ActivityStatus = 'open' | 'closed' | 'cancelled';
export type ConnectionStatus = 'pending' | 'accepted' | 'declined';
export type ConversationType = 'direct' | 'event' | 'activity';
export type ReportTargetType = 'user' | 'event' | 'message' | 'community' | 'activity';
export type ReportStatus = 'pending' | 'reviewed' | 'actioned' | 'dismissed';
export type NotificationType =
  | 'connection_request'
  | 'connection_accepted'
  | 'event_joined'
  | 'event_reminder'
  | 'activity_joined'
  | 'new_community'
  | 'nearby_people'
  | 'message'
  | 'system';

export interface Country {
  id: number;
  code: string;
  name: string;
}

export interface City {
  id: number;
  country_id: number;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  timezone: string;
  is_active: boolean;
}

export interface NotificationPrefs {
  connections: boolean;
  events: boolean;
  activities: boolean;
  communities: boolean;
  messages: boolean;
  nearby: boolean;
}

export interface Profile {
  id: string;
  first_name: string;
  photo_url: string | null;
  age: number | null;
  gender: Gender | null;
  city_id: number | null;
  bio: string | null;
  languages: string[];
  looking_for: string[];
  profession: string | null;
  location_visibility: LocationVisibility;
  role: UserRole;
  status: UserStatus;
  onboarding_completed: boolean;
  notification_prefs: NotificationPrefs;
  last_active_at: string;
  created_at: string;
  updated_at: string;
}

/** Public projection returned by discover_people() — never includes exact location */
export interface DiscoveredPerson {
  id: string;
  first_name: string;
  photo_url: string | null;
  age: number | null;
  city_name: string | null;
  profession: string | null;
  bio: string | null;
  languages: string[];
  interests: string[];
  shared_interests: string[];
  shared_languages: string[];
  shared_goals: string[];
  score: number;
  compatibility: number;
  distance_label: string;
  connection_status: ConnectionStatus | null;
  connection_direction: 'sent' | 'received' | null;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city_id: number | null;
  category: string;
  image_url: string | null;
  owner_id: string | null;
  parent_id: string | null;
  status: CommunityStatus;
  is_featured: boolean;
  member_count: number;
  created_at: string;
}

export interface Event {
  id: string;
  community_id: string | null;
  creator_id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  starts_at: string;
  ends_at: string | null;
  location_name: string | null;
  location_address: string | null;
  city_id: number | null;
  max_participants: number | null;
  participant_count: number;
  status: EventStatus;
  is_featured: boolean;
  conversation_id: string | null;
  created_at: string;
}

/** "Join me" — lightweight, time-boxed activity */
export interface Activity {
  id: string;
  creator_id: string;
  city_id: number | null;
  community_id: string | null;
  text: string;
  category: string;
  happens_at: string | null;
  location_name: string | null;
  max_participants: number | null;
  participant_count: number;
  status: ActivityStatus;
  expires_at: string;
  conversation_id: string | null;
  created_at: string;
}

export interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: ConnectionStatus;
  created_at: string;
  responded_at: string | null;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  event_id: string | null;
  activity_id: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface HomeSummary {
  people_count: number;
  community_count: number;
  event_count: number;
  activity_count: number;
}

export interface AdminStats {
  total_users: number;
  active_users_7d: number;
  active_users_30d: number;
  new_users_7d: number;
  new_users_30d: number;
  communities: number;
  pending_communities: number;
  events: number;
  upcoming_events: number;
  pending_events: number;
  connections: number;
  messages: number;
  pending_reports: number;
  retention_d7: number; // 0-100
  retention_d30: number; // 0-100
}
