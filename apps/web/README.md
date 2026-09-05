# @wmc/web — landing page

Public marketing site for World Muslim Community: `/`, `/privacy`, `/terms`,
`/guidelines` and the `POST /api/waitlist` endpoint. The admin panel lives in
[`apps/admin`](../admin) and is deployed separately.

## Environment
| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL (server-side only, for the waitlist API) |
| `SUPABASE_ANON_KEY` | Supabase anon key. `NEXT_PUBLIC_` variants are accepted too. No service-role key is ever used. |
| `NEXT_PUBLIC_SITE_URL` | Optional canonical URL for Open Graph metadata |

Without the Supabase variables the site still builds and renders; the waitlist API answers `{ ok: true, stored: false }`.

## Run
```bash
npm run web          # http://localhost:3000
```

## Deploy (Vercel)
Root Directory `apps/web`, Framework Next.js, the variables above.
