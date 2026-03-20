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

export const noteFolders = sqliteTable("note_folder", {
  id:        text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:    text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId:  text("parentId"),
  name:      text("name").notNull(),
  sortOrder: integer("sortOrder").notNull().$defaultFn(() => 0),
  createdAt: integer("createdAt").$defaultFn(() => Date.now()),
});

export const recentlyVisited = sqliteTable("recently_visited", {
  userId:    text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonKey: text("lessonKey").notNull(), // "levelIdx:subjectIdx:courseIdx:lessonIdx"
  visitedAt: integer("visitedAt").notNull().$defaultFn(() => Date.now()),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.lessonKey] }),
}));

export const notes = sqliteTable("note", {
  id:        text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:    text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  folderId:  text("folderId"),
  lessonKey: text("lessonKey"),
  noteType:  text("noteType").notNull().$defaultFn(() => "concept"),
  title:     text("title").notNull().$defaultFn(() => "ملاحظة جديدة"),
  content:   text("content").notNull().$defaultFn(() => ""),
  isPinned:  integer("isPinned").notNull().$defaultFn(() => 0),
  sortOrder: integer("sortOrder").notNull().$defaultFn(() => 0),
  createdAt: integer("createdAt").$defaultFn(() => Date.now()),
  updatedAt: integer("updatedAt").$defaultFn(() => Date.now()),
});
