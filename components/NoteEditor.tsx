"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { XIcon, BookOpenIcon, FileTextIcon, RotateCcwIcon, PinIcon, TrashIcon, MinusIcon, GripVerticalIcon } from "lucide-react";
import { NoteEditorBody } from "@/components/NoteEditorBody";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useNotes, type NoteSummary } from "@/lib/notesContext";
import { cn } from "@/lib/utils";

const NOTE_TYPES = [
  { value: "concept", label: "مفهوم", icon: FileTextIcon, color: "text-stone-500" },
  { value: "lesson", label: "درس", icon: BookOpenIcon, color: "text-blue-500" },
  { value: "revision", label: "مراجعة", icon: RotateCcwIcon, color: "text-amber-500" },
] as const;

const PANEL_W = 440;
const PANEL_H = 540;

export function NoteEditor() {
  const { openNoteId, openNote, notes, updateNoteMeta, deleteNote } = useNotes();

  const [noteContent, setNoteContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [localTitle, setLocalTitle] = useState("");
  const [minimized, setMinimized] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const dragRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Set initial position when first opened (desktop only)
  useEffect(() => {
    if (openNoteId && pos === null && !isMobile) {
      const x = Math.max(16, Math.min(window.innerWidth - PANEL_W - 16, window.innerWidth / 2 - PANEL_W / 2));
      const y = Math.max(16, Math.min(window.innerHeight - PANEL_H - 16, window.innerHeight / 2 - PANEL_H / 2));
      setPos({ x, y });
    }
    if (!openNoteId) {
      setMinimized(false);
      setNoteContent(null);
      setLocalTitle("");
    }
  }, [openNoteId, pos, isMobile]);

  // Load note content when openNoteId changes
  useEffect(() => {
    if (!openNoteId) return;
    setLoading(true);
    fetch(`/api/notes/${openNoteId}`)
      .then((r) => r.json())
      .then(({ content }: { content: string }) => {
        setNoteContent(content);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [openNoteId]);

  const note: NoteSummary | undefined = notes.find((n) => n.id === openNoteId);

  useEffect(() => {
    if (note) setLocalTitle(note.title);
  }, [note?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTitleBlur = () => {
    if (!note || !localTitle.trim() || localTitle === note.title) return;
    updateNoteMeta(note.id, { title: localTitle.trim() });
  };

  // ── Drag handlers (desktop only) ──────────────────────────────────────────
  const onDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pos) return;
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: pos.x, py: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.buttons || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.sx;
    const dy = e.clientY - dragRef.current.sy;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - PANEL_W, dragRef.current.px + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 48, dragRef.current.py + dy)),
    });
  };

  const onDragEnd = () => { dragRef.current = null; };

  if (!openNoteId || !mounted) return null;

  // ── Shared title bar content ───────────────────────────────────────────────
  const titleBar = (isMobileMode: boolean) => (
    <div
      className={cn(
        "shrink-0 flex items-center gap-2 px-2 py-2 bg-stone-50 border-b border-stone-200",
        isMobileMode ? "cursor-default" : "cursor-grab active:cursor-grabbing touch-none"
      )}
      {...(!isMobileMode && {
        onPointerDown: onDragStart,
        onPointerMove: onDragMove,
        onPointerUp: onDragEnd,
      })}
    >
      {!isMobileMode && <GripVerticalIcon className="w-3.5 h-3.5 text-stone-300 shrink-0" />}

      {/* Type pills */}
      <div className="flex items-center gap-0.5 shrink-0">
        {NOTE_TYPES.map(({ value, label, icon: Icon, color }) => (
          <button
            key={value}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => note && updateNoteMeta(note.id, { noteType: value })}
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors",
              note?.noteType === value
                ? "bg-white text-stone-700 shadow-sm border border-stone-200"
                : "text-stone-300 hover:text-stone-500"
            )}
          >
            <Icon className={cn("w-2.5 h-2.5", note?.noteType === value ? color : "")} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Title input */}
      <input
        type="text"
        value={localTitle}
        onChange={(e) => setLocalTitle(e.target.value)}
        onBlur={handleTitleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          e.stopPropagation();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="flex-1 text-xs font-semibold text-stone-700 bg-transparent focus:outline-none placeholder-stone-300 text-right min-w-0 select-text cursor-text"
        placeholder="عنوان الملاحظة..."
        dir="rtl"
      />

      {/* Action buttons */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => note && updateNoteMeta(note.id, { isPinned: note.isPinned === 1 ? 0 : 1 })}
          className={cn(
            "p-1 rounded transition-colors",
            note?.isPinned === 1 ? "text-amber-400" : "text-stone-300 hover:text-stone-500"
          )}
          title={note?.isPinned === 1 ? "إلغاء التثبيت" : "تثبيت"}
        >
          <PinIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => { if (note) { deleteNote(note.id); openNote(null); } }}
          className="p-1 rounded text-stone-300 hover:text-red-400 transition-colors"
          title="حذف الملاحظة"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
        {!isMobileMode && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setMinimized((v) => !v)}
            className="p-1 rounded text-stone-300 hover:text-stone-600 transition-colors"
            title={minimized ? "توسيع" : "تصغير"}
          >
            <MinusIcon className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => openNote(null)}
          className="p-1 rounded text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          title="إغلاق"
        >
          <XIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  const editorBody = (
    <>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-stone-200 border-t-stone-400 rounded-full animate-spin" />
        </div>
      ) : noteContent !== null && openNoteId ? (
        <NoteEditorBody
          key={openNoteId}
          noteId={openNoteId}
          initialContent={noteContent}
          className="flex-1 min-h-0"
        />
      ) : null}
    </>
  );

  // ── Mobile: bottom sheet ───────────────────────────────────────────────────
  if (isMobile) {
    return (
      <Sheet open={!!openNoteId} onOpenChange={(open) => { if (!open) openNote(null); }}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="p-0 flex flex-col gap-0 rounded-t-xl"
          style={{ height: "85dvh" }}
          dir="rtl"
        >
          {/* Drag handle pill */}
          <div className="flex justify-center pt-2.5 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-stone-200" />
          </div>
          {titleBar(true)}
          {editorBody}
        </SheetContent>
      </Sheet>
    );
  }

  // ── Desktop: draggable floating panel ─────────────────────────────────────
  if (pos === null) return null;

  const panel = (
    <div
      className="fixed z-[60] bg-white rounded-xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden select-none"
      style={{
        left: pos.x,
        top: pos.y,
        width: PANEL_W,
        height: minimized ? "auto" : PANEL_H,
      }}
      dir="rtl"
    >
      {titleBar(false)}
      {!minimized && editorBody}
    </div>
  );

  return createPortal(panel, document.body);
}
