# WMC Admin

Moderation and analytics panel for World Muslim Community. Separate Next.js app,
deployed on its own domain (e.g. `admin.wmc.app`).

## Environment
```
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_ANON_KEY=<anon public key>
```
(`NEXT_PUBLIC_` variants are accepted too. Never a service-role key — access is
granted by RLS to users whose `profiles.role` is `admin` or `moderator`.)

## Run
```bash
npm run admin            # http://localhost:3000
```

## Deploy (Vercel)
New project from this repo → Root Directory `apps/admin` → Framework Next.js →
the two variables above → deploy. Add the deployment URL to Supabase →
Authentication → URL Configuration → Redirect URLs as `https://<domain>/auth/callback`.

## First admin
```sql
update public.profiles set role = 'admin', onboarding_completed = true
where id = (select id from auth.users where email = 'you@example.com');
```
