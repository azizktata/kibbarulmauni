"use client";

import { useState, useMemo } from "react";
import type { AdminUser } from "@/db/queries";
import { university } from "@/lib/data";

const DEFAULT_USER_EMAIL = "yosra.eltifi@gmail.com";

// ── helpers ───────────────────────────────────────────────────────────────────

function resolveLessonKey(key: string): { course: string; lesson: string; path: string } | null {
  if (key.startsWith("playlist:")) {
    const parts = key.split(":");
    return { course: "Playlist", lesson: `Lesson ${Number(parts[2]) + 1}`, path: `/playlist/${parts[1]}?lesson=${parts[2]}` };
  }
  const [lI, sI, cI, fI] = key.split(":").map(Number);
  const level = university[lI];
  const subject = level?.subjects[sI];
  const course = subject?.courses[cI];
  const lesson = course?.files[fI];
  if (!lesson) return null;
  return {
    course: course.title,
    lesson: lesson.title,
    path: `/level/${lI}/${sI}/${cI}?lesson=${fI}`,
  };
}

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function fmtDateTime(ts: number): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function fmtDateOnly(ts: number): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function daysSince(ts: number): number {
  return Math.floor((Date.now() - ts) / 86_400_000);
}

function lastActivityTs(user: AdminUser): number {
  return Math.max(
    ...user.recentlyVisited.map((r) => r.visitedAt),
    ...user.watchedLessons.map((w) => w.watchedAt),
    0,
  );
}

function activityBadge(days: number): { label: string; cls: string } {
  if (days <= 1) return { label: "Today", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" };
  if (days <= 7) return { label: `${days}d ago`, cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" };
  if (days <= 30) return { label: `${days}d ago`, cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" };
  return { label: `${days}d ago`, cls: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400" };
}

// ── LessonRow ─────────────────────────────────────────────────────────────────

function LessonRow({ lessonKey, ts, position, showPosition }: {
  lessonKey: string; ts: number; position?: number | null; showPosition?: boolean;
}) {
  const resolved = resolveLessonKey(lessonKey);
  return (
    <div className="flex items-start gap-3 py-2 border-b border-stone-100 dark:border-stone-800 last:border-0">
      <div className="flex-1 min-w-0">
        {resolved ? (
          <>
            <a
              href={resolved.path}
              target="_blank"
              rel="noopener"
              className="text-xs font-medium text-primary dark:text-gold hover:underline line-clamp-1"
            >
              {resolved.lesson}
            </a>
            <p className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">{resolved.course}</p>
          </>
        ) : (
          <span className="text-xs text-stone-400 font-mono">{lessonKey}</span>
        )}
      </div>
      <div className="shrink-0 text-right space-y-0.5">
        {showPosition && position != null && position > 0 && (
          <span className="block text-[10px] font-semibold text-gold">⏱ {fmtDuration(position)}</span>
        )}
        <span className="block text-[10px] text-stone-400 tabular-nums">{fmtDateTime(ts)}</span>
      </div>
    </div>
  );
}

// ── UserDetail ────────────────────────────────────────────────────────────────

function UserDetail({ user, onRefresh, refreshing }: { user: AdminUser; onRefresh: () => void; refreshing: boolean }) {
  const lastTs = lastActivityTs(user);
  const lastDays = lastTs ? daysSince(lastTs) : -1;
  const { label: actLabel, cls: actCls } = lastDays >= 0 ? activityBadge(lastDays) : { label: "No activity", cls: "bg-stone-100 text-stone-400" };
  const currentLesson = user.recentlyVisited[0] ?? null;
  const currentResolved = currentLesson ? resolveLessonKey(currentLesson.lessonKey) : null;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* User header */}
      <div className="flex items-center gap-4 p-6 border-b border-stone-200 dark:border-stone-800">
        <div className="w-14 h-14 rounded-full bg-primary/10 dark:bg-primary/30 flex items-center justify-center text-primary dark:text-gold font-bold text-xl shrink-0">
          {(user.name ?? user.email)[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-stone-900 dark:text-stone-100 truncate">{user.name ?? "—"}</p>
          <p className="text-sm text-stone-400 truncate">{user.email}</p>
          {user.age && <p className="text-xs text-stone-400 mt-0.5">Age: {user.age}</p>}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${actCls}`}>{actLabel}</span>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Lessons watched", value: user.watchedCount },
            { label: "Notes", value: user.noteCount },
            { label: "Joined", value: fmtDateOnly(user.createdAt) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-stone-50 dark:bg-stone-800 rounded-xl px-4 py-3">
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 leading-none">{value}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Currently watching */}
        {currentLesson ? (
          <div>
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">Currently watching</h3>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl px-4 py-3">
              {currentResolved ? (
                <>
                  <a
                    href={currentResolved.path}
                    target="_blank"
                    rel="noopener"
                    className="text-sm font-semibold text-stone-800 dark:text-stone-100 hover:underline line-clamp-2"
                  >
                    {currentResolved.lesson}
                  </a>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">{currentResolved.course}</p>
                </>
              ) : (
                <span className="text-sm font-mono text-stone-500">{currentLesson.lessonKey}</span>
              )}
              <div className="flex items-center gap-4 mt-2">
                {currentLesson.playbackPosition != null && currentLesson.playbackPosition > 0 && (
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    ⏱ {fmtDuration(currentLesson.playbackPosition)}
                  </span>
                )}
                <span className="text-xs text-stone-400 tabular-nums">{fmtDateTime(currentLesson.visitedAt)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-stone-50 dark:bg-stone-800 rounded-xl px-4 py-3 text-sm text-stone-400">No recent lessons</div>
        )}

        {/* Recently visited */}
        {user.recentlyVisited.length > 1 && (
          <div>
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
              Recent lessons ({user.recentlyVisited.length})
            </h3>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3 divide-y divide-stone-100 dark:divide-stone-800">
              {user.recentlyVisited.map((r) => (
                <LessonRow key={r.lessonKey} lessonKey={r.lessonKey} ts={r.visitedAt} position={r.playbackPosition} showPosition />
              ))}
            </div>
          </div>
        )}

        {/* All watched lessons */}
        {user.watchedLessons.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
              Watched lessons ({user.watchedLessons.length})
            </h3>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3 max-h-80 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
              {user.watchedLessons.map((w) => (
                <LessonRow key={w.lessonKey} lessonKey={w.lessonKey} ts={w.watchedAt} />
              ))}
            </div>
          </div>
        )}

        {user.watchedLessons.length === 0 && user.recentlyVisited.length === 0 && (
          <p className="text-sm text-stone-400 text-center py-6">No activity recorded yet.</p>
        )}
      </div>
    </div>
  );
}

// ── main dashboard ─────────────────────────────────────────────────────────────

export function AdminDashboard({ users: initialUsers }: { users: AdminUser[] }) {
  const [data, setData] = useState(initialUsers);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(() => {
    return initialUsers.find((u) => u.email === DEFAULT_USER_EMAIL)?.id ?? initialUsers[0]?.id ?? "";
  });

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const json = await res.json();
        setData(json.users);
      }
    } finally {
      setRefreshing(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return data;
    return data.filter(
      (u) => u.email.toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

  const selectedUser = data.find((u) => u.id === selectedId) ?? null;

  const totalWatched = data.reduce((s, u) => s + u.watchedCount, 0);
  const activeToday = data.filter((u) => {
    const last = lastActivityTs(u);
    return last > 0 && daysSince(last) <= 1;
  }).length;

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">Admin Panel</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {data.length} users · {totalWatched} lessons watched · {activeToday} active today
          </p>
        </div>
      </div>

      {/* Body: sidebar + detail */}
      <div className="flex flex-1 min-h-0">
        {/* User list sidebar */}
        <aside className="w-72 shrink-0 border-e border-stone-200 dark:border-stone-800 flex flex-col bg-stone-50 dark:bg-stone-950">
          <div className="p-3 border-b border-stone-200 dark:border-stone-800">
            <input
              type="text"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length === 0 && (
              <p className="text-center text-stone-400 text-sm py-8">No users found</p>
            )}
            {filteredUsers.map((user) => {
              const lastTs = lastActivityTs(user);
              const lastDays = lastTs ? daysSince(lastTs) : -1;
              const { label: actLabel, cls: actCls } = lastDays >= 0
                ? activityBadge(lastDays)
                : { label: "—", cls: "bg-stone-100 text-stone-400" };
              const isSelected = user.id === selectedId;

              return (
                <button
                  key={user.id}
                  onClick={() => setSelectedId(user.id)}
                  className={`w-full text-right px-4 py-3 flex items-center gap-3 border-b border-stone-200/60 dark:border-stone-800/60 transition-colors ${
                    isSelected
                      ? "bg-primary/5 dark:bg-primary/10 border-e-2 border-e-primary"
                      : "hover:bg-white dark:hover:bg-stone-900"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-gold font-bold text-sm shrink-0">
                    {(user.name ?? user.email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? "text-primary dark:text-gold" : "text-stone-800 dark:text-stone-200"}`}>
                      {user.name ?? user.email.split("@")[0]}
                    </p>
                    <p className="text-[10px] text-stone-400 truncate">{user.email}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${actCls}`}>{actLabel}</span>
                    <span className="text-[10px] text-stone-400">{user.watchedCount} lessons</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Detail panel */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-white dark:bg-stone-950">
          {selectedUser ? (
            <UserDetail user={selectedUser} onRefresh={refresh} refreshing={refreshing} />
          ) : (
            <div className="flex items-center justify-center h-full text-stone-400">
              Select a user to view their activity
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
