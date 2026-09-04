# 02 · Screens & UI specification (mobile)

Navigation: **bottom tabs** `Home · Discover · Communities · Events · Profile`. All other screens are stack pushes or modals.
Implementation: `apps/mobile/src/app/**` (expo-router). Design tokens: `packages/shared/src/brand.ts`.

Conventions: primary button = deep green pill; secondary = soft green; destructive = red text. Every list has pull-to-refresh, a skeleton loading state and an empty state with one CTA. Errors show a toast with the server message.

---

## A. Auth

### A1 Welcome `(auth)/welcome`
- Logo (`logo.png`), headline **Welcome 👋**, sub *Find your Muslim community wherever you are.*
- Buttons: **Continue with Apple** (iOS only) · **Continue with Google** · **Continue with email**
- Footer: "By continuing you agree to the Terms and Community Guidelines" (links to web).

### A2 Email `(auth)/email`
- Toggle Sign in / Sign up. Fields: first name (sign up only), email, password. Button **Continue**.
- Errors inline (invalid email, weak password, wrong credentials).

---

## B. Onboarding (shown once; `profiles.onboarding_completed = false`)

### B1 Location `(onboarding)/location`
- Title **Choose your location**
- **📍 Use my location** → OS permission → reverse-geocode → nearest active city → confirm sheet "You're in Berlin, right?" → also stores private coordinates via `update_my_location`.
- **🔎 Choose a city** → searchable list of active cities.
- Note: *Your exact location is never shown to other users.*
- Button **Continue** (enabled when city selected).

### B2 Profile `(onboarding)/profile`
- Avatar picker (camera / library → bucket `avatars/<uid>/avatar.jpg`).
- First name (required), Age (16–99), Bio (≤200), Languages (multi chips), Profession (optional), Gender (optional: male / female / prefer not to say).
- **Continue**.

### B3 Interests `(onboarding)/interests`
- Grid of chips from `INTERESTS` (emoji + label). Min 3, max 8. Counter "3 of 8 selected". **Continue**.

### B4 Looking for `(onboarding)/looking-for`
- Chips: New friends · Activities · Networking · Study groups · Local community (multi). **Continue**.

### B5 Results `(onboarding)/results`
- Big number card: **We found 12 people & 8 communities for you.** (RPC `onboarding_summary`)
- **Let's go** → sets `onboarding_completed = true`, requests push permission, → Home.

---

## C. Tabs

### C1 Home `(tabs)/index`
| Element | Behaviour |
|---|---|
| Header | Small logo mark · *Assalamu Alaikum, Ahmed 👋* · bell (unread badge) → Notifications |
| City pill | 📍 Berlin → tap opens city picker (changes `profiles.city_id`) |
| Hero card | *You are never alone.* Find communities, activities and friends near you. |
| **What do you want to do?** | Horizontal chips: ⚽ Play football · ☕ Grab coffee · 🏃 Go running · 💼 Network · 📖 Study · 🌆 Explore the city · 🤝 Volunteer → opens **Create "Join me"** with category prefilled |
| Near you | 4 counters from `home_summary`: 124 people · 18 communities · 7 events · 3 activities (each taps into its tab) |
| Join me (live) | Up to 5 open activities in the city, each with **Join** |
| Upcoming events | Up to 5 approved events, each with **Join** / "Joined" / "Full" |
| Recommended communities | Up to 5 approved communities, **Join** |

### C2 Discover · Meet People `(tabs)/discover`
- Search bar (name) + **Filter** button → sheet: Interest, Language, Looking for, Age range, Max distance (only if my location visibility ≠ hidden), Gender (optional).
- List of **PersonCard**: photo · *Ahmed, 27* · 📍 Berlin · 💼 Marketing · interest chips · *You both like Football & Travel* · distance label · connection button:
  - none → **Connect** (insert `connections`)
  - I sent → **Requested** (disabled; long-press → Withdraw)
  - they sent → **Accept** (RPC `respond_connection`)
  - accepted → **Message** (→ chat)
- Tap card → **User profile** (D1).
- Data: RPC `discover_people(limit, offset, filters…)`, paginated.

### C3 Communities `(tabs)/communities`
- Search + category chips (`COMMUNITY_CATEGORIES`).
- List of **CommunityCard**: image/emoji · name · 8.4K members · category · **Join / Joined**.
- **+ Create community** → form (name, description, category, image) → inserted with `status='pending'` → toast *Submitted for approval*.

### C4 Events `(tabs)/events`
- Segments: **Upcoming** · **My events** (joined or created).
- **EventCard**: image/gradient · title · 📅 Sat, Sep 14 · ⏰ 18:00 · 📍 Tempelhof · 👥 18 / 24 joined · *Hosted by Berlin Muslims* · **Join**.
- FAB **+** → Create event (D3).

### C5 Profile `(tabs)/profile`
- Avatar, name, age, city, bio, interest chips, "Looking for" chips.
- Stats row: communities · events · connections.
- Menu: Edit profile · Connections · Chats · Notifications & privacy · Blocked users · Community guidelines · Sign out.

---

## D. Detail & flow screens

### D1 User profile `/user/[id]`
Photo, name, age, city, profession, bio, languages, interests (mine highlighted), *3 interests in common*, distance label. Buttons per connection state (as C2). Overflow ⋯ → **Report** · **Block**.

### D2 Community `/community/[id]`
Header image · name · 328 members · description · **Join community / Leave** · sections: Upcoming events · Members (avatars, "+15") · About. Members see **+ Create event**. Owner/moderator sees **Edit**. ⋯ → Report.

### D3 Create event `/event/create`
Title (≤80) · Description · Category · Date · Time · Location name · Address · Max participants (optional) · Community (optional, my communities) · Image. **Publish** → event detail. City = my city; creator auto-joins; group chat auto-created (DB trigger).

### D4 Event `/event/[id]`
Hero · title · date/time · location · **Who's going?** avatars + count · **Join event / Leave / Full** · **Group chat** (participants only) · About · tags · *Hosted by* · ⋯ → Report; creator: Edit · Cancel.

### D5 Create "Join me" `/activity/create`
Large input, placeholder *Anyone wants to play football tonight?* (≤140) · category chips · optional time (today) · optional place · max people (default 10). **Post** → activity detail. Activity auto-expires after 24 h.

### D6 Activity `/activity/[id]`
Text · creator · time/place · participants · **Join / Leave** · **Group chat** · creator: **Close**. ⋯ → Report.

### D7 Connections `/connections`
Tabs: **Requests** (Accept / Decline) · **Connected** (→ Message). Badge count on Profile tab.

### D8 Chats `/chat` and `/chat/[id]`
Inbox from `my_conversations()`: avatar/title, last message, time, unread badge. Types: direct (name), event (event title), activity (activity text).
Thread: messages (mine right / theirs left, sender name in group chats), input, send. Realtime via Supabase channel. Long-press → Report message. Direct chat requires an accepted connection (server-enforced).

### D9 Notifications `/notifications`
List, newest first; unread highlighted; **Mark all read**. Tap deep-links via `data` (conversation / event / activity / user / community).

### D10 Settings `/settings`
- Notifications: toggles Connections · Events · Activities · Communities · Messages · Nearby.
- Privacy: Location visibility — *Show approximate distance* / *City only* / *Hidden* · **Delete my location data**.
- Blocked users list (Unblock).
- Account: Sign out · Delete account (opens support mail in MVP).

### D11 Report (modal) `/report?targetType=&targetId=`
Reasons: Harassment · Spam · Fake profile · Inappropriate content · Hate speech · Other · details · ☐ Also block this user (user targets). **Submit** → *Thanks. Our team will review this.*

---

## Push notification copy
| Trigger | Text |
|---|---|
| Connection request | *Ahmed wants to connect with you* |
| Connection accepted | *Ahmed accepted your connection request* |
| Someone joined my event | *5 people joined your event* (batched client-side: "Ahmed joined …") |
| Someone joined my activity | *Ahmed is in: "Anyone up for coffee?"* |
| Community approved in my city | *New Muslim community near you* |
| Event reminder | *Your event starts in 2 hours* |
| New message | *Ahmed: See you at 18:00* |
