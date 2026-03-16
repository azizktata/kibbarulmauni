# Notes System

Obsidian-inspired notes deeply integrated into the lesson experience. Non-intrusive (no background blur), contextual (linked to lessons), and persistent (auto-saved).

---

## Database Schema

Two tables added to `db/schema.ts`:

```typescript
// note_folder
id, userId, parentId (null = root), name, sortOrder, createdAt

// note
id, userId, folderId, lessonKey, noteType, title, content, isPinned, sortOrder, createdAt, updatedAt
```

- `lessonKey` format: `"levelIdx:subjectIdx:courseIdx:lessonIdx"`
- `noteType`: `"lesson" | "concept" | "revision"`
- No FK on `folderId` — deleting a folder orphans its notes to root instead of cascading
- Sidebar loads summaries only (no `content` column); content fetched on-demand when editor opens

---

## API Routes

| Route | Methods | Notes |
|---|---|---|
| `/api/notes` | GET, POST | GET returns `{ notes: NoteSummary[], folders: NoteFolder[] }` |
| `/api/notes/[id]` | GET, PATCH, DELETE | GET includes full `content`; PATCH accepts `title, content, folderId, lessonKey, noteType, isPinned, sortOrder` |
| `/api/notes/folders` | POST | `{ name, parentId? }` |
| `/api/notes/folders/[id]` | PATCH, DELETE | PATCH accepts `name, parentId, sortOrder`; DELETE NULLs child notes first |
| `/api/notes/search` | GET | `?q=` — server-side search on title + content; returns `{ results: (NoteSummary & { snippet })[] }` |

Auth: soft-fail (empty arrays) on GET, hard 401 on writes.

---

## Context (`lib/notesContext.tsx`)

Follows the same pattern as `lib/watchedContext.tsx`.

**State:**
- `notes: NoteSummary[]` — summaries (no content)
- `folders: NoteFolder[]`
- `sidebarOpen` / `setSidebarOpen`
- `openNoteId` / `openNote` — which note is open in the floating editor
- `activeLessonKey` / `activeFolderId` — set when sidebar is opened from a lesson

**Key behaviour:**
- All mutations are optimistic (local state updated before API call)
- `updateNoteMeta` and `updateFolder` both accept `sortOrder` for drag reordering
- `openSidebarForLesson(lessonKey, lessonTitle)` — finds or creates a root folder named after the lesson title, sets `activeLessonKey` + `activeFolderId`, opens sidebar
- `Ctrl+Shift+N` global shortcut opens the sidebar from any page
- `deleteFolder` orphans child notes to root (`folderId → null`) before deleting

---

## Components

### `NoteEditor`

Floating draggable panel (not a Dialog) rendered via `createPortal` into `document.body`.

- `z-[60]` — floats above ambient overlay (`z-50`)
- No backdrop or blur — user can interact with the video while writing
- Drag via pointer capture (`setPointerCapture`) on the `GripVerticalIcon` handle
- Minimize button collapses body, keeps title bar
- Type pills: lesson (blue) / concept (stone) / revision (amber)
- Pin and delete actions in title bar
- Body: `NoteEditorBody` — 600ms debounced auto-save via `PATCH /api/notes/[id]`
- Initial position: centered on screen; constrained within viewport on drag

### `NotesSidebar`

Global `Sheet` (`side="right"`) mounted in `app/layout.tsx`. Opened from Navbar or `Ctrl+Shift+N`.

**Lesson-context mode** (when `activeLessonKey` is set and no search):
- Shows the lesson's folder prominently at the top
- "كل الملاحظات" link at the bottom to exit lesson mode

**Normal mode:**
- Search box — debounced 350ms, calls `GET /api/notes/search?q=` for server-side content search; shows title + content snippet per result
- Pinned notes section (collapsible)
- Revision notes section (collapsible)
- Folder tree — `FolderNode` recursive collapsible with `depth * 12px` indent, sorted by `sortOrder`
- "بدون مجلد" root section for unfiled notes

**Drag and drop:**
- `NoteRow` has `draggable` + `GripVerticalIcon`; sets `dataTransfer["note-drag"]` on drag start
- `FolderNode` header is draggable (sets `dataTransfer["folder-drag"]`) and a drop target with three zones based on cursor vertical position:
  - Note dragged over folder → amber highlight → drop moves note into folder
  - Folder dragged over top 25% → blue line above → reorder before (fractional `sortOrder`)
  - Folder dragged over middle 50% → amber highlight → **nest folder inside** (sets `parentId`)
  - Folder dragged over bottom 25% → blue line below → reorder after (fractional `sortOrder`)
- Circular nesting prevented: `isDescendant(folders, targetId, ancestorId)` walks ancestry chain; drop silently ignored if target is a descendant of dragged folder
- `NoteRow` is also a drop target for other notes → blue line above/below → drop reorders notes within their folder (also updates `folderId` to match target's folder)
- Root "بدون مجلد" zone is a drop target → drop removes note from any folder (`folderId: null`)
- Reorder uses fractional sortOrder: `(prev.sortOrder + target.sortOrder) / 2`; single API call per move

**Folder rename:**
- Hover a folder → `PencilIcon` button appears alongside `+` and delete
- Double-click the folder name also enters edit mode
- Inline `<input>` replaces the name span; Enter/blur saves, Escape cancels
- Drag is disabled (`draggable={false}`) while editing to prevent accidental drags

**Note creation in lesson context:**
When `handleCreateNote(folderId)` is called, it inherits `lessonKey` from:
1. `activeLessonKey` if sidebar was opened via `openSidebarForLesson`
2. Otherwise, infers from existing notes in the same folder (`notes.find(n => n.folderId === folderId && n.lessonKey)`)

### `AmbientNotePanel`

Dark-themed (`bg-neutral-900`) notes list for ambient overlay mode.

- Receives `lessonKey` + `lessonTitle` props from `CoursePlayer`
- Finds lesson folder by `folders.find(f => f.name === lessonTitle && !f.parentId)`
- Shows notes matched by `lessonKey` **OR** by `folderId === lessonFolder.id` — same unified logic as FAB count
- Mounted as a fixed-width `w-80 shrink-0` flex sibling outside the `ResizablePanelGroup` (adding a 3rd panel caused sizing bugs with `react-resizable-panels`)
- Toggled by "الملاحظات" button in ambient top bar

### FAB (`CoursePlayer`)

Fixed floating button (`bottom-6 right-6 z-40`) visible on the course page when logged in.

- Count badge uses unified logic: notes where `lessonKey === currentLessonKey` **OR** `folderId === lessonFolder.id`
- This ensures notes created from any entry point (FAB picker, sidebar, ambient panel) always appear in the count
- Click toggles a picker popup listing all lesson notes + "ملاحظة جديدة" button
- Picker also uses the same unified note set

---

## Lesson Folder Auto-Creation

When a user creates a note from a lesson, the system:
1. Finds a root folder whose `name === lessonTitle`
2. If none exists, creates it via `POST /api/notes/folders`
3. Associates the new note with that folder + sets `lessonKey`

New notes always use the generic title **"ملاحظة جديدة"** — the folder already carries the lesson name.

---

## Note Types

| Type | Icon | Color | Use |
|---|---|---|---|
| `lesson` | BookOpenIcon | blue | Tied to a specific lesson |
| `concept` | FileTextIcon | stone | Free-form knowledge |
| `revision` | RotateCcwIcon | amber | Flagged for spaced review |

Revision notes appear in a dedicated "للمراجعة" section in the sidebar.
