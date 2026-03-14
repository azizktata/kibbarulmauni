import { db } from "./index";
import { users, watchedLessons } from "./schema";
import { eq, and } from "drizzle-orm";

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
