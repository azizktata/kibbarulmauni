"use client";

import { useState, useRef } from "react";
import { NotebookPenIcon, PlusIcon, XIcon } from "lucide-react";
import { useNotes, type NoteSummary } from "@/lib/notesContext";
import { NoteEditorBody } from "@/components/NoteEditorBody";
import type { LevelColor } from "@/lib/constants";
import { cn } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── NotesFab ──────────────────────────────────────────────────────────────────

interface NotesFabProps {
  lessonKey: string;
  col: LevelColor;
  currentTime: number;
  onSeek: (s: number) => void;
}

const SNAP_LIST = "40vh";
const SNAP_EDITOR = "88vh";

export function NotesFab({ lessonKey, col, currentTime, onSeek }: NotesFabProps) {
  const { isLoggedIn, getNotesByLesson, createNote, deleteNote, openNote } = useNotes();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [snapHeight, setSnapHeight] = useState(SNAP_LIST);
  const [editorNoteId, setEditorNoteId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const dragStartY = useRef(0);
  const dragStartH = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const lessonNotes = getNotesByLesson(lessonKey);

  // ── drag-to-resize handle ──────────────────────────────────────────────────
  const onHandlePointerDown = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    dragStartH.current = sheetRef.current?.getBoundingClientRect().height ?? 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onHandlePointerMove = (e: React.PointerEvent) => {
    if (!e.buttons) return;
    const delta = dragStartY.current - e.clientY;
    const newH = Math.max(120, Math.min(window.innerHeight * 0.92, dragStartH.current + delta));
    if (sheetRef.current) sheetRef.current.style.height = `${newH}px`;
  };

  const onHandlePointerUp = () => {
    const h = sheetRef.current?.getBoundingClientRect().height ?? 0;
    const vh = window.innerHeight;
    // Snap to nearest
    if (h > vh * 0.65) {
      setSnapHeight(SNAP_EDITOR);
      if (sheetRef.current) sheetRef.current.style.height = "";
    } else {
      setSnapHeight(SNAP_LIST);
      if (sheetRef.current) sheetRef.current.style.height = "";
    }
  };

  // ── open note in inline editor ─────────────────────────────────────────────
  const openInlineEditor = async (note: NoteSummary) => {
    setLoadingContent(true);
    setEditorNoteId(note.id);
    setSnapHeight(SNAP_EDITOR);
    const res = await fetch(`/api/notes/${note.id}`);
    const { content } = await res.json() as { content: string };
    setEditorContent(content);
    setLoadingContent(false);
  };

  // ── add note at timestamp ──────────────────────────────────────────────────
  const handleAddNote = async () => {
    const ts = formatTime(currentTime);
    const id = await createNote({
      lessonKey,
      noteType: "lesson",
      title: `ملاحظة عند ${ts}`,
      content: `> ⏱ ${ts}\n\n`,
    });
    // Open full editor dialog on mobile too
    openNote(id);
    setSheetOpen(false);
  };

  if (!isLoggedIn) return null;

  return (
    <>
      {/* FAB button — mobile only */}
      <button
        onClick={() => setSheetOpen(true)}
        className={cn(
          "lg:hidden fixed bottom-20 left-4 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95",
          col.bg
        )}
        aria-label="ملاحظات الدرس"
      >
        <NotebookPenIcon className="w-5 h-5 text-white" />
        {lessonNotes.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-white text-[9px] font-bold flex items-center justify-center" style={{ color: "var(--tw-bg-opacity, 1)" }}>
            {lessonNotes.length}
          </span>
        )}
      </button>

      {/* Bottom Sheet overlay */}
      {sheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSheetOpen(false)}
          />

          {/* Sheet */}
          <div
            ref={sheetRef}
            className="relative bg-white rounded-t-2xl shadow-2xl flex flex-col transition-[height] duration-200"
            style={{ height: snapHeight }}
          >
            {/* Drag handle */}
            <div
              className="shrink-0 flex justify-center pt-3 pb-2 cursor-ns-resize touch-none"
              onPointerDown={onHandlePointerDown}
              onPointerMove={onHandlePointerMove}
              onPointerUp={onHandlePointerUp}
            >
              <div className="w-10 h-1 rounded-full bg-stone-200" />
            </div>

            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <NotebookPenIcon className="w-4 h-4 text-stone-400" />
                <span className="text-sm font-semibold text-stone-700">ملاحظات الدرس</span>
                {lessonNotes.length > 0 && (
                  <span className="text-[11px] bg-stone-100 text-stone-500 font-bold px-1.5 py-0.5 rounded-full">
                    {lessonNotes.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleAddNote}
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors",
                    col.bg, "text-white"
                  )}
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  عند {formatTime(currentTime)}
                </button>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="p-1.5 rounded-lg text-stone-300 hover:text-stone-600"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {/* Editor view */}
              {snapHeight === SNAP_EDITOR && editorNoteId && (
                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-stone-100">
                    <button
                      onClick={() => { setEditorNoteId(null); setEditorContent(null); setSnapHeight(SNAP_LIST); }}
                      className="text-xs text-stone-400 hover:text-stone-600"
                    >
                      ← الملاحظات
                    </button>
                  </div>
                  {loadingContent ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-stone-200 border-t-stone-400 rounded-full animate-spin" />
                    </div>
                  ) : editorContent !== null ? (
                    <NoteEditorBody
                      key={editorNoteId}
                      noteId={editorNoteId}
                      initialContent={editorContent}
                      className="flex-1 min-h-0"
                    />
                  ) : null}
                </div>
              )}

              {/* List view */}
              {(snapHeight === SNAP_LIST || (snapHeight === SNAP_EDITOR && !editorNoteId)) && (
                <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
                  {lessonNotes.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                      <NotebookPenIcon className="w-7 h-7 text-stone-200" />
                      <p className="text-xs text-stone-400">لا توجد ملاحظات لهذا الدرس</p>
                      <button
                        onClick={handleAddNote}
                        className={cn("text-xs font-medium", col.text)}
                      >
                        إضافة أول ملاحظة
                      </button>
                    </div>
                  ) : (
                    lessonNotes.map((note) => (
                      <button
                        key={note.id}
                        onClick={() => openInlineEditor(note)}
                        className="text-right bg-stone-50 border border-stone-100 rounded-xl px-3 py-2.5 hover:border-stone-200 transition-colors"
                      >
                        <p className="text-xs font-medium text-stone-700 truncate">{note.title}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
