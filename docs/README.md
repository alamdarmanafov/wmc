# WMC — Developer Specification v1.0

**WMC · World Muslim Community** — *Find your people, wherever you are.*

A community platform for Muslims to discover people, activities and communities around them.
**Not a dating app.** Core loop: **Activities → People → Communities → Events.**

| # | Document | What it covers |
|---|----------|----------------|
| 01 | [Product overview](./01-product-overview.md) | Problem, positioning, audience, principles, MVP scope, KPIs |
| 02 | [Screens & UI spec](./02-screens.md) | Every screen, every button, navigation, empty/error states |
| 03 | [Database schema](./03-database.md) | Tables, columns, enums, indexes, triggers |
| 04 | [API & security](./04-api-and-rls.md) | Supabase RPCs, RLS rules, privacy model, storage, realtime |
| 05 | [Matching](./05-matching.md) | Scoring algorithm, distance buckets, filters |
| 06 | [Admin panel](./06-admin.md) | Roles, pages, actions, analytics, moderation workflow |
| 07 | [Brand & design](./07-brand.md) | Logo usage, colors, typography, tone, do/don't |
| 08 | [Landing page](./08-landing.md) | Section-by-section copy and structure |
| 09 | [Roadmap & launch](./09-roadmap.md) | Phases, city rollout, monetization later, out-of-scope |
| 10 | [AI master prompt](./10-master-prompt.md) | Ready-to-paste prompt for building features with an AI coding agent |

Repository map:

```
apps/mobile      Expo (React Native) app — iOS / Android
apps/web         Next.js — landing page + /admin panel
packages/shared  Brand tokens, constants, domain types shared by both apps
supabase/        Postgres migrations, RLS, RPCs, seed, Edge Function, smoke tests
docs/            This specification
icon.png         Master logo (1254×1254)
```
