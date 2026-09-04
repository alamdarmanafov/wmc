# WMC mobile (`@wmc/mobile`)

React Native app for **WMC — World Muslim Community** built with Expo SDK 57, expo-router, react-query and supabase-js. There is no custom backend: the app talks to Supabase directly and relies on the RLS policies, triggers and RPCs in `supabase/migrations`.

## Setup

```bash
# from the monorepo root
npm install
cp apps/mobile/.env.example apps/mobile/.env   # fill in your Supabase URL + anon key
npm run mobile                                  # expo start
```

Environment variables (read at bundle time, must be prefixed with `EXPO_PUBLIC_`):

| Variable | Description |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

Apply the database migrations and seed (`npm run db:reset` with a local Supabase) before signing in — the app expects the `cities`, `interests` tables and the RPCs from `supabase/migrations`.

## Auth configuration

- **Email / password** works out of the box. Enable "Confirm email" in Supabase Auth if you want verification; the sign-up screen handles both cases.
- **Google**: enable the Google provider in Supabase Auth and add the app's redirect URL to *Auth → URL configuration → Redirect URLs*. The app uses the `wmc` scheme, so the URL is `wmc://auth/callback` (in Expo Go it is `exp://<host>/--/auth/callback`; you can read the exact value from `authRedirectTo` in `src/lib/oauth.ts`).
- **Apple** (iOS only): enable the Apple provider in Supabase with your Services ID / team / key, and make sure the bundle id `app.wmc.mobile` has the *Sign in with Apple* capability. The button is rendered only on iOS; sign-in goes through `signInWithIdToken`.

## Project layout

```
src/
  app/            expo-router routes: (auth) · (onboarding) · (tabs) · detail screens · report modal
  components/     UI kit (src/components/ui) + cards + shared widgets
  lib/            supabase client, auth provider, typed data hooks, storage, notifications
  theme.ts        design tokens built on @wmc/shared brand colors
```

Route guarding lives in `src/app/_layout.tsx` (`Stack.Protected`): no session → `(auth)`, session without completed onboarding → `(onboarding)`, otherwise `(tabs)` plus the detail screens.

## Building

Native modules (Apple sign-in, notifications, location, image picker) require a development build — they do not run in Expo Go:

```bash
cd apps/mobile
npx expo prebuild            # optional, to inspect native projects
eas build --profile development --platform ios|android
```

Push notifications use `expo-notifications` + `getExpoPushTokenAsync`; add `extra.eas.projectId` to `app.json` once the project is linked to EAS so tokens can be issued in production builds.

## Type checking

```bash
npm run typecheck -w @wmc/mobile
```

`src/lib/database.types.ts` is a hand-written `Database` type covering the tables and RPCs the app uses. Regenerate with `npm run db:types` if you prefer generated types and adjust the import in `src/lib/supabase.ts`.
