"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type NoteFolder = {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
  createdAt: number;
};

export type NoteSummary = {
  id: string;
  userId: string;
  folderId: string | null;
  lessonKey: string | null;
  noteType: string;
  title: string;
  isPinned: number;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
};

type CreateNoteFields = {
  title?: string;
  content?: string;
  folderId?: string | null;
  lessonKey?: string | null;
  noteType?: string;
};

type UpdateNoteFields = {
  title?: string;
  folderId?: string | null;
  lessonKey?: string | null;
  noteType?: string;
  isPinned?: number;
  sortOrder?: number;
};

type NotesContextValue = {
  isLoaded: boolean;
  isLoggedIn: boolean;
  notes: NoteSummary[];
  folders: NoteFolder[];
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  openNoteId: string | null;
  openNote: (id: string | null) => void;
  // Active lesson context (set when sidebar is opened from a lesson)
  activeLessonKey: string | null;
  activeFolderId: string | null;
  openSidebarForLesson: (lessonKey: string, lessonTitle: string) => Promise<void>;
  createNote: (fields?: CreateNoteFields) => Promise<string>;
  updateNoteMeta: (id: string, fields: UpdateNoteFields) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  createFolder: (name: string, parentId?: string | null) => Promise<string>;
  updateFolder: (id: string, fields: { name?: string; parentId?: string | null; sortOrder?: number }) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  getNotesByFolder: (folderId: string | null) => NoteSummary[];
  getNotesByLesson: (lessonKey: string) => NoteSummary[];
  getRevisionNotes: () => NoteSummary[];
};

const NotesContext = createContext<NotesContextValue | null>(null);

export function NotesProvider({
  children,
  isLoggedIn,
}: {
  children: ReactNode;
  isLoggedIn: boolean;
}) {
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [activeLessonKey, setActiveLessonKey] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const data = await fetch("/api/notes").then((r) => r.json()) as {
        notes: NoteSummary[];
        folders: NoteFolder[];
      };
      setNotes(data.notes ?? []);
      setFolders(data.folders ?? []);
    } catch {
      // silently ignore fetch errors
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoaded(true);
      return;
    }
    fetchAll().then(() => setIsLoaded(true));
  }, [isLoggedIn, fetchAll]);

  // Keyboard shortcut: Ctrl+Shift+N opens the sidebar (full view, no lesson filter)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "N") {
        e.preventDefault();
        if (isLoggedIn) {
          setActiveLessonKey(null);
          setActiveFolderId(null);
          setSidebarOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isLoggedIn]);

  // Open sidebar for a specific lesson — finds/creates the lesson folder
  const openSidebarForLesson = useCallback(
    async (lessonKey: string, lessonTitle: string) => {
      // Find existing root folder with lesson title
      const folder = folders.find((f) => f.name === lessonTitle && !f.parentId);
      let folderId: string;

      if (folder) {
        folderId = folder.id;
      } else {
        // Create a new folder for this lesson
        const res = await fetch("/api/notes/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: lessonTitle, parentId: null }),
        });
        const { id } = await res.json() as { id: string };
        const now = Date.now();
        const newFolder: NoteFolder = { id, userId: "", parentId: null, name: lessonTitle, sortOrder: 0, createdAt: now };
        setFolders((prev) => [...prev, newFolder]);
        folderId = id;
      }

      setActiveLessonKey(lessonKey);
      setActiveFolderId(folderId);
      setSidebarOpen(true);
    },
    [folders]
  );

  const createNote = useCallback(
    async (fields: CreateNoteFields = {}): Promise<string> => {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const { id } = await res.json() as { id: string };
      // Optimistic add
      const now = Date.now();
      const optimistic: NoteSummary = {
        id,
        userId: "",
        folderId: fields.folderId ?? null,
        lessonKey: fields.lessonKey ?? null,
        noteType: fields.noteType ?? "concept",
        title: fields.title ?? "ملاحظة جديدة",
        isPinned: 0,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      };
      setNotes((prev) => [optimistic, ...prev]);
      return id;
    },
    []
  );

  const updateNoteMeta = useCallback(
    async (id: string, fields: UpdateNoteFields): Promise<void> => {
      // Optimistic update
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...fields, updatedAt: Date.now() } : n))
      );
      await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
    },
    []
  );

  const deleteNote = useCallback(async (id: string): Promise<void> => {
    // Optimistic remove
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (openNoteId === id) setOpenNoteId(null);
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
  }, [openNoteId]);

  const createFolder = useCallback(
    async (name: string, parentId: string | null = null): Promise<string> => {
      const res = await fetch("/api/notes/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId }),
      });
      const { id } = await res.json() as { id: string };
      const now = Date.now();
      setFolders((prev) => [
        ...prev,
        { id, userId: "", parentId, name, sortOrder: 0, createdAt: now },
      ]);
      return id;
    },
    []
  );

  const updateFolder = useCallback(
    async (id: string, fields: { name?: string; parentId?: string | null; sortOrder?: number }): Promise<void> => {
      setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, ...fields } : f)));
      await fetch(`/api/notes/folders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
    },
    []
  );

  const deleteFolder = useCallback(async (id: string): Promise<void> => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    // Orphan notes to root optimistically
    setNotes((prev) => prev.map((n) => (n.folderId === id ? { ...n, folderId: null } : n)));
    await fetch(`/api/notes/folders/${id}`, { method: "DELETE" });
  }, []);

  const getNotesByFolder = useCallback(
    (folderId: string | null) => notes.filter((n) => n.folderId === folderId),
    [notes]
  );

  const getNotesByLesson = useCallback(
    (lessonKey: string) => notes.filter((n) => n.lessonKey === lessonKey),
    [notes]
  );

  const getRevisionNotes = useCallback(
    () => notes.filter((n) => n.noteType === "revision"),
    [notes]
  );

  // Wrap setSidebarOpen to clear lesson context when opening via global trigger
  const handleSetSidebarOpen = useCallback((open: boolean) => {
    if (!open) {
      // Keep lesson context so reopening from same lesson still shows it
    }
    setSidebarOpen(open);
  }, []);

  return (
    <NotesContext.Provider
      value={{
        isLoaded,
        isLoggedIn,
        notes,
        folders,
        sidebarOpen,
        setSidebarOpen: handleSetSidebarOpen,
        openNoteId,
        openNote: setOpenNoteId,
        activeLessonKey,
        activeFolderId,
        openSidebarForLesson,
        createNote,
        updateNoteMeta,
        deleteNote,
        createFolder,
        updateFolder,
        deleteFolder,
        getNotesByFolder,
        getNotesByLesson,
        getRevisionNotes,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes(): NotesContextValue {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes must be inside NotesProvider");
  return ctx;
}
