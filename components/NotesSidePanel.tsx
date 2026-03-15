"use client";

import { useCallback } from "react";
import { PlusIcon, NotebookPenIcon, BookOpenIcon, FileTextIcon, RotateCcwIcon, Trash2Icon, ClockIcon } from "lucide-react";
import { useNotes, type NoteSummary } from "@/lib/notesContext";
import type { LevelColor } from "@/lib/constants";
import { cn } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function toSeconds(ts: string): number {
  const parts = ts.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

// Render note content preview, converting timestamps to clickable buttons
function NotePreview({
  content,
  onSeek,
}: {
  content?: string;
  onSeek: (s: number) => void;
}) {
  if (!content) return null;
  // Match ⏱ MM:SS or plain MM:SS (with optional H:) patterns
  const tsRegex = /(?:⏱\s*)?(\d{1,2}:\d{2}(?::\d{2})?)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tsRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    const ts = match[1];
    parts.push(
      <button
        key={match.index}
        onClick={() => onSeek(toSeconds(ts))}
        className="inline-flex items-center gap-0.5 text-emerald-600 hover:text-emerald-700 font-mono text-[11px] hover:underline"
      >
        <ClockIcon className="w-2.5 h-2.5" />
        {ts}
      </button>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) parts.push(content.slice(lastIndex));

  return <span className="text-[11px] text-stone-400 leading-relaxed">{parts}</span>;
}

function NoteTypeIcon({ type }: { type: string }) {
  if (type === "lesson") return <BookOpenIcon className="w-3 h-3 text-blue-400 shrink-0" />;
  if (type === "revision") return <RotateCcwIcon className="w-3 h-3 text-amber-400 shrink-0" />;
  return <FileTextIcon className="w-3 h-3 text-stone-400 shrink-0" />;
}

// ── NoteCard ──────────────────────────────────────────────────────────────────

function NoteCard({
  note,
  onOpen,
  onDelete,
  onSeek,
}: {
  note: NoteSummary & { content?: string };
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onSeek: (s: number) => void;
}) {
  return (
    <div className="group bg-white border border-stone-100 rounded-xl p-3 cursor-pointer hover:border-stone-200 hover:shadow-sm transition-all"
      onClick={() => onOpen(note.id)}>
      <div className="flex items-start gap-2">
        <NoteTypeIcon type={note.noteType} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-stone-700 truncate">{note.title}</p>
          {note.content && (
            <div className="mt-0.5 line-clamp-2" onClick={(e) => e.stopPropagation()}>
              <NotePreview content={note.content} onSeek={onSeek} />
            </div>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
          className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded text-stone-200 hover:text-red-400 transition-all"
        >
          <Trash2Icon className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── NotesSidePanel ────────────────────────────────────────────────────────────

interface NotesSidePanelProps {
  lessonKey: string;
  col: LevelColor;
  currentTime: number;
  onSeek: (s: number) => void;
  variant?: "light" | "dark";
}

export function NotesSidePanel({
  lessonKey,
  col,
  currentTime,
  onSeek,
  variant = "light",
}: NotesSidePanelProps) {
  const { getNotesByLesson, createNote, deleteNote, openNote, isLoggedIn } = useNotes();
  const lessonNotes = getNotesByLesson(lessonKey);
  const isDark = variant === "dark";

  const handleAddTimestampNote = useCallback(async () => {
    const ts = formatTime(currentTime);
    const id = await createNote({
      lessonKey,
      noteType: "lesson",
      title: `ملاحظة عند ${ts}`,
      content: `> ⏱ ${ts}\n\n`,
    });
    openNote(id);
  }, [currentTime, lessonKey, createNote, openNote]);

  if (!isLoggedIn) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full gap-3 px-4",
        isDark ? "bg-neutral-900 text-neutral-400" : "bg-stone-50 text-stone-400"
      )}>
        <NotebookPenIcon className="w-6 h-6 opacity-40" />
        <p className="text-xs text-center">سجّل دخولك لإضافة ملاحظات</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-full overflow-hidden",
      isDark ? "bg-neutral-900" : "bg-stone-50"
    )}>
      {/* Header */}
      <div className={cn(
        "shrink-0 flex items-center justify-between px-3 py-2.5 border-b",
        isDark ? "border-neutral-800" : "border-stone-200"
      )}>
        <div className="flex items-center gap-1.5">
          <NotebookPenIcon className={cn("w-3.5 h-3.5", isDark ? "text-neutral-500" : "text-stone-400")} />
          <span className={cn("text-xs font-semibold", isDark ? "text-neutral-300" : "text-stone-600")}>
            ملاحظات الدرس
          </span>
          {lessonNotes.length > 0 && (
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              isDark ? "bg-neutral-800 text-neutral-400" : "bg-stone-200 text-stone-500"
            )}>
              {lessonNotes.length}
            </span>
          )}
        </div>
        <button
          onClick={handleAddTimestampNote}
          className={cn(
            "flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg transition-colors",
            isDark
              ? "text-neutral-400 hover:text-white hover:bg-neutral-800"
              : `${col.text} hover:bg-white border border-transparent hover:border-stone-200`
          )}
          title={`إضافة ملاحظة عند ${formatTime(currentTime)}`}
        >
          <PlusIcon className="w-3 h-3" />
          <span>عند {formatTime(currentTime)}</span>
        </button>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-2">
        {lessonNotes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
            <NotebookPenIcon className={cn("w-7 h-7", isDark ? "text-neutral-800" : "text-stone-200")} />
            <p className={cn("text-xs", isDark ? "text-neutral-600" : "text-stone-400")}>
              لا توجد ملاحظات لهذا الدرس بعد
            </p>
            <button
              onClick={handleAddTimestampNote}
              className={cn(
                "text-xs font-medium transition-colors",
                isDark ? "text-emerald-400 hover:text-emerald-300" : "text-emerald-600 hover:text-emerald-700"
              )}
            >
              إضافة أول ملاحظة
            </button>
          </div>
        ) : (
          lessonNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onOpen={openNote}
              onDelete={deleteNote}
              onSeek={onSeek}
            />
          ))
        )}
      </div>
    </div>
  );
}
