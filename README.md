# askqueen.

> The universe has spoken, babe.

AskQueen is a mobile-first entertainment site hosted by **Sabrina**, a fictional, sarcastic cosmic reader.
It is a fully static Next.js app built to run free on GitHub Pages: no server, no accounts, no API keys,
and no user data leaves the browser.

Source of truth: `ASKQUEEN_PRD_v0.1.md`, `ASKQUEEN_DEVELOPMENT_PLAN_v0.1.md` and the master development prompt.

## Status

| Milestone | Scope | State |
|---|---|---|
| 1 | Scaffold, design system, homepage, navigation, content types (AQ-001 to AQ-004) | Done |
| 2 | Ask Queen experience (AQ-005) | Done |
| 3 | Daily zodiac roast + music (AQ-006 to AQ-009) | Done |
| Extra | Sharing: exact-result links, Facebook, Instagram Story and square images, song player on shared pages | Done |
| 4 | Compatibility (+ its share cards, reusing the sharing pieces) | Next |
| 5 | Build verification, GitHub Actions, beta deploy | Planned |

Compatibility is switched off for the public beta: `features.compatibility = false` in
`src/lib/site.ts` hides it from the menu, homepage, footer, About, Privacy and Terms, and its page is parked in
`src/features/compatibility/CompatibilityPage.tsx` (the file explains how to turn it back on).

### Founder decisions
- Compatibility is for ages 16 and older (both people), checked from the full date of birth.
- Birthdays are never stored (no "remember me" in v0).
- Song links are Spotify search links.

### How Ask Queen works
`src/features/ask/` holds pure functions with no network calls and no storage:
1. `question.ts` checks the question is 5 to 250 characters long.
2. `classify.ts` matches keywords in this order:
   - Crisis (self-harm, danger, abuse): shows a real-world support message with no joke.
   - Serious (medical, legal, financial, cheating accusations): Sabrina steps out of character and says it's "not my department".
   - Unclear (keyboard mashes): asks the user to rephrase.
   - Topic: love life, work and study, friends, plans, money, or general.
3. `engine.ts` picks a pre-written answer from `src/data/ask-responses.ts` and never repeats the previous one.
4. `share.ts` builds the copy/share text. The question is left out unless the user ticks a box.

The classifier is keyword-based and English-only. The page says so and doesn't claim to understand arbitrary questions.

### How the Daily roast works
`src/features/daily/` holds pure functions with no storage:
1. `zodiac.ts` validates the day, month and year fields (impossible dates, 29 February outside leap years, future dates, years before 1900) and maps month/day to a sun sign using the conventional table in `src/data/signs.ts`.
2. `date.ts` uses the user's local calendar date (`YYYY-MM-DD`), so a new reading starts at their midnight.
3. `reading.ts` picks everything from sign + birthday (month and day only) + date:
   - **Roast:** each sign has 21 roasts. A person sees them in their own shuffled order, a new order every 21 days, and never the same one two days running. Two people with the same sign usually get different roasts on the same day.
   - **Song:** must share the roast's theme, then match the user's genres. Every theme-and-genre pair has at least 3 songs. Earlier days are replayed in memory from 1 January 2026, so a song isn't repeated within 14 days unless every fitting song was just played (about 3% of days for niche genres).
   - **Extras:** Sabrina's advice (matched to the theme), Lucky today and Avoid today. Each rotates per person without back-to-back repeats.
   - **Intensity** (Gentle/Savage/Unhinged) only selects the wording. It never changes the roast, song or extras.
4. `share.ts` builds the copy text. It never includes the name, birth date or genres.

Content lives in `src/data/`:
- `roasts/` holds 252 roasts × 3 intensities = 756 lines. The `*-more.ts` files hold the second and third rotations.
- `songs.ts` holds 213 real songs (metadata only). Spotify search links are built from title and artist.
- `spotify-tracks.ts` holds a verified Spotify track ID for every song, used by Spotify's official embedded player. The player loads only after the user presses "Listen to a preview".
- `themes.ts` holds the 8 themes with 7 "why this song" lines each.
- `daily-extras.ts` holds 48 advice lines plus 40 lucky and 40 avoid items.

### How sharing works

- **Links** go to `/share/?t=daily&...` or `/share/?t=ask&...`. They carry the result (sign, reading date,
  roast id, intensity, song id and small indices for the song reason and extras), never the inputs: no
  name, birthday, music choices or Ask question. `parseShare` checks every value against AskQueen's own
  content, so a link can only ever show text AskQueen wrote. Bad or tampered links show a "vanished" page.
- **Facebook** opens Facebook's sharer with the link. Its preview card is the site-wide image
  (`public/og-image.png`): a static site can't make a different preview per result.
- **Instagram Story** (1080×1920) and **Square image** (1080×1080) are drawn on a canvas in the browser
  (`src/features/share/card.ts`). On phones the Story image goes to the share sheet, where people pick
  Instagram; elsewhere it downloads. Websites can't attach music to Instagram, so the panel suggests
  adding the song with Instagram's Music sticker.
- **Shared Daily pages** include the same click-to-load Spotify preview as the Daily page.
- Crisis replies and "try again" replies in Ask have no share options.

## Run it locally

Requires Node.js 20.9 or newer (tested on Node 22).

```bash
npm install
npm run dev          # http://localhost:3000  (served at the root path)
```

### Preview the GitHub Pages build

```bash
npm run build:pages  # static export to out/ with basePath /askqueen
mkdir -p /tmp/ghp && rm -rf /tmp/ghp/askqueen && cp -r out /tmp/ghp/askqueen
npx serve /tmp/ghp   # open http://localhost:3000/askqueen/
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at `/` |
| `npm run build` | Static export to `out/` at the root path |
| `npm run build:pages` | Static export with `basePath=/askqueen` for GitHub Pages |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint (Next.js core web vitals + TypeScript rules) |
| `npm test` | Unit tests (Vitest) |
| `npm run verify` | All of the above, ending with the Pages build |

## Deploying

Every push to `main` runs `.github/workflows/deploy.yml`: it installs, runs `npm run verify` (typecheck,
lint, tests, Pages build) and publishes `out/` to GitHub Pages at `https://OWNER.github.io/REPO/`. It sets
`PAGES_BASE_PATH` from the repository name and `SITE_URL` from the owner, so link previews work. If any check
fails, nothing is published. One-time setup: repository Settings → Pages → Source: GitHub Actions.

## GitHub Pages configuration

`next.config.ts` sets `output: "export"`, `trailingSlash: true` and `images.unoptimized: true`.
When `GITHUB_PAGES=true`, `basePath` becomes `/askqueen`. If the repository has another name
(the dev plan mentions `askqueen-web`), set `PAGES_BASE_PATH=/askqueen-web`. The Milestone 5 workflow will
pass the repository name in automatically. `public/.nojekyll` is copied into `out/` so GitHub Pages
serves the `_next/` folder. The `not-found` page is exported as `out/404.html`, which GitHub Pages uses
for unknown URLs.

Set `SITE_URL` (for example `https://yourname.github.io`) when building for the real site. Link
previews on Facebook and elsewhere need a full image address, so the preview image tags are only added
when `SITE_URL` is set.

## Project structure

```
src/
  app/                 routes: / ask daily compatibility about privacy terms + 404
  components/          SiteHeader, SiteFooter, ArcanaCard, CrystalBall, Glyphs, OpeningSoon
  features/ask/        Ask Queen engine + AskExperience UI
  features/daily/      zodiac, date, reading engine, share text + DailyExperience UI
  data/                ask-responses.ts, signs.ts, themes.ts, songs.ts, roasts/
  lib/                 site config, content validators
  types/content.ts     editorial data contracts (AQ-004)
tests/                 Vitest unit tests
public/.nojekyll
```

## Design system

| Token | Hex | Use |
|---|---|---|
| `plum` | `#302033` | Text, night-sky hero, footer |
| `cream` | `#FFF4DF` | Page background, text on dark |
| `burgundy` | `#811D35` | Primary actions, headings |
| `blush` | `#EAB5C5` | Soft surfaces, highlights |
| `gold` | `#C9A467` | Linework and ornaments only (too low-contrast for text on cream) |

Type: **Gloock** (display) and **Instrument Sans** (body), both SIL Open Font License and self-hosted via
`@fontsource`, so no requests go to Google Fonts. The shape language is the arch (vintage window or
tarot card). The crystal ball and glyphs are original SVGs. Motion is limited to the hero crystal ball
and is switched off when `prefers-reduced-motion` is set.

## Privacy rules for contributors

- Never persist birthdates, names, question text or sexual orientation (no database, URL, analytics or browser storage). A unit test fails if any app code uses localStorage, sessionStorage, cookies, IndexedDB or history state.
- Content contracts in `src/types/content.ts` must not contain user data.
- No API keys or secrets in this repository. Everything here is public.
