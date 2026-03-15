"use client";

import { useState, useCallback } from "react";
import { ChevronDownIcon, ChevronLeftIcon, FolderIcon, FolderOpenIcon, PlusIcon, NotebookPenIcon, SearchIcon, BookOpenIcon, RotateCcwIcon, PinIcon, FileTextIcon, Trash2Icon, FolderPlusIcon, ArrowRightIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useNotes, type NoteFolder, type NoteSummary } from "@/lib/notesContext";
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
}: {
  note: NoteSummary;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="group flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-stone-100 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(note.id)}
    >
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
      <span className="flex-1 text-xs text-stone-700 truncate leading-snug">
        {note.title}
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
  allFolders,
  allNotes,
  onNoteOpen,
  onNoteDelete,
  onCreateNote,
  onDeleteFolder,
  searchQuery,
  defaultOpen = true,
}: {
  folder: NoteFolder;
  depth: number;
  allFolders: NoteFolder[];
  allNotes: NoteSummary[];
  onNoteOpen: (id: string) => void;
  onNoteDelete: (id: string) => void;
  onCreateNote: (folderId: string) => void;
  onDeleteFolder: (id: string) => void;
  searchQuery: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [hovered, setHovered] = useState(false);

  const children = allFolders.filter((f) => f.parentId === folder.id);
  const folderNotes = allNotes.filter((n) => n.folderId === folder.id);
  const filteredNotes = searchQuery
    ? folderNotes.filter((n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : folderNotes;

  const hasContent = children.length > 0 || filteredNotes.length > 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className="flex items-center gap-1 rounded-lg hover:bg-stone-100 group/folder"
        style={{ paddingRight: `${depth * 12 + 8}px`, paddingLeft: "8px" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <CollapsibleTrigger className="flex items-center gap-1.5 flex-1 py-1.5 min-w-0">
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
        {hovered && (
          <div className="flex items-center gap-0.5 shrink-0">
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
            allFolders={allFolders}
            allNotes={allNotes}
            onNoteOpen={onNoteOpen}
            onNoteDelete={onNoteDelete}
            onCreateNote={onCreateNote}
            onDeleteFolder={onDeleteFolder}
            searchQuery={searchQuery}
          />
        ))}
        {filteredNotes.map((note) => (
          <div key={note.id} style={{ paddingRight: `${(depth + 1) * 12}px` }}>
            <NoteRow note={note} onOpen={onNoteOpen} onDelete={onNoteDelete} />
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

// ── NotesSidebar ──────────────────────────────────────────────────────────────

export function NotesSidebar() {
  const {
    sidebarOpen,
    setSidebarOpen,
    notes,
    folders,
    openNote,
    createNote,
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

  const rootNotes = getNotesByFolder(null);
  const revisionNotes = getRevisionNotes();
  const pinnedNotes = notes.filter((n) => n.isPinned === 1);

  const filteredRoot = search
    ? rootNotes.filter((n) => n.title.toLowerCase().includes(search.toLowerCase()))
    : rootNotes;

  const filteredAll = search
    ? notes.filter((n) => n.title.toLowerCase().includes(search.toLowerCase()))
    : null;

  // Active lesson folder and its notes
  const activeFolder = activeFolderId ? folders.find((f) => f.id === activeFolderId) : null;
  const lessonFolderNotes = activeFolder
    ? notes.filter((n) => n.folderId === activeFolder.id)
    : activeLessonKey
    ? notes.filter((n) => n.lessonKey === activeLessonKey)
    : [];

  const handleCreateNote = useCallback(
    async (folderId: string | null = null) => {
      const id = await createNote({ folderId: folderId ?? null });
      setSidebarOpen(false);
      openNote(id);
    },
    [createNote, openNote, setSidebarOpen]
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

  if (!isLoggedIn) return null;

  // Determine if we're in lesson-context mode
  const isLessonMode = !search && !!activeLessonKey;

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-72 sm:w-80 flex flex-col p-0 gap-0"
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
          {isLessonMode && !filteredAll && (
            <div>
              {/* Lesson folder with all its notes */}
              {activeFolder ? (
                <FolderNode
                  folder={activeFolder}
                  depth={0}
                  allFolders={folders}
                  allNotes={notes}
                  onNoteOpen={(id) => { setSidebarOpen(false); openNote(id); }}
                  onNoteDelete={deleteNote}
                  onCreateNote={handleCreateNote}
                  onDeleteFolder={deleteFolder}
                  searchQuery=""
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
                  onClick={() => {
                    // Show all notes by navigating away from lesson mode
                    // We achieve this by clearing via search box showing or just collapsing
                    setSearch(" ");
                    setTimeout(() => setSearch(""), 0);
                  }}
                  className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <ArrowRightIcon className="w-3 h-3" />
                  كل الملاحظات
                </button>
              </div>
            </div>
          )}

          {/* ── Normal mode (non-lesson or searching) ── */}
          {(!isLessonMode || filteredAll) && (
            <>
              {/* Search results — flat list across all folders */}
              {filteredAll && (
                <div>
                  {filteredAll.length === 0 ? (
                    <p className="text-xs text-stone-400 text-center py-6">
                      لا توجد نتائج
                    </p>
                  ) : (
                    filteredAll.map((note) => (
                      <NoteRow
                        key={note.id}
                        note={note}
                        onOpen={(id) => { setSidebarOpen(false); openNote(id); }}
                        onDelete={deleteNote}
                      />
                    ))
                  )}
                </div>
              )}

              {!filteredAll && (
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
                          />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Folders */}
                  {folders.filter((f) => !f.parentId).map((folder) => (
                    <FolderNode
                      key={folder.id}
                      folder={folder}
                      depth={0}
                      allFolders={folders}
                      allNotes={notes}
                      onNoteOpen={(id) => { setSidebarOpen(false); openNote(id); }}
                      onNoteDelete={deleteNote}
                      onCreateNote={handleCreateNote}
                      onDeleteFolder={deleteFolder}
                      searchQuery={search}
                    />
                  ))}

                  {/* Root notes (no folder) */}
                  {filteredRoot.length > 0 && (
                    <div className="mt-1">
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
                        />
                      ))}
                    </div>
                  )}

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
  );
}
