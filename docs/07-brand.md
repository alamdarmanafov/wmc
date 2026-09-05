# 07 · Brand & design

## Name
**WMC** — World Muslim Community. Use "WMC" as the product name, the full name as a descriptor underneath.
Before launch: check trademark, `wmc.app` / `joinwmc.com` domains and App Store / Play Store name availability — the acronym is generic and may already be taken.

## Taglines
- Primary: **Find your people, wherever you are.**
- Emotional: **You are never alone.**
- Landing hero: **New city? Find your people.**

## Logo
Master file: `icon.png` (1254×1254, rounded square, three figures forming a **W** on deep green).
Meaning: three people → community; the shared shape → connection; the W → World. No crescent, no mosque — deliberately global and premium.

| Asset | Path | Use |
|---|---|---|
| App icon (iOS) | `apps/mobile/assets/images/icon.png` | full-bleed square, flattened on `#0B4A3F` |
| Android adaptive | `android-icon-foreground.png` + `android-icon-background.png` | background colour `#0B4A3F` |
| Splash | `splash-icon.png` on `#0B4A3F` | |
| In-app mark | `apps/mobile/assets/images/logo.png` | welcome screen, Home header (28–36 px) |
| Web mark | `apps/web/public/logo.png` | navbar, footer, admin sidebar, login |
| Favicons | `apps/web/src/app/icon.png`, `apple-icon.png` | Next.js file conventions |
| Social preview | `apps/web/public/og.png` (1200×630) | Open Graph / Twitter |

Rules: minimum 24 px; keep clear space equal to ¼ of the icon width; never recolour, stretch, add effects or place on busy photos; on dark backgrounds use the icon as-is (it carries its own green tile).

Wordmark: **WMC** in Inter Bold/ExtraBold, tracking −2%; "World Muslim Community" in Inter Medium at ~45% size, gray-700.

## Colours (`packages/shared/src/brand.ts`)
| Token | Hex | Use |
|---|---|---|
| deepGreen | `#0B4A3F` | primary buttons, icon tile, active states |
| forest | `#0B3D35` | headings, footer, dark surfaces |
| green | `#1E5F52` | hover / secondary |
| softGreen | `#DCE9E3` | chips, secondary buttons, highlights |
| mintGreen | `#EEF5F1` | section backgrounds, cards |
| warmWhite | `#FAF9F5` | app & site background |
| cream | `#F7F3E8` | alternate sections |
| ink / black | `#111111` | body text |
| gray700 / 500 / 300 | `#4F5B58` / `#7B8582` / `#C9D1CE` | secondary text, borders |
| gold, terracotta | `#C9A961`, `#D47A4E` | sparingly, category accents |
| success / warning / danger | `#1F8A5B` / `#C9891B` / `#C0392B` | states |

Keep green as an accent, not a flood: mostly warm white surfaces, green for actions and identity.

## Typography
Inter (Latin), Manrope as an alternative; **IBM Plex Sans Arabic** as the Arabic companion. Scale: display 40 · h1 32 · h2 26 · h3 20 · body 16 · small 14 · caption 12. Generous line height (1.4–1.5).

## Components
Radius 16 (cards) / pill (buttons, chips). 1 px borders in gray-200 instead of heavy shadows. Emoji are allowed as category glyphs. Photos: rounded, warm, real people doing things — football, coffee, study — not stock "diverse crowd" shots.

## Voice
Warm, direct, short. Say "your people", "near you", "join". Never "matches", "swipe", "singles". Greeting: *Assalamu Alaikum, {name} 👋*.
