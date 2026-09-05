<p align="center">
  <img src="apps/web/public/logo.png" width="96" alt="WMC logo" />
</p>

<h1 align="center">WMC — World Muslim Community</h1>
<p align="center"><strong>Find your people, wherever you are.</strong></p>

A community platform for Muslims to discover people, activities and communities around them.
**Not a dating app.** Activity-first, privacy-first. English UI, launching city by city (London first).

## What's in this repository

| Path | What | Stack |
|---|---|---|
| [`apps/mobile`](apps/mobile) | iOS / Android app: onboarding, Home, Meet People, Communities, Events, "Join me", chat, notifications, safety | Expo SDK 57 · expo-router · react-query · supabase-js |
| [`apps/web`](apps/web) | Landing page + legal pages + waitlist API | Next.js 16 · Tailwind v4 |
| [`apps/admin`](apps/admin) | Admin panel (users, communities, events, reports, cities, analytics) | Next.js 16 · Tailwind v4 · @supabase/ssr |
| [`packages/shared`](packages/shared) | Brand tokens, constants, domain types, utils used by both apps | TypeScript |
| [`supabase`](supabase) | Schema, triggers, RLS, RPCs (matching, inbox, admin stats), seed, Edge Function for push, smoke tests | Postgres 17 · PostGIS · pg_cron |
| [`docs`](docs) | **Developer Specification v1.0** — product, every screen, database, API/RLS, matching, admin, brand, landing, roadmap, AI master prompt | Markdown |
| `icon.png` | Master logo (1254×1254). All app/web icon variants are generated from it | |

## Quick start

```bash
npm install                      # installs all workspaces

# Database (needs Docker + Supabase CLI: npm i -g supabase)
npx supabase start               # local Postgres + Auth + Storage + Studio
npx supabase db reset            # applies supabase/migrations + seed.sql
# Demo accounts (password: Password123!): admin@wmc.app (admin), ahmed@wmc.app, aisha@wmc.app, omar@wmc.app, fatima@wmc.app, yusuf@wmc.app, sara@wmc.app

# Mobile
cp apps/mobile/.env.example apps/mobile/.env   # EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY
npm run mobile                   # expo start

# Web (landing + admin)
cp apps/web/.env.example apps/web/.env.local     # SUPABASE_URL / SUPABASE_ANON_KEY
cp apps/admin/.env.example apps/admin/.env.local # same two values
npm run web                      # landing at http://localhost:3000
npm run admin                    # admin panel (separate app)

# Checks
npm run typecheck                # all workspaces
npm run build:web
```

Verify the database rules: `psql <local db url> -f supabase/tests/smoke.sql` (see [supabase/tests](supabase/tests)).

## Architecture in one paragraph
There is no custom API server. Both apps talk to Supabase directly; every rule that matters — who can see whom, that chat needs an accepted connection, event capacity, blocks, pending approval for communities, the fact that exact location can never leave the database — is enforced in Postgres via RLS policies, triggers and security-definer RPCs (`supabase/migrations`). Matching is a transparent weighted score (`discover_people()`), not AI. Push notifications flow `notifications` → database webhook → Edge Function `send-push` → Expo.

## Brand
Deep green `#0B4A3F` on warm white `#FAF9F5`, Inter, rounded cards, lots of whitespace. The logo is three figures forming a **W** — people, connection, world. See [docs/07-brand.md](docs/07-brand.md).

## Deploying
- **Web + Admin**: two Vercel projects from this repo — Root Directory `apps/web` (site) and `apps/admin` (admin), Framework Next.js. Env for both: `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- **Backend**: hosted Supabase — apply the schema per `supabase/README.md`.

## Roadmap
Phases 1–6 (foundation → admin) are implemented here. Launch prep (store listings, OAuth credentials, EAS builds, pg_cron jobs, push webhook) is checklisted in [docs/09-roadmap.md](docs/09-roadmap.md). Monetization (WMC Plus, B2B) comes after product-market fit.
