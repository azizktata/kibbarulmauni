# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

**DB migrations (Drizzle + Turso):**
```bash
npx drizzle-kit generate   # Generate migration files from schema changes
npx drizzle-kit migrate    # Apply migrations to the Turso DB
npx drizzle-kit studio     # Open Drizzle Studio (DB browser)
```

**Required env vars** (create `.env.local`):
```
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_SECRET=          # NextAuth secret (generate with: openssl rand -base64 32)
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
YOUTUBE_API_KEY=      # Only needed when running playlist sync scripts
ADMIN_EMAIL=          # Email address allowed to upload audio/transcripts
```

**Playlist sync scripts** (run once, commit output — scholars are frozen/no longer uploading):
```bash
node scripts/sync-scholar-playlists.mjs  # Fetches all playlists per scholar → data/scholar-playlists.json
node scripts/sync-playlist-items.mjs     # Fetches video IDs for each playlist → data/playlists/{id}.json
node scripts/recategorize-playlists.mjs  # Re-assigns category labels on existing playlist data
```

## Architecture

Next.js 16 app (App Router, React 19) that serves as a browsable index for Islamic educational content. Content comes from a static JSON file; user progress is persisted in a Turso (libSQL) database via Drizzle ORM.

**RTL/Arabic-first:** The entire app is `<html lang="ar" dir="rtl">`. All layout, spacing, and flex/grid direction decisions must account for RTL rendering.

**Provider nesting (`app/layout.tsx`):** `SessionProvider → NotesProvider(isLoggedIn) → WatchedProvider(isLoggedIn)`. Both context providers receive `isLoggedIn` to skip API calls for unauthenticated users.

**Data layer (`lib/` + `data/`):**
- `data/kibbarulmauni.json` — the entire content tree: `Level[] → Subject[] → Course[] → Lesson[]`. Each lesson has a `title`, `url`, and optional `youtube` field.
- `lib/data.ts` — typed accessors (`getLevel`, `getSubject`, `getCourse`) and helpers (`countLevelLessons`, `extractScholars`).
- `lib/scholars.ts` — builds a `scholarsIndex` (Scholar[]) by parsing Arabic scholar names out of lesson titles using regex, then canonicalizing via `lib/scholarAliases.ts`.
- `lib/searchIndex.ts` — builds a flat `SearchEntry[]` from the full tree for use with `fuse.js` fuzzy search.
- `lib/constants.ts` — `LEVEL_COLORS` (one color theme per level, 8 total) and `ARABIC_DIGITS`.

**Auth & progress tracking:**
- `auth.ts` — NextAuth v5 with Google provider (JWT strategy). Upserts users into the DB on sign-in. Requires `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` env vars.
- `db/schema.ts` — Drizzle schema: `users`, `watched_lessons`, `recently_visited`, `note_folders`, and `notes` tables. Lesson keys use `"levelIdx:subjectIdx:courseIdx:lessonIdx"` format. `recently_visited` stores per-user lesson visits with optional `playbackPosition` (seconds) for cross-device resume.
- `db/index.ts` — Drizzle client via `@libsql/client` (Turso). Requires `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` env vars.
- `db/queries.ts` — all DB query functions (user upsert, watched lessons, profile, notes, folders, recently visited) called from API routes.
- `lib/watchedContext.tsx` — `WatchedProvider` / `useWatched` context. Fetches keys from `/api/progress`, posts toggles to `/api/watch`, uses `useOptimistic` for instant UI feedback.
- `lib/progress.ts` — pure functions (`courseProgress`, `subjectProgress`, `levelProgress`) that compute % watched from a `Set<string>` of watched keys.
- `lib/useRecentlyWatched.ts` — `useRecentlyWatched()` hook + `saveWatched()` for the "recently watched" section on the home page (max 3 entries). Supports both curriculum lessons (key: `"levelIdx:subjectIdx:courseIdx:lessonIdx"`) and YouTube playlist entries (key: `"playlist:PLxxxx:lessonIdx"`). For logged-in users, syncs to DB via `/api/recently-visited`; falls back to localStorage for guests. Deduplicates per-course for curriculum and per-playlist for playlists.
- `/api/recently-visited` — GET returns recent lesson entries (with `playbackPosition`); POST upserts a visit with optional playback position.
- `/api/profile` — GET/PATCH for user profile fields (`name`, `age`) stored in `db/queries.ts`.

**Lesson player:**
- `components/CoursePlayer.tsx` — main lesson player component; handles YouTube embed, lesson navigation, playback position save/restore, and ambient (fullscreen) mode.
- `components/AmbientPlayerOverlay.tsx` — fullscreen dark overlay rendered when ambient mode is active. Uses `react-resizable-panels` to show video + transcript + notes side-by-side on desktop; stacks vertically on mobile.
- `lib/useTranscriptLoader.ts` — hook used by `CoursePlayer` to fetch transcript data. Tries YouTube captions first (`?v=`), falls back to static file (`?file=`); aborts on lesson change.

**Transcripts:**
- `data/transcripts/` — static `.txt` files named `{levelIdx}-{subjectIdx}-{courseIdx}-{lessonIdx}.txt`. Format: `(M:SS) text` segments.
- `/api/transcript` — serves transcript segments. Accepts `?v={youtubeId}` (fetches live YouTube captions, Arabic then English fallback) or `?file={name}.txt` (reads from `data/transcripts/`). Returns `{ segments: TranscriptSegment[] }` with 24h cache headers.
- `components/TranscriptPanel.tsx` — renders segments as flowing inline text, auto-scrolls active segment (synced to `currentTime`) into view.
- `scripts/add-transcript.mjs` — utility to add a new transcript file.
- `components/TranscriptUploadButton.tsx` — admin-only UI to upload transcript `.txt` files (checks session email against hardcoded admin).

**Audio:**
- `data/audio/` — static `.mp3` files named `{levelIdx}-{subjectIdx}-{courseIdx}-{lessonIdx}.mp3`.
- `/api/audio` — GET serves/checks MP3 files (`?file=`, `?check=1`); POST uploads (admin-only, same hardcoded email gate). 24h cache headers.
- `components/AudioUploadButton.tsx` — admin-only UI to upload MP3 files; download button appears for all users when audio exists.

**Notes:**
- `db/schema.ts` — `note_folders` (hierarchical, `parentId` self-reference) and `notes` tables. Notes have `noteType` (`"concept"` | `"revision"`), optional `folderId` and `lessonKey`, and `isPinned`/`sortOrder` for ordering.
- `lib/notesContext.tsx` — `NotesProvider` / `useNotes` context. Fetches all notes+folders from `/api/notes` on mount; all mutations are optimistic. Tracks `activeLessonKey` / `activeFolderId` for the sidebar's lesson-scoped view. `Ctrl+Shift+N` opens the sidebar globally.
- `lib/notesSidebarContext.tsx` — `NotesSidebarContext` / `useNotesSidebar` — a narrower context used inside `NotesSidebar` to pass drag-and-drop and reorder callbacks without prop-drilling.
- `/api/notes` — CRUD for notes (GET list, POST create, PATCH/DELETE by `[id]`).
- `/api/notes/folders` — CRUD for folders (GET/POST, PATCH/DELETE by `[id]`).
- `/api/notes/search` — full-text search across note titles/content.
- `components/NotesSidePanel.tsx` / `NotesSidebar.tsx` — side panel UI; `NotesFab.tsx` — floating action button that opens the panel.
- `components/NoteEditor.tsx` / `NoteEditorBody.tsx` — rich note editor.
- `components/AmbientNotePanel.tsx` — inline note panel shown within the lesson player.

**Admin gating:** Both audio and transcript upload APIs check `session.user.email === "azizktata77@gmail.com"` directly (no DB role).

**Scholar links:**
- `lib/scholarWebsites.ts` — `SCHOLAR_WEBSITES` and `SCHOLAR_YOUTUBE` maps canonical scholar names to their official website and YouTube channel URLs. **Only add URLs explicitly provided by the user — never guess or construct URLs.**

**Utilities:**
- `lib/apiError.ts` — `apiError(ctx, err)` logs and returns a uniform `{ error: "internal" }` 500 response; use in all API route catch blocks.
- `lib/arabicUtils.ts` — `lessonWord(n)` returns the correct Arabic singular/dual/plural form of "lesson" (درس/درسان/دروس).

**YouTube Playlists:**
- `data/scholar-playlists.json` — map of canonical scholar name → `ScholarPlaylist[]` (playlistId, title, thumbnail, videoCount, category). Populated by `sync-scholar-playlists.mjs`.
- `data/playlists/{playlistId}.json` — per-playlist video list `{ videoId, title, position }[]`. Populated by `sync-playlist-items.mjs`.
- `data/playlist-ids.json` — flat array of all playlist IDs that have a corresponding file in `data/playlists/` (used to distinguish internal vs. external YouTube links).
- `components/ScholarPlaylistsSection.tsx` — grid of playlist cards grouped by category, shown on the scholar profile page.
- `components/ScholarProfileTabs.tsx` — tabs component on `/scholars/[name]` switching between the course list and the playlists section.
- `/playlist/[playlistId]` — static page that renders a playlist using `CoursePlayer`. Sorts by leading lesson number in titles when ≥60% of videos carry one; otherwise sorts by `position`.

**Routing:**
- `/` — home page (level list)
- `/level/[levelIdx]` — subjects in a level
- `/level/[levelIdx]/[subjectIdx]` — courses in a subject
- `/level/[levelIdx]/[subjectIdx]/[courseIdx]` — lesson list; `?lesson=N` selects active lesson
- `/scholars` — scholar index page
- `/scholars/[name]` — courses taught by a specific scholar (tabs: courses + YouTube playlists)
- `/playlist/[playlistId]` — YouTube playlist player (statically generated from `data/playlists/`)
- `/search` — fuzzy search across subjects, courses, and lessons
- `/about` — about page
- `/3` — experimental alternate landing page (not linked from the main nav)

**Key directories:**
- `app/` — App Router pages and layouts. `globals.css` contains the full Tailwind v4 + shadcn design token setup (CSS variables for colors, radius, etc.)
- `components/ui/` — shadcn/ui components
- `lib/` — all data access, search, and scholar logic

**UI stack:**
- Tailwind CSS v4 (config-less, PostCSS-based) with `tw-animate-css`
- shadcn/ui (`style: "base-vega"`, base color: neutral, CSS variables enabled)
- `@base-ui/react` for accessible primitives
- `lucide-react` for icons
- `fuse.js` for fuzzy search
- `react-markdown` for rendering note content
- `react-resizable-panels` for the resizable notes side panel

**Custom color tokens** (defined in `@theme inline` in `globals.css`, usable as Tailwind utilities like `bg-primary`, `text-gold`):
- `primary` → #193833 (dark green)
- `primary-dark` → #082e27
- `gold` → #F0BC53
- `warm-gray` → #CAC9C3
- `cream` → #F6F5F1 (also the light-mode `--background`)

**Fonts** (loaded via `next/font/google` in `app/layout.tsx`, set as CSS variables on `<html>`):
- `--font-cairo` — base body font, applied via the `font-cairo` Tailwind utility
- `--font-amiri` — Arabic serif for decorative headings, used inline: `style={{ fontFamily: "var(--font-amiri)" }}`
- `--font-aref-ruqaa` — calligraphic style, available for display use

**Adding shadcn components:** `npx shadcn add <component-name>`

**Path aliases:** `@/` maps to the project root (components → `@/components`, utils → `@/lib/utils`, etc.)

**Dark mode:** Class-based (`.dark` class), toggled via `@custom-variant dark (&:is(.dark *))` in globals.css. `components/ThemeToggle.tsx` handles the toggle — reads/writes `localStorage("theme")`, respects `prefers-color-scheme` on first load, and sets the class on `document.documentElement`.
