# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Architecture

Next.js 16 app (App Router, React 19) that serves as a browsable index for Islamic educational content. All content comes from a single static JSON file — there is no backend or database.

**Data layer (`lib/` + `data/`):**
- `data/kibbarulmauni.json` — the entire content tree: `Level[] → Subject[] → Course[] → Lesson[]`. Each lesson has a `title`, `url`, and optional `youtube` field.
- `lib/data.ts` — typed accessors (`getLevel`, `getSubject`, `getCourse`) and helpers (`countLevelLessons`, `extractScholars`).
- `lib/scholars.ts` — builds a `scholarsIndex` (Scholar[]) by parsing Arabic scholar names out of lesson titles using regex, then canonicalizing via `lib/scholarAliases.ts`.
- `lib/searchIndex.ts` — builds a flat `SearchEntry[]` from the full tree for use with `fuse.js` fuzzy search.
- `lib/useRecentlyWatched.ts` — localStorage hook for tracking recently viewed lessons.
- `lib/constants.ts` — `LEVEL_COLORS` (one color theme per level, 8 total) and `ARABIC_DIGITS`.

**Routing:**
- `/` — home page (level list)
- `/level/[levelIdx]` — subjects in a level
- `/level/[levelIdx]/[subjectIdx]` — courses in a subject
- `/level/[levelIdx]/[subjectIdx]/[courseIdx]` — lesson list; `?lesson=N` selects active lesson
- `/scholars` — scholar index page
- `/scholars/[name]` — courses taught by a specific scholar
- `/search` — fuzzy search across subjects, courses, and lessons

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

**Adding shadcn components:** `npx shadcn add <component-name>`

**Path aliases:** `@/` maps to the project root (components → `@/components`, utils → `@/lib/utils`, etc.)

**Dark mode:** Class-based (`.dark` class), toggled via `@custom-variant dark (&:is(.dark *))` in globals.css.
