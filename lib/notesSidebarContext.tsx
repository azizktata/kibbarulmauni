"use client";

import { createContext, useContext } from "react";
import type { NoteFolder, NoteSummary } from "@/lib/notesContext";

export interface NotesSidebarContextValue {
  allFolders: NoteFolder[];
  allNotes: NoteSummary[];
  searchQuery: string;
  onNoteOpen: (id: string) => void;
  onNoteDelete: (id: string) => void;
  onCreateNote: (folderId: string) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onNestFolder: (draggedId: string, parentId: string) => void;
  onMoveNote: (noteId: string, folderId: string | null) => void;
  onReorderNote: (draggedId: string, targetId: string, position: "before" | "after") => void;
  onReorderFolder: (draggedId: string, targetId: string, position: "before" | "after") => void;
}

export const NotesSidebarContext = createContext<NotesSidebarContextValue | null>(null);

export function useNotesSidebar(): NotesSidebarContextValue {
  const ctx = useContext(NotesSidebarContext);
  if (!ctx) throw new Error("useNotesSidebar must be inside NotesSidebarContext.Provider");
  return ctx;
}
