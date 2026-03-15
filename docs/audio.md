# Audio Download System

Per-lesson MP3 files that admins can upload and all users can download.

---

## File Storage

Audio files live in `data/audio/` and follow the same naming convention as transcripts:

```
{levelIdx}-{subjectIdx}-{courseIdx}-{lessonIdx}.mp3
```

Example: lesson 0 of course 2, subject 2, level 0 → `0-2-2-0.mp3`

The directory is created automatically on first upload.

---

## API

### `GET /api/audio`

Two modes:

| Param | Behaviour |
|-------|-----------|
| `?file=0-2-2-0.mp3` | Serve the MP3 as a download |
| `?file=0-2-2-0.mp3&check=1` | Return `{ exists: boolean }` without loading the file |
| `?file=...&name=lesson+title.mp3` | Override the download filename (used for Arabic lesson titles) |

Response headers when serving:
- `Content-Type: audio/mpeg`
- `Content-Disposition: attachment; filename*=UTF-8''<encoded-name>`
- `Cache-Control: public, max-age=86400`

Security: filename validated against `/^[\w\-]+\.mp3$/` (no path traversal).

### `POST /api/audio` _(admin only)_

Accepts `multipart/form-data`:

| Field | Value |
|-------|-------|
| `file` | The MP3 `File` blob |
| `filename` | e.g. `0-2-2-0.mp3` |

- Requires session with `user.email === "azizktata77@gmail.com"` — returns `403` otherwise
- Same filename validation as GET
- Writes to `data/audio/{filename}` with `writeFileSync`

---

## UI (CoursePlayer)

### Existence check

On every lesson change (and after an admin upload), `CoursePlayer` fetches:

```
GET /api/audio?file={audioFilename}&check=1
```

If `exists: true`, a **تحميل الصوت** link appears in the lesson title card.

### Download link

```tsx
<a href={`/api/audio?file=${audioFilename}&name=${encodeURIComponent(lesson.title + ".mp3")}`} download>
  تحميل الصوت
</a>
```

The `?name=` param sets the `Content-Disposition` filename on the server so the browser saves it with the Arabic lesson title.

---

## Admin Upload UI

`components/AudioUploadButton.tsx`

- Returns `null` unless `session.user.email === "azizktata77@gmail.com"`
- Floating pill button (`fixed bottom-20 left-6 z-40`) — stacked above the transcript button at `bottom-6`
- Opens a dialog with a click-to-pick file area (`.mp3` only), shows filename + file size
- On save → `POST /api/audio` (multipart) → on success increments `audioVersion` in `CoursePlayer` to trigger a re-check
