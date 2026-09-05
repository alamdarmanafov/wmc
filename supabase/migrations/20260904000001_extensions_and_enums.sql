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
