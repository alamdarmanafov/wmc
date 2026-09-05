# @wmc/web — landing page + admin panel

Next.js 16 (App Router, TypeScript, Tailwind v4) app for **WMC — World Muslim Community**.

- `/` — public marketing landing page (+ `/privacy`, `/terms`, `/guidelines`)
- `/api/waitlist` — POST `{ email, city? }` → inserts into `public.waitlist`
- `/admin/*` — moderation panel for users with `profiles.role in ('admin','moderator')`

## Setup

```bash
cp apps/web/.env.example apps/web/.env.local   # fill in your Supabase URL + anon key
npm install                                     # from the monorepo root
npm run web                                     # http://localhost:3000
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key. Admin access comes from RLS + the signed-in user's role; **no service-role key is ever used.** |
| `NEXT_PUBLIC_SITE_URL` | Optional. Canonical URL for Open Graph metadata. |

Without the Supabase variables the landing page still builds and renders; admin pages show a "Supabase is not configured" notice and the waitlist API answers `{ ok: true, stored: false }`.

## Making the first admin

1. Sign up once through the mobile app or the Supabase Auth dashboard (email/password or Google).
2. In the Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where id = '<auth.users.id>';
```

3. Visit `/admin/login`. Moderators (`role = 'moderator'`) get read access plus approve/reject actions; only admins can ban/suspend users, change roles, delete content, manage cities and read the audit log.

For "Continue with Google", enable the Google provider in Supabase Auth and add `https://<your-domain>/admin/auth/callback` (and the localhost equivalent) to the redirect allow-list.

## Checks

```bash
npm run typecheck -w @wmc/web
npm run lint -w @wmc/web
npm run build -w @wmc/web
```

## Deploy to Vercel

1. Import the repository; set **Root Directory** to `apps/web` (Vercel detects the npm workspace automatically).
2. Add the environment variables above.
3. Deploy. `src/proxy.ts` runs on the edge for `/admin/*` to refresh sessions and redirect anonymous visitors to `/admin/login`.

Apply the database migrations first: `npm run db:push` from the monorepo root (includes `20260904000007_waitlist.sql`).
