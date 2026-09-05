/**
 * Hand-written subset of the WMC schema used by the web app.
 * Keep in sync with supabase/migrations. Regenerate with `npm run db:types` when
 * the project grows; this file only needs to cover what the admin panel touches.
 */
import type {
  ActivityStatus,
  AdminStats,
  CommunityStatus,
  EventStatus,
  Gender,
  LocationVisibility,
  ReportStatus,
  ReportTargetType,
  UserRole,
  UserStatus,
} from "@wmc/shared";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

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

export type CountryRow = {
  id: number;
  code: string;
  name: string;
};

export type InterestRow = {
  id: number;
  slug: string;
  name: string;
  emoji: string | null;
  sort_order: number;
};

export type UserInterestRow = {
  user_id: string;
  interest_id: number;
};

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

export type CommunityMemberRow = {
  community_id: string;
  user_id: string;
  role: "member" | "moderator" | "owner";
  joined_at: string;
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

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
};

export type ReportRow = {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_note: string | null;
  created_at: string;
};

export type BlockRow = {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};

export type AuditLogRow = {
  id: number;
  admin_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: Json;
  created_at: string;
};

export type WaitlistRow = {
  id: string;
  email: string;
  city: string | null;
  created_at: string;
};

export type SignupsByDayRow = {
  day: string;
  signups: number;
  active: number;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, never, Partial<Pick<ProfileRow, "role" | "status" | "status_reason" | "is_verified">>>;
      cities: Table<
        CityRow,
        Pick<CityRow, "country_id" | "name" | "slug" | "lat" | "lng"> & Partial<Pick<CityRow, "timezone" | "is_active">>,
        Partial<Omit<CityRow, "id" | "created_at">>
      >;
      countries: Table<CountryRow, Pick<CountryRow, "code" | "name">, Partial<Pick<CountryRow, "name">>>;
      interests: Table<InterestRow, never, never>;
      user_interests: Table<UserInterestRow, never, never>;
      communities: Table<
        CommunityRow,
        Pick<CommunityRow, "name" | "slug"> &
          Partial<Pick<CommunityRow, "description" | "city_id" | "category" | "owner_id" | "status" | "is_featured">>,
        Partial<Pick<CommunityRow, "name" | "description" | "city_id" | "category" | "status" | "is_featured">>
      >;
      community_members: Table<CommunityMemberRow, Pick<CommunityMemberRow, "community_id" | "user_id"> & Partial<Pick<CommunityMemberRow, "role">>, never>;
      events: Table<EventRow, never, Partial<Pick<EventRow, "status" | "is_featured">>>;
      event_participants: Table<{ event_id: string; user_id: string; joined_at: string }, never, never>;
      activities: Table<ActivityRow, never, Partial<Pick<ActivityRow, "status">>>;
      messages: Table<MessageRow, never, Partial<Pick<MessageRow, "deleted_at">>>;
      reports: Table<ReportRow, never, Partial<Pick<ReportRow, "status" | "reviewed_by" | "reviewed_at" | "admin_note">>>;
      blocks: Table<BlockRow, never, never>;
      admin_audit_log: Table<AuditLogRow, never, never>;
      waitlist: Table<WaitlistRow, Pick<WaitlistRow, "email"> & Partial<Pick<WaitlistRow, "city">>, never>;
    };
    Views: Record<string, never>;
    Functions: {
      admin_dashboard_stats: { Args: Record<string, never>; Returns: AdminStats[] };
      admin_signups_by_day: { Args: { p_days?: number }; Returns: SignupsByDayRow[] };
      admin_set_user_status: {
        Args: { p_user_id: string; p_status: UserStatus; p_reason?: string | null };
        Returns: undefined;
      };
      admin_set_user_verified: { Args: { p_user_id: string; p_verified: boolean }; Returns: undefined };
      admin_log: {
        Args: { p_action: string; p_target_type: string; p_target_id: string; p_meta?: Json };
        Returns: undefined;
      };
    };
    Enums: {
      user_status: UserStatus;
      user_role: UserRole;
      community_status: CommunityStatus;
      event_status: EventStatus;
      activity_status: ActivityStatus;
      report_status: ReportStatus;
      report_target_type: ReportTargetType;
    };
    CompositeTypes: Record<string, never>;
  };
};
