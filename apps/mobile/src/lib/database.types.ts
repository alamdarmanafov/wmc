/**
 * Hand-written Database typing for the tables / RPCs the mobile app touches.
 * Mirrors supabase/migrations. Regenerate with `npm run db:types` once a local
 * Supabase is available and replace this file if you prefer generated types.
 */
import type {
  ActivityStatus,
  CommunityStatus,
  ConnectionStatus,
  ConversationType,
  EventStatus,
  Gender,
  LocationVisibility,
  MembershipRole,
  NotificationType,
  ReportTargetType,
  UserRole,
  UserStatus,
} from '@wmc/shared';

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Rel<
  Name extends string,
  Column extends string,
  Ref extends string,
  OneToOne extends boolean = false,
> = {
  foreignKeyName: Name;
  columns: [Column];
  isOneToOne: OneToOne;
  referencedRelation: Ref;
  referencedColumns: ['id'];
};

export type ProfileRow = {
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
  status_reason: string | null;
  is_verified: boolean;
  onboarding_completed: boolean;
  notification_prefs: Json;
  last_active_at: string;
  created_at: string;
  updated_at: string;
};

export type CityRow = {
  id: number;
  country_id: number;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  timezone: string;
  is_active: boolean;
  created_at: string;
};

export type InterestRow = { id: number; slug: string; name: string; emoji: string | null; sort_order: number };

export type CommunityRow = {
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
  updated_at: string;
};

export type EventRow = {
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
  updated_at: string;
};

export type ActivityRow = {
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
};

export type ConnectionRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: ConnectionStatus;
  created_at: string;
  responded_at: string | null;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Json;
  read_at: string | null;
  created_at: string;
};

export type DiscoverPersonRow = {
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
};

export type ConversationSummaryRow = {
  id: string;
  type: ConversationType;
  title: string | null;
  image_url: string | null;
  event_id: string | null;
  activity_id: string | null;
  other_user_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};

export type Database = {
  public: {
    Tables: {
      cities: {
        Row: CityRow;
        Insert: Partial<CityRow>;
        Update: Partial<CityRow>;
        Relationships: [];
      };
      interests: {
        Row: InterestRow;
        Insert: Partial<InterestRow>;
        Update: Partial<InterestRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [Rel<'profiles_city_id_fkey', 'city_id', 'cities'>];
      };
      user_interests: {
        Row: { user_id: string; interest_id: number };
        Insert: { user_id: string; interest_id: number };
        Update: Partial<{ user_id: string; interest_id: number }>;
        Relationships: [
          Rel<'user_interests_user_id_fkey', 'user_id', 'profiles'>,
          Rel<'user_interests_interest_id_fkey', 'interest_id', 'interests'>,
        ];
      };
      communities: {
        Row: CommunityRow;
        Insert: Partial<CommunityRow> & { name: string; slug: string };
        Update: Partial<CommunityRow>;
        Relationships: [
          Rel<'communities_city_id_fkey', 'city_id', 'cities'>,
          Rel<'communities_owner_id_fkey', 'owner_id', 'profiles'>,
        ];
      };
      community_members: {
        Row: { community_id: string; user_id: string; role: MembershipRole; joined_at: string };
        Insert: { community_id: string; user_id: string; role?: MembershipRole };
        Update: Partial<{ role: MembershipRole }>;
        Relationships: [
          Rel<'community_members_community_id_fkey', 'community_id', 'communities'>,
          Rel<'community_members_user_id_fkey', 'user_id', 'profiles'>,
        ];
      };
      events: {
        Row: EventRow;
        Insert: Partial<EventRow> & { creator_id: string; title: string; starts_at: string };
        Update: Partial<EventRow>;
        Relationships: [
          Rel<'events_community_id_fkey', 'community_id', 'communities'>,
          Rel<'events_creator_id_fkey', 'creator_id', 'profiles'>,
          Rel<'events_city_id_fkey', 'city_id', 'cities'>,
        ];
      };
      event_participants: {
        Row: { event_id: string; user_id: string; joined_at: string };
        Insert: { event_id: string; user_id: string };
        Update: never;
        Relationships: [
          Rel<'event_participants_event_id_fkey', 'event_id', 'events'>,
          Rel<'event_participants_user_id_fkey', 'user_id', 'profiles'>,
        ];
      };
      activities: {
        Row: ActivityRow;
        Insert: Partial<ActivityRow> & { creator_id: string; text: string };
        Update: Partial<ActivityRow>;
        Relationships: [
          Rel<'activities_creator_id_fkey', 'creator_id', 'profiles'>,
          Rel<'activities_city_id_fkey', 'city_id', 'cities'>,
        ];
      };
      activity_participants: {
        Row: { activity_id: string; user_id: string; joined_at: string };
        Insert: { activity_id: string; user_id: string };
        Update: never;
        Relationships: [
          Rel<'activity_participants_activity_id_fkey', 'activity_id', 'activities'>,
          Rel<'activity_participants_user_id_fkey', 'user_id', 'profiles'>,
        ];
      };
      connections: {
        Row: ConnectionRow;
        Insert: { requester_id: string; addressee_id: string };
        Update: Partial<ConnectionRow>;
        Relationships: [
          Rel<'connections_requester_id_fkey', 'requester_id', 'profiles'>,
          Rel<'connections_addressee_id_fkey', 'addressee_id', 'profiles'>,
        ];
      };
      blocks: {
        Row: { blocker_id: string; blocked_id: string; created_at: string };
        Insert: { blocker_id: string; blocked_id: string };
        Update: never;
        Relationships: [
          Rel<'blocks_blocker_id_fkey', 'blocker_id', 'profiles'>,
          Rel<'blocks_blocked_id_fkey', 'blocked_id', 'profiles'>,
        ];
      };
      messages: {
        Row: MessageRow;
        Insert: { conversation_id: string; sender_id: string; content: string };
        Update: Partial<MessageRow>;
        Relationships: [Rel<'messages_sender_id_fkey', 'sender_id', 'profiles'>];
      };
      conversation_participants: {
        Row: { conversation_id: string; user_id: string; last_read_at: string | null; joined_at: string };
        Insert: never;
        Update: Partial<{ last_read_at: string }>;
        Relationships: [Rel<'conversation_participants_user_id_fkey', 'user_id', 'profiles'>];
      };
      notifications: {
        Row: NotificationRow;
        Insert: never;
        Update: Partial<Pick<NotificationRow, 'read_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      discover_people: {
        Args: {
          p_limit?: number;
          p_offset?: number;
          p_interest?: string | null;
          p_language?: string | null;
          p_looking_for?: string | null;
          p_min_age?: number | null;
          p_max_age?: number | null;
          p_gender?: Gender | null;
          p_max_km?: number | null;
        };
        Returns: DiscoverPersonRow[];
      };
      home_summary: {
        Args: Record<string, never>;
        Returns: { people_count: number; community_count: number; event_count: number; activity_count: number }[];
      };
      onboarding_summary: {
        Args: Record<string, never>;
        Returns: { people_count: number; community_count: number; event_count: number }[];
      };
      update_my_location: { Args: { p_lat: number | null; p_lng: number | null }; Returns: undefined };
      set_push_token: { Args: { p_token: string }; Returns: undefined };
      respond_connection: { Args: { p_connection_id: string; p_accept: boolean }; Returns: ConnectionRow };
      direct_conversation_with: { Args: { p_user_id: string }; Returns: string | null };
      my_conversations: { Args: Record<string, never>; Returns: ConversationSummaryRow[] };
      mark_conversation_read: { Args: { p_conversation_id: string }; Returns: undefined };
      report_target: {
        Args: {
          p_target_type: ReportTargetType;
          p_target_id: string;
          p_reason: string;
          p_details?: string | null;
          p_block_user?: boolean;
        };
        Returns: string;
      };
      touch_activity: { Args: Record<string, never>; Returns: undefined };
    };
    Enums: {
      gender: Gender;
      report_target_type: ReportTargetType;
    };
    CompositeTypes: Record<string, never>;
  };
};
