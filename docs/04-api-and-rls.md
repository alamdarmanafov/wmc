# 04 · API, security & privacy

There is **no custom backend**. Clients use `supabase-js` directly; business rules are enforced by Postgres **RLS policies, triggers and security-definer RPCs**. Anything the apps must not be able to do is impossible at the database layer, regardless of client code.

## Environment
| App | Variables |
|---|---|
| Mobile | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| Web | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Edge Function `send-push` | `SUPABASE_SERVICE_ROLE_KEY` (set automatically), `WEBHOOK_SECRET` |

The service-role key is never shipped to a client.

## RPC catalogue (`supabase.rpc(name, params)`)
| Function | Who | Purpose |
|---|---|---|
| `discover_people(p_limit, p_offset, p_interest, p_language, p_looking_for, p_min_age, p_max_age, p_gender, p_max_km)` | user | Matching feed, see doc 05. Returns privacy-safe rows incl. `distance_label`, `shared_*`, `connection_status`. |
| `home_summary()` | user | `{people_count, community_count, event_count, activity_count}` for my city |
| `onboarding_summary()` | user | "We found N people & M communities" |
| `update_my_location(p_lat, p_lng)` | user | Writes private coordinates (nulls clear them). Never readable back. |
| `set_push_token(p_token)` | user | Stores Expo push token privately |
| `touch_activity()` | user | Heartbeat: `last_active_at` + daily activity row (retention) |
| `respond_connection(p_connection_id, p_accept)` | addressee | Accept/decline; accept auto-creates the direct conversation |
| `direct_conversation_with(p_user_id)` | user | Conversation id with a connected user (or null) |
| `my_conversations()` | user | Inbox with title, image, last message, unread count |
| `mark_conversation_read(p_conversation_id)` | user | Updates `last_read_at` |
| `report_target(p_target_type, p_target_id, p_reason, p_details, p_block_user)` | user | Creates a report; optionally blocks a user in the same call |
| `admin_dashboard_stats()` | moderator+ | Totals, actives, pending counts, D7/D30 retention |
| `admin_signups_by_day(p_days)` | moderator+ | Chart series |
| `admin_set_user_status(p_user_id, p_status, p_reason)` | admin | Ban / suspend / reactivate (audited) |
| `admin_set_user_verified(p_user_id, p_verified)` | admin | Verified badge (audited) |
| `admin_log(p_action, p_target_type, p_target_id, p_meta)` | moderator+ | Write an audit entry from the admin UI |

Everything else is plain table access under RLS: `select/insert/update/delete` on `profiles`, `user_interests`, `communities`, `community_members`, `events`, `event_participants`, `activities`, `activity_participants`, `connections`, `messages`, `blocks`, `notifications`, `reports`, `cities`, `interests`.

## RLS summary
| Table | Read | Write |
|---|---|---|
| profiles | own row; active users see other **active** users unless blocked either way; moderators all | own row only, and **cannot change `role` or `status`**; admins any |
| profile_private | nobody | nobody (RPCs only) |
| communities | approved, or own pending, or moderator | create → forced `pending`, owner = me; owner/moderator edit; only moderators change `status`/`is_featured` |
| community_members | active users | join self as `member`; leave self; community admins manage |
| events | approved, or own, or moderator | create as me (member of the chosen community); creator/moderator edit; `is_featured` moderators only |
| event_participants | active users | join/leave self (capacity enforced by trigger) |
| activities | active users, hiding blocked creators | create as me; creator/moderator edit |
| connections | requester or addressee | insert as requester; addressee updates pending → accepted/declined; either side deletes |
| conversations / participants | participants; moderators | read marker on own row; leave |
| messages | participants (hiding blocked senders); moderators | send as self (trigger enforces membership + connection) |
| blocks | own; moderators read | own |
| reports | own; moderators all | create own (`pending`); moderators manage |
| notifications | own | mark read / delete own |
| cities / countries / interests | everyone (anon too) | admins |
| waitlist | admins | anon insert |
| admin_audit_log | admins | admins |

## Privacy model
- Exact coordinates live only in `profile_private`. The API cannot read the table (RLS with no policies and revoked privileges — verified in `supabase/tests/smoke.sql`).
- Other users see a **bucketed label** computed server-side: *Near you* (≤1 km) · *~2 km away* · *~5 km away* · *~10 km away* · *In your city*. The distance is only computed when **both** users allow it (`location_visibility = 'approximate'`).
- `city_only` shows just the city; `hidden` also removes the user from distance filters.
- "Delete my location data" = `update_my_location(null, null)`.

## Safety model
- Report on user / event / message / community / activity with fixed reasons.
- Block: removes any connection, hides both profiles from each other, prevents messages, requests and activity visibility.
- Suspended/banned users lose read access to other people's data (`is_active_user()` gate) and cannot write.
- 20 connection requests per 24 h per user.

## Realtime
```ts
supabase.channel(`conv:${id}`)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, cb)
  .subscribe();
```
RLS also applies to realtime — only participants receive events.

## Push
`notifications` INSERT → Database Webhook → Edge Function `send-push` → Expo Push API. Preferences (`profiles.notification_prefs`) are checked both in SQL (message/community fan-out) and in the function.
