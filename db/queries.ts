import { db } from "./index";
import { users, watchedLessons, recentlyVisited, noteFolders, notes } from "./schema";
import { eq, and, desc, or, like, inArray } from "drizzle-orm";

export async function upsertUser(email: string, name: string | null): Promise<string> {
  const id = crypto.randomUUID();
  await db
    .insert(users)
    .values({ id, email, name })
    .onConflictDoUpdate({
      target: users.email,
      set: { name },
    });
  const user = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .get();
  return user!.id;
}

export async function getUserByEmail(
  email: string
): Promise<{ id: string; name: string | null; age: number | null } | undefined> {
  return db
    .select({ id: users.id, name: users.name, age: users.age })
    .from(users)
    .where(eq(users.email, email))
    .get();
}

export async function getUserById(
  id: string
): Promise<{ id: string; name: string | null; age: number | null } | undefined> {
  return db
    .select({ id: users.id, name: users.name, age: users.age })
    .from(users)
    .where(eq(users.id, id))
    .get();
}

export async function updateUser(
  id: string,
  fields: { name?: string; age?: number }
): Promise<void> {
  await db.update(users).set(fields).where(eq(users.id, id));
}

export async function getWatchedKeys(userId: string): Promise<string[]> {
  const rows = await db
    .select({ lessonKey: watchedLessons.lessonKey })
    .from(watchedLessons)
    .where(eq(watchedLessons.userId, userId));
  return rows.map((r) => r.lessonKey);
}

export async function markWatched(userId: string, lessonKey: string): Promise<void> {
  await db
    .insert(watchedLessons)
    .values({ userId, lessonKey })
    .onConflictDoNothing();
}

export async function unmarkWatched(userId: string, lessonKey: string): Promise<void> {
  await db
    .delete(watchedLessons)
    .where(and(eq(watchedLessons.userId, userId), eq(watchedLessons.lessonKey, lessonKey)));
}

// ── Recently visited ──────────────────────────────────────────────────────────

export async function upsertRecentlyVisited(userId: string, lessonKey: string, position?: number): Promise<void> {
  const set: Record<string, unknown> = { visitedAt: Date.now() };
  if (position !== undefined) set.playbackPosition = position;
  await db
    .insert(recentlyVisited)
    .values({ userId, lessonKey, visitedAt: Date.now(), playbackPosition: position ?? null })
    .onConflictDoUpdate({
      target: [recentlyVisited.userId, recentlyVisited.lessonKey],
      set,
    });

  // Keep only the 3 most recent entries — batch-delete anything older
  const all = await db
    .select({ lessonKey: recentlyVisited.lessonKey })
    .from(recentlyVisited)
    .where(eq(recentlyVisited.userId, userId))
    .orderBy(desc(recentlyVisited.visitedAt));
  const toDelete = all.slice(3).map((r) => r.lessonKey);
  if (toDelete.length > 0) {
    await db.delete(recentlyVisited).where(
      and(eq(recentlyVisited.userId, userId), inArray(recentlyVisited.lessonKey, toDelete))
    );
  }
}

export async function getRecentlyVisited(userId: string): Promise<{ key: string; position: number }[]> {
  const rows = await db
    .select({ lessonKey: recentlyVisited.lessonKey, playbackPosition: recentlyVisited.playbackPosition })
    .from(recentlyVisited)
    .where(eq(recentlyVisited.userId, userId))
    .orderBy(desc(recentlyVisited.visitedAt))
    .limit(3);
  return rows.map((r) => ({ key: r.lessonKey, position: r.playbackPosition ?? 0 }));
}

// ── Note folders ──────────────────────────────────────────────────────────────

export async function getFolders(userId: string) {
  return db
    .select()
    .from(noteFolders)
    .where(eq(noteFolders.userId, userId))
    .orderBy(noteFolders.sortOrder, noteFolders.createdAt);
}

export async function folderBelongsToUser(folderId: string, userId: string): Promise<boolean> {
  const row = await db
    .select({ id: noteFolders.id })
    .from(noteFolders)
    .where(and(eq(noteFolders.id, folderId), eq(noteFolders.userId, userId)))
    .get();
  return row !== undefined;
}

export async function createFolder(
  userId: string,
  name: string,
  parentId: string | null = null
): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(noteFolders).values({ id, userId, name, parentId });
  return id;
}

export async function updateFolder(
  id: string,
  userId: string,
  fields: { name?: string; parentId?: string | null; sortOrder?: number }
): Promise<void> {
  await db
    .update(noteFolders)
    .set(fields)
    .where(and(eq(noteFolders.id, id), eq(noteFolders.userId, userId)));
}

export async function deleteFolder(id: string, userId: string): Promise<void> {
  // Orphan notes to root before deleting folder
  await db
    .update(notes)
    .set({ folderId: null })
    .where(and(eq(notes.folderId, id), eq(notes.userId, userId)));
  await db
    .delete(noteFolders)
    .where(and(eq(noteFolders.id, id), eq(noteFolders.userId, userId)));
}

// ── Notes ─────────────────────────────────────────────────────────────────────

// Returns all note metadata except content (for sidebar performance)
export async function getNoteSummaries(userId: string) {
  return db
    .select({
      id: notes.id,
      userId: notes.userId,
      folderId: notes.folderId,
      lessonKey: notes.lessonKey,
      noteType: notes.noteType,
      title: notes.title,
      isPinned: notes.isPinned,
      sortOrder: notes.sortOrder,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt));
}

export async function getNoteContent(
  id: string,
  userId: string
): Promise<{ content: string } | undefined> {
  return db
    .select({ content: notes.content })
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .get();
}

export async function getNotesByLesson(userId: string, lessonKey: string) {
  return db
    .select({
      id: notes.id,
      userId: notes.userId,
      folderId: notes.folderId,
      lessonKey: notes.lessonKey,
      noteType: notes.noteType,
      title: notes.title,
      isPinned: notes.isPinned,
      sortOrder: notes.sortOrder,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.lessonKey, lessonKey)))
    .orderBy(desc(notes.updatedAt));
}

export async function createNote(
  userId: string,
  fields: {
    title?: string;
    content?: string;
    folderId?: string | null;
    lessonKey?: string | null;
    noteType?: string;
  } = {}
): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(notes).values({
    id,
    userId,
    title: fields.title ?? "ملاحظة جديدة",
    content: fields.content ?? "",
    folderId: fields.folderId ?? null,
    lessonKey: fields.lessonKey ?? null,
    noteType: fields.noteType ?? "concept",
  });
  return id;
}

export async function updateNote(
  id: string,
  userId: string,
  fields: {
    title?: string;
    content?: string;
    folderId?: string | null;
    lessonKey?: string | null;
    noteType?: string;
    isPinned?: number;
    sortOrder?: number;
  }
): Promise<void> {
  await db
    .update(notes)
    .set({ ...fields, updatedAt: Date.now() })
    .where(and(eq(notes.id, id), eq(notes.userId, userId)));
}

export async function deleteNote(id: string, userId: string): Promise<void> {
  await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)));
}

export async function searchNotes(userId: string, q: string) {
  const rows = await db
    .select({
      id: notes.id,
      userId: notes.userId,
      folderId: notes.folderId,
      lessonKey: notes.lessonKey,
      noteType: notes.noteType,
      title: notes.title,
      content: notes.content,
      isPinned: notes.isPinned,
      sortOrder: notes.sortOrder,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        or(like(notes.title, `%${q}%`), like(notes.content, `%${q}%`))
      )
    )
    .orderBy(desc(notes.updatedAt));

  return rows.map(({ content, ...summary }) => {
    const matchIdx = content.toLowerCase().indexOf(q.toLowerCase());
    let snippet: string | null = null;
    if (matchIdx !== -1) {
      const start = Math.max(0, matchIdx - 40);
      const end = Math.min(content.length, matchIdx + q.length + 40);
      snippet =
        (start > 0 ? "…" : "") +
        content.slice(start, end) +
        (end < content.length ? "…" : "");
    }
    return { ...summary, snippet };
  });
}
