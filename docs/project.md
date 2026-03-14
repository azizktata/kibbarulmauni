# جامعة كبار العلماء — Project Documentation

## Overview

A web application for browsing and watching the full curriculum of **kibbarulmauni.com** — an online Islamic university following the Sharia College syllabus of Imam Muhammad ibn Saud Islamic University, with audio/video recordings by senior scholars.

The content is scraped once, stored as a static JSON file, and served through a fast Next.js static site — no database, no backend, no login required.

---

## Content Stats (as of March 2026)

| Entity   | Count |
|----------|-------|
| Levels   | 8     |
| Subjects | 81    |
| Courses  | 132   |
| Lessons  | 2,237 |

---

## Tech Stack

- **Framework**: Next.js 16 App Router (static export)
- **UI**: React 19, Tailwind CSS v4, shadcn/ui (base-vega)
- **Font**: Cairo (Google Fonts) — Arabic-first
- **Layout**: RTL (`dir="rtl"`, `lang="ar"`)
- **Data**: Static JSON (`data/kibbarulmauni.json`) — no DB
- **Scraper**: Node.js with `axios` + `cheerio`

---

## Data Structure

```
Level[]
  └─ Subject[]
       └─ Course[]
            └─ Lesson { title, url, youtube }
```

The scraper (`scripts/scrape.js`) traverses the site recursively — handling sections nested to any depth — and resolves YouTube embed URLs for each lesson file.

---

## Routing

| URL | Page |
|-----|------|
| `/` | Home — all 8 levels |
| `/level/[levelIdx]` | Level — all subjects |
| `/level/[levelIdx]/[subjectIdx]` | Subject — all courses |
| `/level/[levelIdx]/[subjectIdx]/[courseIdx]` | Course — video player + playlist |

---

## Phases

### Phase 0 — Data Extraction ✅
- Wrote `scripts/scrape.js` to crawl kibbarulmauni.com
- Handles arbitrary nesting depth (levels → subjects → courses → sub-sections → lessons)
- Extracts YouTube embed IDs and converts to watch URLs
- Polite crawl delay (300ms between requests)
- Outputs `data/kibbarulmauni.json` and `data/kibbarulmauni.md`
- `scripts/patch-missing.js` — targeted re-scrape for any courses with 0 lessons

---

### Phase 1 — Core UI (Browse & Watch) ✅
Static Next.js site with four pages:

**Home (`/`)** — Hero with stats pill (lessons/subjects/levels), 2×4 grid of level cards with color accents and Arabic digit badges.

**Level (`/level/N`)** — 3-column subject grid, each card shows title + course count + lesson count.

**Subject (`/level/N/M`)** — Vertical list of course cards. Each card shows: number badge, title, scholar names extracted from lesson titles (always prefixed "الشيخ"), lesson count badge.

**Course (`/level/N/M/K`)** — `CoursePlayer` client component:
- YouTube iframe (re-renders on lesson change via `key={ytId}`)
- Progress label in Arabic-Indic digits ("الدرس ١ من ١٥")
- Prev/Next navigation buttons
- Scrollable playlist sidebar with active highlight
- "مقررات أخرى" sibling course links below the player

Design system: 8 distinct color palettes (`LEVEL_COLORS`) — one per level — applied consistently across all pages (gradients, badges, active states).

---

### Phase 2 — Search & Discovery (Planned)
- Full-text search across all lessons, courses, and subjects
- Filter by level or subject
- Scholar index page — browse all content by a specific scholar
- Recently watched (localStorage)
- Quick-jump from home to any level/subject

---

### Phase 3 — Progress Tracking (Planned)
- Mark lessons as watched (localStorage or user account)
- Per-course and per-subject completion percentages
- Continue watching — resume from last position
- Visual progress rings on level/subject cards

---

### Phase 4 — User Accounts & Sync (Planned)
- Optional sign-in (email / Google)
- Progress synced to server (Supabase or PlanetScale)
- Bookmarks and notes per lesson
- Multi-device sync

---

### Phase 5 — Content Enhancements (Planned)
- Lesson transcripts / summaries (AI-generated)
- Download links for offline listening
- Related lessons recommendations
- Scholar profile pages with biography and full lesson list
- Shareable lesson links with Open Graph preview cards

---

### Phase 6 — Native App (Planned)
- React Native (Expo) app wrapping the same data layer
- Offline video caching
- Background audio playback
- Push notifications for new content

---

## Scripts

| Script | Purpose |
|--------|---------|
| `node scripts/scrape.js` | Full re-scrape of entire site |
| `node scripts/patch-missing.js` | Re-scrape only courses with 0 lessons |

## Dev

```bash
npm run dev     # start dev server on :3000
npm run build   # static export
npm run lint
```
