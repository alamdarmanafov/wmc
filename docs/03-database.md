# 03 · Database schema (Supabase / PostgreSQL)

Source of truth: `supabase/migrations/*.sql`. Types mirrored in `packages/shared/src/types.ts`.
Conventions: `uuid` primary keys (`gen_random_uuid()`), `timestamptz`, snake_case, counters maintained by triggers, PostGIS for geography.

## Enums
| Enum | Values |
|---|---|
| `user_status` | active · suspended · banned |
| `user_role` | user · moderator · admin |
| `gender` | male · female · prefer_not_to_say |
| `location_visibility` | city_only · approximate · hidden |
| `community_status` | pending · approved · rejected |
| `membership_role` | member · moderator · owner |
| `event_status` | pending · approved · cancelled · rejected |
| `activity_status` | open · closed · cancelled |
| `connection_status` | pending · accepted · declined |
| `conversation_type` | direct · event · activity |
| `report_target_type` | user · event · message · community · activity |
| `report_status` | pending · reviewed · actioned · dismissed |
| `notification_type` | connection_request · connection_accepted · event_joined · event_reminder · activity_joined · new_community · nearby_people · message · system |

## Tables

### Reference
- **countries** `id, code(ISO-2), name`
- **cities** `id, country_id, name, slug, lat, lng, timezone, is_active` — launch cities are seeded; admins add more.
- **interests** `id, slug, name, emoji, sort_order` — mirrors `INTERESTS` in shared constants.

### People
- **profiles** (1:1 with `auth.users`, created by trigger `on_auth_user_created`)
  `id, first_name, photo_url, age, gender, city_id, bio(≤200), languages text[], looking_for text[], profession, location_visibility, role, status, status_reason, is_verified, onboarding_completed, notification_prefs jsonb, last_active_at, created_at, updated_at`
- **profile_private** — *never readable through the API* (RLS enabled, zero policies, privileges revoked)
  `user_id, location geography(Point), location_updated_at, push_token, updated_at`
- **user_interests** `user_id, interest_id` (PK pair)
- **user_daily_activity** `user_id, day` — written by `touch_activity()`; powers retention.

### Communities
- **communities** `id, name, slug, description, city_id, category, image_url, owner_id, parent_id (sub-community), status, is_featured, member_count, created_at, updated_at`
- **community_members** `community_id, user_id, role, joined_at`

### Events
- **events** `id, community_id?, creator_id, title(3–80), description, category, image_url, starts_at, ends_at?, location_name, location_address, city_id, location geography?, max_participants?, participant_count, status, is_featured, conversation_id, created_at, updated_at`
- **event_participants** `event_id, user_id, joined_at`
- **event_reminders_sent** `event_id, user_id, sent_at` — idempotency for the 2-hour reminder job.

### "Join me" activities
- **activities** `id, creator_id, city_id, community_id?, text(3–140), category, happens_at?, location_name?, max_participants?, participant_count, status, expires_at (default +24h), conversation_id, created_at`
- **activity_participants** `activity_id, user_id, joined_at`

### Connections & chat
- **connections** `id, requester_id, addressee_id, status, created_at, responded_at` — unique per unordered pair.
- **conversations** `id, type, event_id?, activity_id?, last_message_at, created_at`
- **conversation_participants** `conversation_id, user_id, last_read_at, joined_at`
- **messages** `id, conversation_id, sender_id, content(1–2000), created_at, deleted_at`

### Safety & ops
- **blocks** `blocker_id, blocked_id, created_at`
- **reports** `id, reporter_id, target_type, target_id, reason, details, status, reviewed_by, reviewed_at, admin_note, created_at`
- **notifications** `id, user_id, type, title, body, data jsonb, read_at, created_at`
- **admin_audit_log** `id, admin_id, action, target_type, target_id, meta, created_at`
- **waitlist** `id, email, city, created_at` (landing page)

## Triggers (business rules live in the database)
| Trigger | Rule |
|---|---|
| `on_auth_user_created` | creates `profiles` + `profile_private` rows from auth metadata |
| `community_after_insert` | owner becomes `owner` member |
| `community_members_count` | maintains `member_count` |
| `communities_after_update` | on approval → `new_community` notification to active users in the city |
| `event_after_insert` | creates event group conversation, creator auto-joins |
| `event_participants_manage` | rejects join when not approved or full; maintains count; adds/removes chat membership; notifies creator |
| `activity_after_insert` / `activity_participants_manage` | same pattern for "Join me" |
| `connections_before_insert` | blocks if either user blocked the other; 20 requests / 24 h limit; forces `pending` |
| `connections_after_insert` | `connection_request` notification |
| `connections_after_update` | on accept → creates direct conversation + `connection_accepted` notification |
| `blocks_after_insert` | deletes any connection between the two users |
| `messages_before_insert` | sender must be a participant; direct chats require accepted connection and no block |
| `messages_after_insert` | updates `last_message_at`; `message` notification to other participants (respecting prefs and blocks) |

## Scheduled jobs (pg_cron)
- `enqueue_event_reminders()` every 15 min — "Your event starts in 2 hours".
- `close_expired_activities()` every 30 min — closes "Join me" posts after `expires_at`.

## Storage buckets
`avatars`, `community`, `events` — public read; users write only inside `<bucket>/<their uid>/…`; 5 MB; jpeg/png/webp.

## Realtime
Publication `supabase_realtime` includes `messages`, `notifications`, `activities`.
