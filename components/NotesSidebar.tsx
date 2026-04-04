"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronDownIcon, ChevronLeftIcon, FolderIcon, FolderOpenIcon, PlusIcon, NotebookPenIcon, SearchIcon, BookOpenIcon, RotateCcwIcon, PinIcon, FileTextIcon, Trash2Icon, FolderPlusIcon, ArrowRightIcon, GripVerticalIcon, PencilIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useNotes, type NoteFolder, type NoteSummary } from "@/lib/notesContext";
import { NotesSidebarContext, useNotesSidebar } from "@/lib/notesSidebarContext";
import { cn } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────────────────────────

function NoteTypeIcon({ type, className }: { type: string; className?: string }) {
  if (type === "lesson") return <BookOpenIcon className={cn("w-3 h-3", className)} />;
  if (type === "revision") return <RotateCcwIcon className={cn("w-3 h-3", className)} />;
  return <FileTextIcon className={cn("w-3 h-3", className)} />;
}

// ── NoteRow ───────────────────────────────────────────────────────────────────

function NoteRow({
  note,
  onOpen,
  onDelete,
  onDropNote,
  snippet,
}: {
  note: NoteSummary;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onDropNote: (draggedId: string, targetId: string, position: "before" | "after") => void;
  snippet?: string | null;
}) {
  const [hovered, setHovered] = useState(false);
  const [dropPos, setDropPos] = useState<"before" | "after" | null>(null);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("note-drag", note.id);
        e.dataTransfer.effectAllowed = "move";
        // Keep backward compat for folder drop targets
        e.dataTransfer.setData("noteId", note.id);
      }}
      onDragOver={(e) => {
        // Only react to note drags
        if (!e.dataTransfer.types.includes("note-drag")) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setDropPos(e.clientY < rect.top + rect.height / 2 ? "before" : "after");
      }}
      onDragLeave={() => setDropPos(null)}
      onDrop={(e) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData("note-drag");
        if (draggedId && draggedId !== note.id && dropPos) {
          onDropNote(draggedId, note.id, dropPos);
        }
        setDropPos(null);
      }}
      className={cn(
        "group relative flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-stone-100 cursor-pointer",
        dropPos === "before" && "border-t-2 border-blue-400",
        dropPos === "after" && "border-b-2 border-blue-400",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(note.id)}
    >
      <GripVerticalIcon className="w-3 h-3 text-stone-300 shrink-0 opacity-0 group-hover:opacity-100 cursor-grab" />
      <NoteTypeIcon
        type={note.noteType}
        className={
          note.noteType === "lesson"
            ? "text-blue-400 shrink-0"
            : note.noteType === "revision"
            ? "text-amber-400 shrink-0"
            : "text-stone-400 shrink-0"
        }
      />
      <span className="flex-1 min-w-0">
        <span className="block text-xs text-stone-700 truncate leading-snug">{note.title}</span>
        {snippet && (
          <span className="block text-[10px] text-stone-400 truncate leading-snug mt-0.5">{snippet}</span>
        )}
      </span>
      {note.isPinned === 1 && !hovered && (
        <PinIcon className="w-3 h-3 text-stone-300 shrink-0" />
      )}
      {hovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="shrink-0 p-0.5 rounded text-stone-300 hover:text-red-400 transition-colors"
        >
          <Trash2Icon className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ── FolderNode ────────────────────────────────────────────────────────────────

function FolderNode({
  folder,
  depth,
  defaultOpen = true,
}: {
  folder: NoteFolder;
  depth: number;
  defaultOpen?: boolean;
}) {
  const {
    allFolders,
    allNotes,
    searchQuery,
    onNoteOpen,
    onNoteDelete,
    onCreateNote,
    onDeleteFolder,
    onRenameFolder,
    onNestFolder,
    onMoveNote,
    onReorderNote,
    onReorderFolder,
  } = useNotesSidebar();
  const [open, setOpen] = useState(defaultOpen);
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  // "into" = note dragged over folder header (move note into folder)
  // "nest" = folder dragged over folder middle (nest folder inside)
  // "before"/"after" = folder dragged over folder top/bottom (reorder)
  const [dropIndicator, setDropIndicator] = useState<"into" | "nest" | "before" | "after" | null>(null);

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setEditName(folder.name);
    setEditing(true);
  }

  function commitEdit() {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== folder.name) onRenameFolder(folder.id, trimmed);
    setEditing(false);
  }

  const children = allFolders
    .filter((f) => f.parentId === folder.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const folderNotes = allNotes
    .filter((n) => n.folderId === folder.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const filteredNotes = searchQuery
    ? folderNotes.filter((n) => n.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : folderNotes;

  const hasContent = children.length > 0 || filteredNotes.length > 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        draggable={!editing}
        onDragStart={(e) => {
          if (editing) { e.preventDefault(); return; }
          e.dataTransfer.setData("folder-drag", folder.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        className={cn(
          "flex items-center gap-1 rounded-lg hover:bg-stone-100 group/folder transition-colors",
          (dropIndicator === "into" || dropIndicator === "nest") && "bg-amber-50 ring-1 ring-amber-300",
          dropIndicator === "before" && "border-t-2 border-blue-400",
          dropIndicator === "after" && "border-b-2 border-blue-400",
        )}
        style={{ paddingRight: `${depth * 12 + 8}px`, paddingLeft: "8px" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDragOver={(e) => {
          const types = e.dataTransfer.types;
          if (types.includes("note-drag")) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setDropIndicator("into");
          } else if (types.includes("folder-drag")) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const pct = (e.clientY - rect.top) / rect.height;
            if (pct < 0.25) setDropIndicator("before");
            else if (pct > 0.75) setDropIndicator("after");
            else setDropIndicator("nest");
          }
        }}
        onDragLeave={() => setDropIndicator(null)}
        onDrop={(e) => {
          e.preventDefault();
          const noteId = e.dataTransfer.getData("note-drag") || e.dataTransfer.getData("noteId");
          const draggedFolderId = e.dataTransfer.getData("folder-drag");

          if (noteId && dropIndicator === "into") {
            onMoveNote(noteId, folder.id);
          } else if (draggedFolderId && draggedFolderId !== folder.id) {
            if (dropIndicator === "nest") {
              onNestFolder(draggedFolderId, folder.id);
            } else if (dropIndicator === "before" || dropIndicator === "after") {
              onReorderFolder(draggedFolderId, folder.id, dropIndicator);
            }
          }
          setDropIndicator(null);
        }}
      >
        <GripVerticalIcon className="w-3 h-3 text-stone-300 shrink-0 opacity-0 group-hover/folder:opacity-100 cursor-grab" />
        {editing ? (
          <div className="flex items-center gap-1 flex-1 py-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            {open ? (
              <FolderOpenIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <FolderIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") setEditing(false);
                e.stopPropagation();
              }}
              className="flex-1 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-right min-w-0"
            />
          </div>
        ) : (
          <CollapsibleTrigger className="flex items-center gap-1.5 flex-1 py-1.5 min-w-0" onDoubleClick={startEdit}>
            {open ? (
              <FolderOpenIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <FolderIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <span className="text-xs font-medium text-stone-600 truncate text-right">
              {folder.name}
            </span>
            {open ? (
              <ChevronDownIcon className="w-3 h-3 text-stone-300 shrink-0 mr-auto" />
            ) : (
              <ChevronLeftIcon className="w-3 h-3 text-stone-300 shrink-0 mr-auto" />
            )}
          </CollapsibleTrigger>
        )}
        {hovered && !editing && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={startEdit}
              className="p-1 rounded text-stone-300 hover:text-stone-600 transition-colors"
              title="تعديل الاسم"
            >
              <PencilIcon className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onCreateNote(folder.id); }}
              className="p-1 rounded text-stone-300 hover:text-stone-600 transition-colors"
              title="إضافة ملاحظة"
            >
              <PlusIcon className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
              className="p-1 rounded text-stone-300 hover:text-red-400 transition-colors"
              title="حذف المجلد"
            >
              <Trash2Icon className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      <CollapsibleContent>
        {children.map((child) => (
          <FolderNode
            key={child.id}
            folder={child}
            depth={depth + 1}
          />
        ))}
        {filteredNotes.map((note) => (
          <div key={note.id} style={{ paddingRight: `${(depth + 1) * 12}px` }}>
            <NoteRow
              note={note}
              onOpen={onNoteOpen}
              onDelete={onNoteDelete}
              onDropNote={onReorderNote}
            />
          </div>
        ))}
        {!hasContent && !searchQuery && (
          <p
            className="text-[11px] text-stone-300 py-1"
            style={{ paddingRight: `${(depth + 1) * 12 + 8}px` }}
          >
            فارغ
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true if `targetId` is a descendant of `ancestorId` in the folder tree. */
function isDescendant(folders: NoteFolder[], targetId: string, ancestorId: string): boolean {
  let current = folders.find((f) => f.id === targetId);
  while (current) {
    if (current.parentId === ancestorId) return true;
    current = folders.find((f) => f.id === current!.parentId);
  }
  return false;
}

// ── NotesSidebar ──────────────────────────────────────────────────────────────

export function NotesSidebar() {
  const {
    sidebarOpen,
    setSidebarOpen,
    notes,
    folders,
    openNote,
    createNote,
    updateNoteMeta,
    updateFolder,
    deleteNote,
    createFolder,
    deleteFolder,
    getNotesByFolder,
    getRevisionNotes,
    isLoggedIn,
    activeLessonKey,
    activeFolderId,
  } = useNotes();

  const [search, setSearch] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [rootDragOver, setRootDragOver] = useState(false);

  type SearchResult = NoteSummary & { snippet: string | null };
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchAbortRef.current?.abort();

    if (!search.trim()) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      searchAbortRef.current = controller;
      try {
        const res = await fetch(`/api/notes/search?q=${encodeURIComponent(search.trim())}`, { signal: controller.signal });
        const { results } = await res.json() as { results: SearchResult[] };
        setSearchResults(results);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 350);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchAbortRef.current?.abort();
    };
  }, [search]);

  const rootNotes = getNotesByFolder(null);
  const revisionNotes = getRevisionNotes();
  const pinnedNotes = notes.filter((n) => n.isPinned === 1);

  const sortedRootFolders = [...folders.filter((f) => !f.parentId)].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  const sortedRootNotes = [...rootNotes].sort((a, b) => a.sortOrder - b.sortOrder);

  const filteredRoot = search ? [] : sortedRootNotes;

  // Active lesson folder and its notes
  const activeFolder = activeFolderId ? folders.find((f) => f.id === activeFolderId) : null;
  const lessonFolderNotes = activeFolder
    ? notes.filter((n) => n.folderId === activeFolder.id)
    : activeLessonKey
    ? notes.filter((n) => n.lessonKey === activeLessonKey)
    : [];

  const handleCreateNote = useCallback(
    async (folderId: string | null = null) => {
      // Use activeLessonKey if available, otherwise inherit from existing notes in this folder
      const lessonKey =
        (folderId === activeFolderId && activeLessonKey)
          ? activeLessonKey
          : folderId
          ? (notes.find((n) => n.folderId === folderId && n.lessonKey)?.lessonKey ?? null)
          : null;
      const id = await createNote({
        folderId: folderId ?? null,
        lessonKey: lessonKey ?? undefined,
        noteType: lessonKey ? "lesson" : "concept",
      });
      setSidebarOpen(false);
      openNote(id);
    },
    [createNote, openNote, setSidebarOpen, activeFolderId, activeLessonKey, notes]
  );

  const handleCreateLessonNote = useCallback(async () => {
    const id = await createNote({
      folderId: activeFolderId ?? null,
      lessonKey: activeLessonKey ?? undefined,
      noteType: "lesson",
    });
    setSidebarOpen(false);
    openNote(id);
  }, [createNote, openNote, setSidebarOpen, activeFolderId, activeLessonKey]);

  const handleCreateFolderSubmit = useCallback(async () => {
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName.trim());
    setNewFolderName("");
    setCreatingFolder(false);
  }, [newFolderName, createFolder]);

  // ── Reorder notes (fractional sortOrder) ─────────────────────────────────
  const handleReorderNote = useCallback(
    (draggedId: string, targetId: string, position: "before" | "after") => {
      const target = notes.find((n) => n.id === targetId);
      if (!target) return;
      const siblings = notes
        .filter((n) => n.folderId === target.folderId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const targetIdx = siblings.findIndex((n) => n.id === targetId);
      let newSortOrder: number;
      if (position === "before") {
        const prev = siblings[targetIdx - 1];
        newSortOrder = prev
          ? (prev.sortOrder + target.sortOrder) / 2
          : target.sortOrder - 1000;
      } else {
        const next = siblings[targetIdx + 1];
        newSortOrder = next
          ? (target.sortOrder + next.sortOrder) / 2
          : target.sortOrder + 1000;
      }
      updateNoteMeta(draggedId, { folderId: target.folderId, sortOrder: newSortOrder });
    },
    [notes, updateNoteMeta]
  );

  // ── Reorder folders ──────────────────────────────────────────────────────
  const handleReorderFolder = useCallback(
    (draggedId: string, targetId: string, position: "before" | "after") => {
      const target = folders.find((f) => f.id === targetId);
      if (!target) return;
      const siblings = folders
        .filter((f) => f.parentId === target.parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const targetIdx = siblings.findIndex((f) => f.id === targetId);
      let newSortOrder: number;
      if (position === "before") {
        const prev = siblings[targetIdx - 1];
        newSortOrder = prev
          ? (prev.sortOrder + target.sortOrder) / 2
          : target.sortOrder - 1000;
      } else {
        const next = siblings[targetIdx + 1];
        newSortOrder = next
          ? (target.sortOrder + next.sortOrder) / 2
          : target.sortOrder + 1000;
      }
      updateFolder(draggedId, { sortOrder: newSortOrder });
    },
    [folders, updateFolder]
  );

  if (!isLoggedIn) return null;

  const isSearching = !!search.trim();
  // Determine if we're in lesson-context mode
  const isLessonMode = !isSearching && !!activeLessonKey;

  const sidebarCtx = {
    allFolders: folders,
    allNotes: notes,
    searchQuery: search,
    onNoteOpen: (id: string) => { setSidebarOpen(false); openNote(id); },
    onNoteDelete: deleteNote,
    onCreateNote: handleCreateNote,
    onDeleteFolder: deleteFolder,
    onRenameFolder: (id: string, name: string) => updateFolder(id, { name }),
    onNestFolder: (id: string, parentId: string) => {
      if (!isDescendant(folders, parentId, id)) updateFolder(id, { parentId });
    },
    onMoveNote: (noteId: string, folderId: string | null) => updateNoteMeta(noteId, { folderId }),
    onReorderNote: handleReorderNote,
    onReorderFolder: handleReorderFolder,
  };

  return (
    <NotesSidebarContext.Provider value={sidebarCtx}>
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-72 sm:w-80 flex flex-col p-0 gap-0 bg-[#F6F5F1] text-[oklch(0.15_0_0)]"
      >
        {/* Header */}
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-stone-100 shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-sm font-semibold text-stone-800">
              <NotebookPenIcon className="w-4 h-4 text-stone-400" />
              {isLessonMode ? "ملاحظات الدرس" : "ملاحظاتي"}
            </SheetTitle>
            <div className="flex items-center gap-1">
              {!isLessonMode && (
                <>
                  <button
                    onClick={() => setCreatingFolder(true)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                    title="مجلد جديد"
                  >
                    <FolderPlusIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCreateNote(null)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    title="ملاحظة جديدة"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </>
              )}
              {isLessonMode && (
                <button
                  onClick={handleCreateLessonNote}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                  title="إضافة ملاحظة للدرس"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-2">
            <SearchIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
            <input
              type="text"
              placeholder="بحث في الملاحظات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg pr-8 pl-3 py-1.5 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-300 text-right"
            />
          </div>

          {/* New folder input */}
          {creatingFolder && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                autoFocus
                placeholder="اسم المجلد..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolderSubmit();
                  if (e.key === "Escape") { setCreatingFolder(false); setNewFolderName(""); }
                }}
                className="flex-1 text-xs bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-right"
              />
              <button
                onClick={handleCreateFolderSubmit}
                className="text-xs text-emerald-600 font-medium hover:text-emerald-700"
              >
                حفظ
              </button>
            </div>
          )}
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-2 px-2">

          {/* ── Lesson mode: show lesson folder prominently ── */}
          {isLessonMode && !isSearching && (
            <div>
              {/* Lesson folder with all its notes */}
              {activeFolder ? (
                <FolderNode
                  folder={activeFolder}
                  depth={0}
                  defaultOpen={true}
                />
              ) : (
                /* Lesson has no folder yet — just show lesson-keyed notes flat */
                lessonFolderNotes.length > 0 ? (
                  lessonFolderNotes.map((note) => (
                    <NoteRow
                      key={note.id}
                      note={note}
                      onOpen={(id) => { setSidebarOpen(false); openNote(id); }}
                      onDelete={deleteNote}
                      onDropNote={handleReorderNote}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
                    <NotebookPenIcon className="w-7 h-7 text-stone-200" />
                    <p className="text-xs text-stone-400">لا توجد ملاحظات لهذا الدرس بعد</p>
                    <button
                      onClick={handleCreateLessonNote}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      إضافة أول ملاحظة
                    </button>
                  </div>
                )
              )}

              {/* Divider + "back to all notes" link */}
              <div className="mt-4 pt-3 border-t border-stone-100 px-2">
                <button
                  onClick={() => setSearch("")}
                  className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <ArrowRightIcon className="w-3 h-3" />
                  كل الملاحظات
                </button>
              </div>
            </div>
          )}

          {/* ── Normal mode (non-lesson or searching) ── */}
          {(!isLessonMode || isSearching) && (
            <>
              {/* Search results — server-side, searches title + content */}
              {isSearching && (
                <div>
                  {searchLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="w-4 h-4 border-2 border-stone-200 border-t-stone-400 rounded-full animate-spin" />
                    </div>
                  ) : searchResults === null ? null : searchResults.length === 0 ? (
                    <p className="text-xs text-stone-400 text-center py-6">لا توجد نتائج</p>
                  ) : (
                    searchResults.map((note) => (
                      <NoteRow
                        key={note.id}
                        note={note}
                        onOpen={(id) => { setSidebarOpen(false); openNote(id); }}
                        onDelete={deleteNote}
                        onDropNote={handleReorderNote}
                        snippet={note.snippet}
                      />
                    ))
                  )}
                </div>
              )}

              {!isSearching && (
                <>
                  {/* Pinned */}
                  {pinnedNotes.length > 0 && (
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="flex items-center gap-1.5 w-full px-2 py-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wide hover:text-stone-600 transition-colors">
                        <PinIcon className="w-3 h-3" />
                        مثبّتة
                        <ChevronDownIcon className="w-3 h-3 mr-auto" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {pinnedNotes.map((note) => (
                          <NoteRow
                            key={note.id}
                            note={note}
                            onOpen={(id) => { setSidebarOpen(false); openNote(id); }}
                            onDelete={deleteNote}
                            onDropNote={handleReorderNote}
                          />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Revision */}
                  {revisionNotes.length > 0 && (
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="flex items-center gap-1.5 w-full px-2 py-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wide hover:text-stone-600 transition-colors mt-1">
                        <RotateCcwIcon className="w-3 h-3" />
                        للمراجعة
                        <ChevronDownIcon className="w-3 h-3 mr-auto" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {revisionNotes.map((note) => (
                          <NoteRow
                            key={note.id}
                            note={note}
                            onOpen={(id) => { setSidebarOpen(false); openNote(id); }}
                            onDelete={deleteNote}
                            onDropNote={handleReorderNote}
                          />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Folders */}
                  {sortedRootFolders.map((folder) => (
                    <FolderNode
                      key={folder.id}
                      folder={folder}
                      depth={0}
                    />
                  ))}

                  {/* Root notes (no folder) — also a drop target */}
                  <div
                    className={cn(
                      "mt-1 rounded-lg transition-colors",
                      rootDragOver && "bg-stone-100 ring-1 ring-stone-300"
                    )}
                    onDragOver={(e) => {
                      if (!e.dataTransfer.types.includes("note-drag")) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setRootDragOver(true);
                    }}
                    onDragEnter={(e) => { e.preventDefault(); setRootDragOver(true); }}
                    onDragLeave={() => setRootDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setRootDragOver(false);
                      const noteId = e.dataTransfer.getData("note-drag") || e.dataTransfer.getData("noteId");
                      if (noteId) updateNoteMeta(noteId, { folderId: null });
                    }}
                  >
                    {folders.length > 0 && (
                      <p className="px-2 py-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wide">
                        بدون مجلد
                      </p>
                    )}
                    {filteredRoot.map((note) => (
                      <NoteRow
                        key={note.id}
                        note={note}
                        onOpen={(id) => { setSidebarOpen(false); openNote(id); }}
                        onDelete={deleteNote}
                        onDropNote={handleReorderNote}
                      />
                    ))}
                    {filteredRoot.length === 0 && rootDragOver && (
                      <p className="text-[11px] text-stone-400 text-center py-2">اسحب هنا لإزالة من المجلد</p>
                    )}
                  </div>

                  {/* Empty state */}
                  {notes.length === 0 && (
                    <div className="flex flex-col items-center gap-3 py-12 px-4 text-center">
                      <NotebookPenIcon className="w-8 h-8 text-stone-200" />
                      <p className="text-xs text-stone-400">
                        لا توجد ملاحظات بعد
                      </p>
                      <button
                        onClick={() => handleCreateNote(null)}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        إنشاء أول ملاحظة
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 py-3 border-t border-stone-100">
          <p className="text-[11px] text-stone-400 text-center">
            {notes.length} ملاحظة · {folders.length} مجلد
          </p>
        </div>
      </SheetContent>
    </Sheet>
    </NotesSidebarContext.Provider>
  );
}
