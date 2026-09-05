# 05 · Matching algorithm

No AI in MVP. A transparent, additive score computed in `discover_people()` (`supabase/migrations/…0005_rpc.sql`) and mirrored by `MATCH_WEIGHTS` in `packages/shared`.

| Signal | Points |
|---|---|
| Same city | **+30** |
| Each shared interest | **+10** (max 40) |
| At least one shared language | **+15** |
| At least one shared "looking for" goal | **+20** |
| Age within 5 years | **+10** |
| **Maximum** | **115** |

`compatibility = round(score / 115 × 100)` is returned but the UI shows **shared interests** ("You both like Football & Travel", "3 interests in common"), never a "compatibility %" — that framing reads like dating.

## Candidate rules
- Same city as me (if I have no city, everyone).
- `status = active`, onboarding completed, not me.
- Excludes anyone blocked in either direction.
- Optional filters: interest slug, language, looking-for, age range, gender, max distance.
- Ordered by score desc, then `last_active_at` desc. Paginated (`limit/offset`).

## Distance
Computed with PostGIS on private coordinates and immediately reduced to a label — see doc 04. Distance never affects the score (city does), so users who hide location are not penalised.

## Later (not MVP)
- Activity affinity (people who joined the same events).
- Freshness boost for new users in the city ("new here too").
- Collaborative signals once there is data.
