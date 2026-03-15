# Transcript System

Everything about how transcripts are stored, served, synced, and managed in the app.

---

## File Format

Transcripts are plain `.txt` files stored in `data/transcripts/`. Each line is a timestamped segment:

```
(0:05) السلام عليكم ورحمة الله وبركاته
(2:11) ومثل قول النبي صلى الله عليه وسلم
(2:14) بالمطورين وقال لهم
```

- Timestamp format: `(M:SS)` — minutes and zero-padded seconds
- Text follows on the same line (or multiple lines until the next timestamp)
- No header or metadata needed

---

## File Naming

```
{levelIdx}-{subjectIdx}-{courseIdx}-{lessonIdx}.txt
```

Example: lesson 0 of course 2, subject 2, level 0 → `0-2-2-0.txt`

All files live in `data/transcripts/`.

---

## How Segments Are Parsed

`app/api/transcript/route.ts` → `parseRawTranscript(raw)`

- Regex: `/\((\d+):(\d{2})\)\s*([\s\S]*?)(?=\(\d+:\d{2}\)|$)/g`
- Each segment's `dur` = next segment's `start − current start` (last segment gets `+5s`)
- Returns `TranscriptSegment[]`: `{ start: number, dur: number, text: string }`

---

## API

### `GET /api/transcript`

Two modes:

| Param | Behaviour |
|-------|-----------|
| `?file=0-2-2-0.txt` | Read from `data/transcripts/`, parse, return segments |
| `?v=<youtubeId>` | Fetch YouTube captions (Arabic first, English fallback) |

Response: `{ segments: TranscriptSegment[] }` — empty array if not found.
Cache: `Cache-Control: public, max-age=86400`.
Security: filename validated against `/^[\w\-]+\.txt$/` (no path traversal).

### `POST /api/transcript` _(admin only)_

Writes or replaces a transcript file.

```json
{ "file": "0-2-2-0.txt", "content": "(0:05) text here..." }
```

- Requires session with `user.email === "azizktata77@gmail.com"` — returns `403` otherwise
- Same filename validation as GET
- Writes to `data/transcripts/{file}` with `writeFileSync`

---

## Loading Logic (CoursePlayer)

`components/CoursePlayer.tsx` — inside the transcript `useEffect`:

1. Always compute filename from indices: `${levelIdx}-${subjectIdx}-${courseIdx}-${lessonIdx}.txt`
2. If the lesson has a YouTube ID:
   - Try `GET /api/transcript?v={ytId}` first
   - If 0 segments returned → fall back to the file
3. If no YouTube ID: try the file directly
4. Re-runs when `selected` (lesson) or `transcriptVersion` (admin save) changes

No dependency on `lesson.transcriptFile` in the JSON — the computed filename is always used.

---

## Playback Sync

`components/TranscriptPanel.tsx`

- `activeIdx` = last segment where `segment.start <= currentTime` (robust, ignores `dur`)
- `currentTime` is polled every **500ms** from `YT.Player.getCurrentTime()` while the video plays
- Active segment is highlighted with the level color and auto-scrolled into view
- Clicking a timestamp badge calls `onSeek(start)` → `player.seekTo()` + immediate `setCurrentTime(start)`

### Search

- Typing in the search box finds the **first** segment matching text or timestamp string
- Scrolls to it smoothly — does not filter the text
- Match is highlighted in yellow; auto-scroll pauses while search is active

---

## Ambient Mode

In ambient (full-screen) mode the transcript panel uses `variant="dark"`:

- Dark background (`neutral-900`), styled scrollbar (neutral-600 thumb)
- Panel is **resizable** — drag the right edge handle (min 240px, max 640px, default 360px)
- Toggle visibility with "إخفاء النص / إظهار النص" in the top bar
- Seek still works; `currentTime` is shared between main and ambient players

---

## Admin Upload UI

`components/TranscriptUploadButton.tsx`

- Rendered inside `CoursePlayer` — returns `null` unless `session.user.email === "azizktata77@gmail.com"`
- Floating pill button (`fixed bottom-6 left-6 z-40`) visible only to the admin
- Opens a dialog with:
  - Filename shown as a hint (e.g. `0-2-2-0.txt`)
  - Monospace RTL textarea (16 rows) for pasting `(M:SS) text` content
  - Save button → `POST /api/transcript` → on success closes dialog and increments `transcriptVersion` to trigger an immediate re-fetch in CoursePlayer
- Replaces existing file if one already exists

---

## Text Selection — Copy & Share

Selecting text inside the transcript panel triggers a floating popover with two actions.

### Popover

Appears above the selection (fixed-positioned, portal-rendered so it's never clipped):

- **نسخ** — copies the selected text to clipboard with timestamps stripped, then dismisses
- **مشاركة** — opens the share dialog

Timestamp chips (`<button>` elements) are excluded by cloning the selection range and calling `fragment.querySelectorAll("button").forEach(b => b.remove())` before reading `textContent`.

### Time range detection

After extracting clean text, the code checks which segment `<span>` refs are intersected by the selection range via `range.intersectsNode(el)`. The first and last matching segment indices give the time range: `fmt(first.start) – fmt(last.start + last.dur)`.

### Share dialog

Displays a styled quote card (not raw `<pre>` text):

- **Quote body** — white background, large decorative quotation mark, selected text
- **Signature footer** — stone-50 background:
  - Left: lesson title + YouTube link
  - Right: time range chip (clock icon + monospace `0:00 – 1:30`)

The **نسخ النص** button copies plain text in this format:

```
[selected text]

[lesson title]
[يوتيوب](https://youtube.com/...) (0:05 – 2:29)
```

### Props added to TranscriptPanel

| Prop | Type | Purpose |
|------|------|---------|
| `lessonTitle?` | `string` | Shown in share dialog footer and copied text |
| `youtubeUrl?` | `string` | Linked in share dialog footer and copied text |

Both are passed from `CoursePlayer` for both the inline panel and the ambient overlay panel.

---

## Adding a Transcript (CLI)

Use the helper script for bulk or offline additions:

```bash
node scripts/add-transcript.mjs
```

Or just create/edit the file directly in `data/transcripts/` following the format above.
