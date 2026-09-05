# 06 · Admin panel (`apps/web/src/app/admin`)

Roles: `profiles.role` — `user` (default) · `moderator` (read all, moderate content & reports) · `admin` (everything, user status/roles, cities). First admin: `update public.profiles set role = 'admin' where id = '<uuid>';`

Login: `/admin/login` (email/password or Google). Sessions handled by `@supabase/ssr`; `/admin/*` is protected in `src/proxy.ts`. Non-staff users see *Access denied*.

| Page | Data | Actions |
|---|---|---|
| **Dashboard** | `admin_dashboard_stats()` tiles: total users, active 7d/30d, new 7d/30d, communities (+pending), events (+upcoming/pending), connections, messages, pending reports, retention D7/D30. Chart: `admin_signups_by_day(30)` | — |
| **Users** | search by name, filter by status; detail page with interests, communities, events, reports, audit | Suspend · Ban · Reactivate (reason) · Verify · Change role (admin only) |
| **Communities** | tabs pending / approved / rejected | Approve · Reject · Feature · Edit · Delete · Create |
| **Events** | filters status/city/upcoming | Approve · Reject · Cancel · Feature · Delete |
| **Activities** | open "Join me" posts | Close · Delete |
| **Reports** | tabs by status; expands to show the reported profile/event/message/community/activity | Dismiss · Mark reviewed · Ban/suspend user · Delete content → sets `status`, `reviewed_by`, `reviewed_at`, `admin_note` |
| **Cities** | list | Add city (name, country, lat/lng, timezone) · toggle active |
| **Audit log** | `admin_audit_log` | — |

Every moderation action writes to `admin_audit_log` (via the admin RPCs or `admin_log`).

## Moderation workflow
1. Report arrives (`pending`) → dashboard counter.
2. Moderator opens it, sees the target and the reporter's note.
3. Outcome: **Dismiss** (no violation) · **Reviewed** (warning sent manually) · **Actioned** (content removed / user suspended or banned).
4. Repeat offenders: 2 actioned reports → suspend 7 days; 3 → ban (manual policy in MVP).
