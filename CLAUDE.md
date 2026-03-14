# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Architecture

Next.js 16 app using the App Router with React 19. Early-stage project — only the root layout and a placeholder home page exist so far.

**Key directories:**
- `app/` — App Router pages and layouts. `globals.css` contains the full Tailwind v4 + shadcn design token setup (CSS variables for colors, radius, etc.)
- `components/ui/` — shadcn/ui components (currently: card, progress, navigation-menu, collapsible, breadcrumb)
- `lib/utils.ts` — exports `cn()` helper (clsx + tailwind-merge)

**UI stack:**
- Tailwind CSS v4 (config-less, PostCSS-based) with `tw-animate-css`
- shadcn/ui (`style: "base-vega"`, base color: neutral, CSS variables enabled)
- `@base-ui/react` for accessible primitives
- `lucide-react` for icons

**Adding shadcn components:** `npx shadcn add <component-name>`

**Path aliases:** `@/` maps to the project root (components → `@/components`, utils → `@/lib/utils`, etc.)

**Dark mode:** Class-based (`.dark` class), toggled via `@custom-variant dark (&:is(.dark *))` in globals.css.
