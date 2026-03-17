# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

Next.js 16 app (App Router, React 19) that serves as a browsable index for Islamic educational content. Content comes from a static JSON file; user progress is persisted in a Turso (libSQL) database via Drizzle ORM.

**Data layer (`lib/` + `data/`):**
- `data/kibbarulmauni.json` — the entire content tree: `Level[] → Subject[] → Course[] → Lesson[]`. Each lesson has a `title`, `url`, and optional `youtube` field.
- `lib/data.ts` — typed accessors (`getLevel`, `getSubject`, `getCourse`) and helpers (`countLevelLessons`, `extractScholars`).
- `lib/scholars.ts` — builds a `scholarsIndex` (Scholar[]) by parsing Arabic scholar names out of lesson titles using regex, then canonicalizing via `lib/scholarAliases.ts`.
- `lib/searchIndex.ts` — builds a flat `SearchEntry[]` from the full tree for use with `fuse.js` fuzzy search.
- `lib/constants.ts` — `LEVEL_COLORS` (one color theme per level, 8 total) and `ARABIC_DIGITS`.

**Auth & progress tracking:**
- `auth.ts` — NextAuth v5 with Google provider (JWT strategy). Upserts users into the DB on sign-in. Requires `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` env vars.
- `db/schema.ts` — Drizzle schema: `users`, `watched_lessons`, `note_folders`, and `notes` tables. Lesson keys use `"levelIdx:subjectIdx:courseIdx:lessonIdx"` format.
- `db/index.ts` — Drizzle client via `@libsql/client` (Turso). Requires `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` env vars.
- `db/queries.ts` — all DB query functions (user upsert, watched lessons, profile, notes, folders) called from API routes.
- `lib/watchedContext.tsx` — `WatchedProvider` / `useWatched` context. Fetches keys from `/api/progress`, posts toggles to `/api/watch`, uses `useOptimistic` for instant UI feedback.
- `lib/progress.ts` — pure functions (`courseProgress`, `subjectProgress`, `levelProgress`) that compute % watched from a `Set<string>` of watched keys.
- `lib/useRecentlyWatched.ts` — localStorage hook (`useRecentlyWatched`) + `saveWatched()` for the "recently watched" section on the home page (max 6 entries, keyed by course).
- `/api/profile` — GET/PATCH for user profile fields (`name`, `age`) stored in `db/queries.ts`.

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
- `/api/notes` — CRUD for notes (GET list, POST create, PATCH/DELETE by `[id]`).
- `/api/notes/folders` — CRUD for folders (GET/POST, PATCH/DELETE by `[id]`).
- `/api/notes/search` — full-text search across note titles/content.
- `components/NotesSidePanel.tsx` / `NotesSidebar.tsx` — side panel UI; `NotesFab.tsx` — floating action button that opens the panel.
- `components/NoteEditor.tsx` / `NoteEditorBody.tsx` — rich note editor.
- `components/AmbientNotePanel.tsx` — inline note panel shown within the lesson player.

**Admin gating:** Both audio and transcript upload APIs check `session.user.email === "azizktata77@gmail.com"` directly (no DB role).

**Routing:**
- `/` — home page (level list)
- `/level/[levelIdx]` — subjects in a level
- `/level/[levelIdx]/[subjectIdx]` — courses in a subject
- `/level/[levelIdx]/[subjectIdx]/[courseIdx]` — lesson list; `?lesson=N` selects active lesson
- `/scholars` — scholar index page
- `/scholars/[name]` — courses taught by a specific scholar
- `/search` — fuzzy search across subjects, courses, and lessons
- `/about` — about page

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

**Adding shadcn components:** `npx shadcn add <component-name>`

**Path aliases:** `@/` maps to the project root (components → `@/components`, utils → `@/lib/utils`, etc.)

**Dark mode:** Class-based (`.dark` class), toggled via `@custom-variant dark (&:is(.dark *))` in globals.css. `components/ThemeToggle.tsx` handles the toggle — reads/writes `localStorage("theme")`, respects `prefers-color-scheme` on first load, and sets the class on `document.documentElement`.
