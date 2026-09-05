# 10 · Master prompt for AI-assisted development

Paste this at the start of a session with an AI coding agent working in this repository.

```
You are working in the WMC (World Muslim Community) monorepo.

Product: a community platform for Muslims to discover people, activities and communities in their city.
NOT a dating app. Activity-first. Privacy-first. Tone: warm, minimal, premium (Apple/Airbnb/Notion).

Stack
- apps/mobile: Expo SDK 57, expo-router (src/app), TypeScript strict, @tanstack/react-query, supabase-js.
- apps/web: Next.js 16 App Router, Tailwind v4, @supabase/ssr. Landing page at "/", admin at "/admin".
- packages/shared: brand tokens (colors), constants (INTERESTS, LOOKING_FOR, COMMUNITY_CATEGORIES,
  REPORT_REASONS, LANGUAGES, LAUNCH_CITIES, MATCH_WEIGHTS, LIMITS), domain types, utils. Import from '@wmc/shared'.
- supabase/: migrations are the source of truth for schema, triggers, RLS and RPCs. No custom backend.

Rules
1. Business rules live in Postgres (triggers/RLS/RPC). Never trust the client; never use the service-role key in apps.
2. Exact location is private (profile_private). Only server-computed labels ("Near you", "~2 km away") reach clients.
3. Chat requires an accepted connection. Report + block must exist on every user-generated object.
4. Communities created by users are 'pending' until an admin approves. Users cannot change role/status/is_featured.
5. Read docs/02-screens.md before building a screen; docs/04-api-and-rls.md before touching data access.
6. Every change must pass: npm run typecheck (all workspaces), npm run build -w @wmc/web,
   and, for SQL, supabase db reset + psql -f supabase/tests/smoke.sql.
7. Keep components small, no `any`, no dead code, English UI copy from the docs.
8. Use the logo assets that already exist (icon.png master; apps/*/… variants). Never add crescent/mosque icons.

When asked for a feature: (a) check schema/RPC support, add a migration if needed, (b) add typed hooks,
(c) build the screen/page from the spec, (d) run the checks, (e) summarise what changed and how it was verified.
```
