# 09 · Roadmap, launch & business

## Build phases
| Phase | Scope | Status in this repo |
|---|---|---|
| 1 Foundation | auth, profile, location, interests, Home | ✅ schema, mobile screens |
| 2 Community | browse, join, community page, create (approval) | ✅ |
| 3 Events | create, join, capacity, group chat | ✅ |
| 4 Connection | discover, connect, 1-to-1 chat, "Join me" | ✅ |
| 5 Safety | report, block, moderation rules | ✅ |
| 6 Admin | users, communities, events, reports, analytics | ✅ web admin |
| 7 Launch prep | store listings, EAS builds, OAuth credentials, pg_cron, push webhook, legal pages | ⏳ (see checklists below) |

## Launch checklist
- [ ] Supabase project (EU region) · run migrations · set Google/Apple OAuth · enable pg_cron jobs · deploy `send-push` + database webhook
- [ ] EAS: bundle ids `app.wmc.mobile`, Apple Sign in capability, push credentials (APNs/FCM)
- [ ] Vercel for `apps/web` with env vars; domain + OG
- [ ] Seed London communities with 5–10 real partner organisations before opening sign-ups
- [ ] Trademark / store-name check for "WMC"

## City rollout
🇬🇧 London (big, international, students, expats) → 🇩🇪 Berlin → 🇦🇪 Dubai → 🇨🇦 Toronto → 🇺🇸 New York → 🇫🇷 Paris → 🇳🇱 Amsterdam → 🇹🇷 Istanbul → 🇦🇿 Baku.
A city opens when it has ≥ 5 approved communities and ≥ 3 upcoming events.

## Languages
English first. Then Arabic, Turkish, French, German, Indonesian, Urdu, Malay (the app already stores user languages; UI i18n is a later phase).

## Monetization (after product-market fit)
- **Free** for everyone at launch — the goal is community, not revenue.
- **WMC Plus** $2.99/month · $19.99/year: advanced discovery & filters, unlimited connections, private communities, profile customisation, event tools.
- **B2B**: business accounts for halal restaurants, brands, Islamic centres, universities and travel companies — promoted events and community sponsorship. Tables reserved for later: `subscriptions`, `payments`, `business_profiles`, `promoted_events`.

## Explicitly out of MVP
AI chatbot · Quran · prayer times · halal restaurant database · marketplace · payments · premium · complex recommendation AI.

## North-star
"Welcome to Paris 👋 — You already have 7 communities waiting for you." Digital infrastructure for Muslim communities worldwide.
