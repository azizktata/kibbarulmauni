"use client";

import { useEffect, useState } from "react";

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

const KEY = "recently-watched";
const MAX = 6;

export function useRecentlyWatched() {
  const [entries, setEntries] = useState<WatchedEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch {}
  }, []);

  return entries;
}

export function saveWatched(entry: Omit<WatchedEntry, "timestamp">) {
  try {
    const raw = localStorage.getItem(KEY);
    const existing: WatchedEntry[] = raw ? JSON.parse(raw) : [];
    // Remove same course if already present
    const filtered = existing.filter(
      (e) =>
        !(e.levelIdx === entry.levelIdx &&
          e.subjectIdx === entry.subjectIdx &&
          e.courseIdx === entry.courseIdx)
    );
    const updated = [{ ...entry, timestamp: Date.now() }, ...filtered].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
}
