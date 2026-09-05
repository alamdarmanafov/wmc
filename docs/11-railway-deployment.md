# 11 · Deploying on Railway (self-hosted Supabase + web)

Use this when a hosted Supabase project is not available. Everything in this repo keeps working unchanged: the apps still talk to the same Supabase APIs, they just point at your Railway URLs.

> Railway's Supabase template is community-maintained and its variable names can change. The names below are the standard Supabase self-host names (`docker/.env` in the Supabase repo) and are what the template exposes at the time of writing. If a name differs in your deployment, use the template's *Variables* tab as the source of truth.

## 1. Deploy the Supabase stack
1. Railway → **New Project** → **Deploy a template** → search **Supabase** (template by Railway: Postgres, Kong, Auth/GoTrue, PostgREST, Realtime, Storage, Postgres Meta, Studio). Deploy.
2. Wait until all services are green. Open the **Kong** service → *Settings → Networking* → **Generate Domain**. This public URL (e.g. `https://kong-production-xxxx.up.railway.app`) is your **Supabase API URL**.
3. Collect from the template's shared variables:
   - `ANON_KEY` → used by the apps
   - `SERVICE_ROLE_KEY` → server-side only (push service)
   - `JWT_SECRET`, `POSTGRES_PASSWORD`, `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` (Studio login)
4. On the **Auth** (GoTrue) service set:
   ```
   SITE_URL=https://<your-web-domain>
   ADDITIONAL_REDIRECT_URLS=wmc://auth/callback,exp://127.0.0.1:8081/--/auth/callback,https://<your-web-domain>/admin/auth/callback
   GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
   GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=…
   GOTRUE_EXTERNAL_GOOGLE_SECRET=…
   GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=https://<kong-domain>/auth/v1/callback
   GOTRUE_EXTERNAL_APPLE_ENABLED=true
   GOTRUE_EXTERNAL_APPLE_CLIENT_ID=…
   GOTRUE_EXTERNAL_APPLE_SECRET=…
   ```
   (Email/password works out of the box. Without SMTP set `GOTRUE_MAILER_AUTOCONFIRM=true` so sign-ups don't wait for a confirmation e-mail.)

## 2. Apply the schema
The Postgres service exposes a `DATABASE_URL` (or `POSTGRES_*` parts). From your machine:
```bash
npx supabase db push --db-url "postgresql://postgres:<POSTGRES_PASSWORD>@<postgres-host>:<port>/postgres"
psql "<same url>" -f supabase/seed.sql            # optional demo data
psql "<same url>" -f supabase/tests/smoke.sql     # optional: verify rules
```
The `supabase/postgres` image used by the template includes PostGIS, pg_trgm, pgcrypto, pg_net and pg_cron, so all migrations apply as-is.

Schedule the jobs (once):
```sql
create extension if not exists pg_cron;
select cron.schedule('wmc-event-reminders', '*/15 * * * *', $$select public.enqueue_event_reminders()$$);
select cron.schedule('wmc-close-activities', '*/30 * * * *', $$select public.close_expired_activities()$$);
```

Make the first admin:
```sql
update public.profiles set role = 'admin' where id = '<your user id>';
```

## 3. Deploy the web app (landing + admin)
1. Railway → the same project → **New Service → GitHub repo** → this repository. The root `Dockerfile` + `railway.json` are picked up automatically.
2. Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<kong-domain>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
   NEXT_PUBLIC_SITE_URL=https://<your-web-domain>
   ```
   (They are build-time args too; Railway passes service variables into the Docker build.)
3. Generate a domain for the service. `/` is the landing page, `/admin` the panel.

## 4. Push notifications (replaces the Edge Function)
The Railway template has no Edge Functions runtime, so use the tiny Node service in `services/push-webhook` instead. It receives the same webhook payload and calls the Expo Push API.
1. **New Service → GitHub repo**, set *Root Directory* to `services/push-webhook`.
2. Variables: `SUPABASE_URL=https://<kong-domain>`, `SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>`, `WEBHOOK_SECRET=<random string>`.
3. Generate a domain, then create the trigger in Postgres (pg_net is available):
   ```sql
   create extension if not exists pg_net;
   create or replace function public.notify_push_webhook()
   returns trigger language plpgsql security definer as $$
   begin
     perform net.http_post(
       url := 'https://<push-service-domain>/',
       headers := jsonb_build_object('content-type', 'application/json', 'authorization', 'Bearer <WEBHOOK_SECRET>'),
       body := jsonb_build_object('type', 'INSERT', 'table', 'notifications', 'record', to_jsonb(new))
     );
     return new;
   end $$;
   create trigger notifications_push after insert on public.notifications
     for each row execute function public.notify_push_webhook();
   ```

## 5. Mobile app
`apps/mobile/.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://<kong-domain>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
```

## Cost & operations
Expect roughly $15–30/month for the Supabase stack at MVP traffic (Postgres + 7 small services). You own backups: enable Railway volume backups for the Postgres service, and keep `POSTGRES_PASSWORD`, `JWT_SECRET` and the keys in a password manager — changing `JWT_SECRET` invalidates every session and both API keys. When a hosted Supabase project becomes available later, `supabase db push` to it and switch the two URL/key variables; no code changes.
