"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getLevel, getSubject, getCourse } from "@/lib/data";

export type WatchedEntry = {
  levelIdx: number;
  subjectIdx: number;
  courseIdx: number;
  lessonIdx: number;
  courseTitle: string;
  lessonTitle: string;
  levelTitle: string;
  timestamp: number;
};

const LS_KEY = "recently-watched";
const MAX = 6;

function parseKey(key: string): { levelIdx: number; subjectIdx: number; courseIdx: number; lessonIdx: number } | null {
  const parts = key.split(":").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return null;
  return { levelIdx: parts[0], subjectIdx: parts[1], courseIdx: parts[2], lessonIdx: parts[3] };
}

function keyToEntry(key: string, timestamp: number): WatchedEntry | null {
  const idx = parseKey(key);
  if (!idx) return null;
  const { levelIdx, subjectIdx, courseIdx, lessonIdx } = idx;
  const level = getLevel(levelIdx);
  const subject = getSubject(levelIdx, subjectIdx);
  const course = getCourse(levelIdx, subjectIdx, courseIdx);
  if (!level || !subject || !course) return null;
  const lesson = course.files[lessonIdx];
  if (!lesson) return null;
  return {
    levelIdx, subjectIdx, courseIdx, lessonIdx,
    courseTitle: course.title,
    lessonTitle: lesson.title,
    levelTitle: level.title,
    timestamp,
  };
}

// ── localStorage helpers (used for logged-out users) ─────────────────────────

function lsRead(): WatchedEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function lsWrite(entries: WatchedEntry[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(entries)); } catch {}
}

function lsSave(entry: Omit<WatchedEntry, "timestamp">) {
  const existing = lsRead().filter(
    (e) => !(e.levelIdx === entry.levelIdx && e.subjectIdx === entry.subjectIdx && e.courseIdx === entry.courseIdx)
  );
  lsWrite([{ ...entry, timestamp: Date.now() }, ...existing].slice(0, MAX));
}

// ── Public API ────────────────────────────────────────────────────────────────

export function useRecentlyWatched() {
  const { status } = useSession();
  const [entries, setEntries] = useState<WatchedEntry[]>([]);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      fetch("/api/recently-visited")
        .then((r) => r.json())
        .then(({ keys }: { keys: string[] }) => {
          const seen = new Set<string>();
          const parsed = keys
            .map((k, i) => keyToEntry(k, Date.now() - i))
            .filter((e): e is WatchedEntry => {
              if (!e) return false;
              const courseKey = `${e.levelIdx}:${e.subjectIdx}:${e.courseIdx}`;
              if (seen.has(courseKey)) return false;
              seen.add(courseKey);
              return true;
            });
          setEntries(parsed);
        })
        .catch(() => setEntries(lsRead()));
    } else {
      setEntries(lsRead());
    }
  }, [status]);

  return entries;
}

export function saveWatched(
  entry: Omit<WatchedEntry, "timestamp">,
  isLoggedIn: boolean
) {
  const lessonKey = `${entry.levelIdx}:${entry.subjectIdx}:${entry.courseIdx}:${entry.lessonIdx}`;

  // Always update localStorage as a local cache
  lsSave(entry);

  // If logged in, also persist to DB
  if (isLoggedIn) {
    fetch("/api/recently-visited", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonKey }),
    }).catch(() => {});
  }
}
