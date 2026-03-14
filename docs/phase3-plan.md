# Phase 3: Auth + Progress Tracking Plan

## Context
Adding optional Google OAuth (content stays public — login only needed for progress tracking) and per-user lesson progress stored in Turso (remote SQLite via libSQL). Visual progress rings appear on level/subject cards; watched checkboxes appear per lesson in CoursePlayer. Sign-in opens as a dialog, not a new page. Age is an optional profile field editable from the navbar user menu.

**Decisions:** NextAuth v5 + Google, JWT sessions (stateless — no sessions/accounts/tokens tables), Turso (libSQL) via Drizzle ORM, sign-in dialog, 2 tables total.

---

## Packages to install

```bash
npm install next-auth@5 drizzle-orm @libsql/client
npm install -D drizzle-kit
```

---

## Database — 2 tables only

### `db/schema.ts`

```ts
import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("user", {
  id:        text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:      text("name"),
  email:     text("email").notNull().unique(),
  age:       integer("age"),                                  // optional profile field
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).$defaultFn(() => Date.now()),
});

export const watchedLessons = sqliteTable("watched_lesson", {
  userId:    text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonKey: text("lessonKey").notNull(), // "levelIdx:subjectIdx:courseIdx:lessonIdx"
  watchedAt: integer("watchedAt", { mode: "timestamp_ms" }).$defaultFn(() => Date.now()),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.lessonKey] }) }));
```

### `db/index.ts`
Turso (libSQL) connection — async client, works in Node.js and Edge:
```ts
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const client = createClient({
  url:       process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
export const db = drizzle(client, { schema });
```

### `db/queries.ts`
All functions are **async** (libSQL is async, unlike better-sqlite3):
```ts
export async function upsertUser(email: string, name: string | null): Promise<string>
// INSERT INTO user (id, email, name) VALUES (uuid, email, name)
// ON CONFLICT(email) DO UPDATE SET name = excluded.name
// Returns user id

export async function getUserByEmail(email: string): Promise<{ id, name, age } | undefined>
export async function getUserById(id: string): Promise<{ id, name, age } | undefined>
export async function updateUser(id: string, fields: { name?: string; age?: number }): Promise<void>
```

### `drizzle.config.ts` (project root)
```ts
import type { Config } from "drizzle-kit";
export default {
  schema: "./db/schema.ts",
  driver: "turso",
  dbCredentials: {
    url:       process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
} satisfies Config;
```
Apply schema: `npx drizzle-kit push`

---

## How progress is stored

Each watched lesson is one row in `watched_lesson`:
- `userId` — UUID from our `users` table
- `lessonKey` — string like `"0:3:1:4"` = level 0, subject 3, course 1, lesson 4 (all 0-indexed)
- Composite PK `(userId, lessonKey)` — uniqueness enforced, toggle is idempotent

On app load after sign-in:
1. `GET /api/progress` returns all `lessonKey` strings for the current user
2. Client stores them in a React `Set<string>` (O(1) lookup)
3. Progress % for a course = `watched count / total lessons` — computed by iterating indices and checking `watchedKeys.has("l:s:c:i")`
4. Toggling: `POST /api/watch { lessonKey, watched: bool }` → INSERT or DELETE; context updates optimistically

---

## Auth flow (JWT, no sessions table)

```
auth.ts (NextAuth config):
  strategy: "jwt"
  provider: Google
  callbacks:
    signIn:  await upsertUser(email, name) → always returns true
    jwt:     on first sign-in, await getUserByEmail(email) → attach userId to token
    session: expose session.user.id = token.userId
```

No adapter, no `accounts`/`sessions`/`verificationTokens` tables. Sessions are stored as signed JWT cookies. The only DB interaction at sign-in is `upsertUser`.

Sign-in UX: clicking "دخول" → opens `SignInDialog` → clicking "Continue with Google" → calls `signIn("google", { callbackUrl: window.location.href })` → goes directly to Google OAuth → returns to same page. No NextAuth intermediate sign-in page.

---

## New files

### `auth.ts` (project root)
```ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUser, getUserByEmail } from "@/db/queries";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google({ clientId: process.env.AUTH_GOOGLE_ID!, clientSecret: process.env.AUTH_GOOGLE_SECRET! })],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      await upsertUser(user.email!, user.name ?? null);
      return true;
    },
    async jwt({ token, trigger }) {
      if (trigger === "signIn" || !token.userId) {
        const dbUser = await getUserByEmail(token.email!);
        token.userId = dbUser?.id;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.userId as string;
      return session;
    },
  },
});
```

### `app/api/auth/[...nextauth]/route.ts`
```ts
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

### `app/api/progress/route.ts`
`GET` — returns `{ keys: string[] }`. Empty array for unauthenticated users (never 401).

### `app/api/watch/route.ts`
`POST` body: `{ lessonKey: "N:N:N:N", watched: boolean }`.
- Returns 401 if unauthenticated
- Validates key format: `/^\d+:\d+:\d+:\d+$/`
- `watched=true` → INSERT OR IGNORE; `watched=false` → DELETE

### `app/api/profile/route.ts`
- `GET` → returns `{ name, age }` for current user
- `PATCH` body `{ name?, age? }` → `updateUser()` → 401 if unauthenticated

### `lib/watchedContext.tsx`
Client context. `WatchedProvider` props: `{ children, isLoggedIn: boolean }`.

Exports from `useWatched()`:
```ts
{
  isLoaded: boolean;
  isLoggedIn: boolean;
  isWatched: (key: string) => boolean;
  toggleWatched: (key: string) => void;   // no-op if not logged in
  watchedKeys: ReadonlySet<string>;
}
```
- On mount: if `isLoggedIn`, fetch `/api/progress` → populate Set; else `isLoaded=true` immediately
- Uses `useOptimistic` + `useTransition` (React 19 built-ins) for instant checkbox feedback
- After each toggle: re-fetches `/api/progress` to sync server truth

### `lib/progress.ts`
Pure functions for progress computation:
```ts
courseProgress(lIdx, sIdx, cIdx, course, watchedKeys): number   // 0-100
subjectProgress(lIdx, sIdx, subject, watchedKeys): number
levelProgress(lIdx, level, watchedKeys): number
```

### `components/ProgressRing.tsx`
SVG donut ring. Props: `pct: number`, `size?: number` (default 36), `stroke?: number` (default 3), `color?: string` (Tailwind `stroke-*` class).
- Two circles: background (`stroke-stone-200`) + progress arc
- Arc via `strokeDasharray` / `strokeDashoffset` from circumference
- `rotate-[-90deg]` CSS so arc starts at 12 o'clock
- `transition-all duration-500` on arc, `aria-hidden`

### `components/SignInDialog.tsx`
Client component. Wraps shadcn `<Dialog>` (`npx shadcn add dialog`).
- `trigger` prop: flexible trigger element (Navbar button, WatchButton, etc.)
- Body: short description + "تسجيل الدخول عبر Google" button with Google SVG icon → `signIn("google", { callbackUrl: window.location.href })`

### `components/ProfileDialog.tsx`
Client component. Opens from user avatar.
- Fetches `GET /api/profile` on open to pre-fill fields
- Form: `name` (text) + `age` (number, optional)
- Save → `PATCH /api/profile`; includes sign-out button

### `components/UserButton.tsx`
Client component. Uses `useSession()`.
- Loading: pulsing circle skeleton
- Signed in: Google avatar (initials fallback) → click opens `ProfileDialog`
- Signed out: renders `<SignInDialog trigger={<button>دخول</button>} />`

### `components/WatchButton.tsx`
Client component. Props: `lessonKey: string`, `col: LevelColor`.
- If `!isLoggedIn`: renders `<SignInDialog trigger={<checkbox-button />} />`
- If `isLoggedIn`: checkbox-style button — watched = colored fill + checkmark, unwatched = empty border
- `e.stopPropagation()` to avoid selecting the playlist item

### `components/HomeLevelsGrid.tsx` (client)
Receives `levels[]` (plain JSON from static data). Renders the existing 2×4 grid with `ProgressRing` on each level badge. Uses `levelProgress()` + `useMemo`.

### `components/LevelSubjectsGrid.tsx` (client)
Receives `levelIdx`, `subjects[]`, `col`. Renders existing 3-col subject grid with `ProgressRing` per card. Uses `subjectProgress()`.

### `components/SubjectCoursesListClient.tsx` (client)
Receives `lIdx`, `sIdx`, `courses[]`, `col`. Renders existing course list with a mini progress bar below scholar names:
```
[thin colored bar ←→ stone-100 track] [٦٠٪]
```
Uses `courseProgress()`. Hidden until `isLoaded`.

---

## Modified files

### `app/layout.tsx`
Make async server component. Call `auth()` → pass to `WatchedProvider`. Wrap with `SessionProvider`.
```ts
export default async function RootLayout({ children }) {
  const session = await auth();
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body ...>
        <SessionProvider session={session}>
          <WatchedProvider isLoggedIn={!!session?.user?.id}>
            <Navbar />
            {children}
          </WatchedProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

### `components/Navbar.tsx`
Add `<UserButton />` inside the `flex items-center gap-1` div (after search button).

### `lib/constants.ts`
Add `ring` field to each `LEVEL_COLORS` entry (matching color family):
```ts
{ ..., ring: "stroke-emerald-700" },
{ ..., ring: "stroke-teal-700" },
{ ..., ring: "stroke-cyan-700" },
{ ..., ring: "stroke-blue-700" },
{ ..., ring: "stroke-indigo-700" },
{ ..., ring: "stroke-violet-700" },
{ ..., ring: "stroke-purple-700" },
{ ..., ring: "stroke-rose-700" },
```

### `components/CoursePlayer.tsx`
1. Call `useWatched()` → `isWatched`, `toggleWatched`, `isLoggedIn`, `isLoaded`
2. Auto-mark on lesson selection (second `useEffect` keyed on `selected`):
   ```ts
   useEffect(() => {
     const key = `${levelIdx}:${subjectIdx}:${courseIdx}:${selected}`;
     if (isLoggedIn && !isWatched(key)) toggleWatched(key);
   }, [selected]);
   ```
3. Playlist header: thin progress bar (watched/total), sign-in nudge if `!isLoggedIn`
4. Each playlist row: `<WatchButton lessonKey={...} col={col} />` after title text

### `app/page.tsx`
Replace levels grid with `<HomeLevelsGrid levels={...} />`.

### `app/level/[levelIdx]/page.tsx`
Replace subjects grid with `<LevelSubjectsGrid levelIdx={idx} subjects={level.subjects} col={c} />`.

### `app/level/[levelIdx]/[subjectIdx]/page.tsx`
Replace courses list with `<SubjectCoursesListClient lIdx={lIdx} sIdx={sIdx} courses={subject.courses} col={c} />`.

### `next.config.ts`
```ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
};
```

---

## Environment variables

`.env.local` (don't commit):
```
AUTH_SECRET=              # npx auth secret
AUTH_GOOGLE_ID=           # Google Cloud Console → OAuth 2.0 Client
AUTH_GOOGLE_SECRET=
TURSO_DATABASE_URL=       # libsql://your-db.turso.io
TURSO_AUTH_TOKEN=         # from Turso dashboard
```

Turso setup: `turso db create kibbarulma` → `turso db tokens create kibbarulma`.
Google OAuth: Authorized redirect URI = `http://localhost:3000/api/auth/callback/google`.
Add `.env.local` to `.gitignore`.

---

## Implementation order

| Step | What |
|------|------|
| 1 | Install packages |
| 2 | `db/schema.ts` + `db/index.ts` + `db/queries.ts` + `drizzle.config.ts` → `npx drizzle-kit push` |
| 3 | `auth.ts` + `app/api/auth/[...nextauth]/route.ts` + `.env.local` |
| 4 | `app/api/progress/route.ts` + `app/api/watch/route.ts` + `app/api/profile/route.ts` |
| 5 | `lib/progress.ts` + `lib/watchedContext.tsx` |
| 6 | Update `app/layout.tsx` (async, SessionProvider + WatchedProvider) |
| 7 | Add `ring` to `lib/constants.ts` |
| 8 | `components/ProgressRing.tsx` |
| 9 | `components/SignInDialog.tsx` + `components/ProfileDialog.tsx` + `components/UserButton.tsx` |
| 10 | Add `<UserButton />` to `components/Navbar.tsx` |
| 11 | `components/WatchButton.tsx` → update `components/CoursePlayer.tsx` |
| 12 | `components/SubjectCoursesListClient.tsx` → update subject page |
| 13 | `components/LevelSubjectsGrid.tsx` → update level page |
| 14 | `components/HomeLevelsGrid.tsx` → update home page |
| 15 | Update `next.config.ts` + `.gitignore` |

---

## Verification

1. `npm run dev` — server starts, no TS errors
2. Visit any page → content loads (unauthenticated)
3. Click "دخول" → `SignInDialog` opens (no page navigation)
4. "Continue with Google" → OAuth flow → returns to same page, avatar appears
5. Open a course, navigate lessons → watched checkmarks appear, `POST /api/watch` fires
6. Refresh → checkmarks persist (loaded from Turso via `/api/progress`)
7. Level/subject pages → progress rings show correct percentages
8. Click avatar → `ProfileDialog`, enter age, save → `PATCH /api/profile` succeeds
9. Sign out → rings disappear, "دخول" shown, content still accessible
10. `npm run build` — succeeds (static params pages unaffected)

---

## Key architectural notes

- **Static generation preserved**: All `generateStaticParams` pages stay unchanged. Only `layout.tsx` becomes dynamic (calls `auth()` which reads cookies).
- **shadcn Dialog**: Run `npx shadcn add dialog` before step 9 if not already installed.
- **Async all the way**: libSQL is async — all `db/queries.ts` functions return Promises; all API route handlers use `await`.
- **JWT sessions**: Stateless — can't be server-side revoked. Appropriate for this use case.
- **Vercel compatible**: Turso is a remote service — works on Vercel, no filesystem dependency.
