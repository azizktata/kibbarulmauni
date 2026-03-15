"use client";

import { PlusIcon, NotebookPenIcon, Trash2Icon } from "lucide-react";
import { useNotes } from "@/lib/notesContext";
import type { LevelColor } from "@/lib/constants";

interface AmbientNotePanelProps {
  lessonKey: string;
  col: LevelColor;
  currentTime: number;
  onSeek: (s: number) => void;
}

export function AmbientNotePanel({ lessonKey, col }: AmbientNotePanelProps) {
  const { getNotesByLesson, openNote, deleteNote, createNote, folders, createFolder, isLoggedIn, notes } = useNotes();

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-4 bg-neutral-900">
        <NotebookPenIcon className="w-6 h-6 text-neutral-700" />
        <p className="text-xs text-neutral-600 text-center">سجّل دخولك لإضافة ملاحظات</p>
      </div>
    );
  }

  const lessonNotes = getNotesByLesson(lessonKey);

  // Find the lesson title from the folder that matches this lessonKey's notes
  const lessonFolderId = lessonNotes.find(n => n.folderId)?.folderId ?? null;
  const lessonFolder = lessonFolderId ? folders.find(f => f.id === lessonFolderId) : null;

  async function handleCreateNote() {
    const folderName = lessonFolder?.name ?? `درس ${lessonKey}`;
    let folderId = lessonFolder?.id ?? null;
    if (!folderId) {
      folderId = await createFolder(folderName);
    }
    const id = await createNote({
      lessonKey,
      noteType: "lesson",
      title: "ملاحظة جديدة",
      folderId,
    });
    openNote(id);
  }

  return (
    <div className="flex flex-col h-full bg-neutral-900 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2.5 border-b border-neutral-800">
        <div className="flex items-center gap-1.5">
          <NotebookPenIcon className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-xs font-semibold text-neutral-300">ملاحظات الدرس</span>
          {lessonNotes.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
              {lessonNotes.length}
            </span>
          )}
        </div>
        <button
          onClick={handleCreateNote}
          className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="ملاحظة جديدة"
        >
          <PlusIcon className="w-3 h-3" />
          <span>جديد</span>
        </button>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1.5">
        {lessonNotes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
            <NotebookPenIcon className="w-7 h-7 text-neutral-800" />
            <p className="text-xs text-neutral-600">لا توجد ملاحظات لهذا الدرس بعد</p>
            <button
              onClick={handleCreateNote}
              className="text-xs font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              إضافة أول ملاحظة
            </button>
          </div>
        ) : (
          lessonNotes.map((note) => (
            <div
              key={note.id}
              className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-800 cursor-pointer transition-colors"
              onClick={() => openNote(note.id)}
            >
              <span className="flex-1 text-xs text-neutral-300 truncate leading-snug">{note.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded text-neutral-600 hover:text-red-400 transition-all"
              >
                <Trash2Icon className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
