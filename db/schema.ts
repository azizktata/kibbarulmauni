import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("user", {
  id:        text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:      text("name"),
  email:     text("email").notNull().unique(),
  age:       integer("age"),
  createdAt: integer("createdAt").$defaultFn(() => Date.now()),
});

export const watchedLessons = sqliteTable("watched_lesson", {
  userId:    text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonKey: text("lessonKey").notNull(), // "levelIdx:subjectIdx:courseIdx:lessonIdx"
  watchedAt: integer("watchedAt").$defaultFn(() => Date.now()),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.lessonKey] }),
}));
