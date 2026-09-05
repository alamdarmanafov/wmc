# WMC database (Supabase)

## Layout
```
config.toml                  local dev config (auth redirects, buckets, realtime)
migrations/0001 … 0008       enums → tables → functions/triggers → RLS → RPCs → storage/realtime → waitlist → cron jobs
seed.sql                     launch cities, interests, demo users, communities, events, activities, chats
functions/send-push          Edge Function: notifications → Expo push
tests/smoke.sql              behavioural test of RPCs, triggers and RLS as different users
```

## Local
```bash
npx supabase start
npx supabase db reset        # migrations + seed
npx supabase status          # URLs and keys for the apps
```

## Production — three ways to apply the schema
**A. SQL Editor (no tooling):** open Dashboard → SQL Editor, paste the whole `supabase/schema.sql` (all migrations bundled, regenerate with `npm run db:bundle`) and Run. Optionally run `seed.sql` afterwards for demo data.

**B. GitHub Action:** add repository secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF`; the workflow `.github/workflows/supabase-migrate.yml` then applies new migrations on every push to `main` (and manually via *Run workflow*, with an optional seed).

**C. CLI from your machine:**
```bash
npx supabase link --project-ref <ref>
npx supabase db push
npx supabase functions deploy send-push --no-verify-jwt
npx supabase secrets set WEBHOOK_SECRET=<random>
```
Then in the dashboard:
1. **Auth → Providers**: Google + Apple credentials; add redirect URLs `wmc://auth/callback` and your web origin.
2. **Database → Webhooks**: `notifications` INSERT → `https://<ref>.functions.supabase.co/send-push`, header `Authorization: Bearer <WEBHOOK_SECRET>`.
3. **Database → Extensions**: enable `pg_cron`, then run:
   ```sql
   select cron.schedule('wmc-event-reminders', '*/15 * * * *', $$select public.enqueue_event_reminders()$$);
   select cron.schedule('wmc-close-activities', '*/30 * * * *', $$select public.close_expired_activities()$$);
   ```
4. Make the first admin: `update public.profiles set role = 'admin' where id = '<your user id>';`

## Generating TypeScript types
`npm run db:types` writes `packages/shared/src/database.types.ts` from the local database (optional; the apps ship hand-written minimal types).
