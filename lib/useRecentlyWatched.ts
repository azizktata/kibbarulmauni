"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getLevel, getSubject, getCourse } from "@/lib/data";
import scholarPlaylistsData from "@/data/scholar-playlists.json";
import type { ScholarPlaylist } from "@/components/ScholarPlaylistsSection";

export type WatchedEntry = {
  levelIdx: number;
  subjectIdx: number;
  courseIdx: number;
  lessonIdx: number;
  courseTitle: string;
  lessonTitle: string;
  levelTitle: string;
  timestamp: number;
  playlistId?: string; // set for YouTube playlist entries
};

const LS_KEY = "recently-watched";
const MAX = 3;

// ── Playlist meta lookup ──────────────────────────────────────────────────────

const allPlaylists = scholarPlaylistsData as Record<string, ScholarPlaylist[]>;
const playlistMeta: Record<string, { title: string; thumbnail: string; scholarName: string }> = {};
for (const [name, playlists] of Object.entries(allPlaylists)) {
  for (const p of playlists) {
    playlistMeta[p.playlistId] = { title: p.title, thumbnail: p.thumbnail, scholarName: name };
  }
}

// ── Key parsers ───────────────────────────────────────────────────────────────

function parseKey(key: string): { levelIdx: number; subjectIdx: number; courseIdx: number; lessonIdx: number } | null {
  const parts = key.split(":").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return null;
  return { levelIdx: parts[0], subjectIdx: parts[1], courseIdx: parts[2], lessonIdx: parts[3] };
}

function keyToPlaylistEntry(key: string, timestamp: number): WatchedEntry | null {
  // key format: "playlist:PLxxxx:3"
  const m = key.match(/^playlist:([^:]+):(\d+)$/);
  if (!m) return null;
  const playlistId = m[1];
  const lessonIdx = Number(m[2]);
  const meta = playlistMeta[playlistId];
  return {
    levelIdx: 0, subjectIdx: 0, courseIdx: 0, lessonIdx,
    courseTitle: meta?.title ?? playlistId,
    lessonTitle: "",
    levelTitle: meta ? `الشيخ ${meta.scholarName}` : "قوائم يوتيوب",
    timestamp,
    playlistId,
  };
}

function keyToEntry(key: string, timestamp: number): WatchedEntry | null {
  if (key.startsWith("playlist:")) return keyToPlaylistEntry(key, timestamp);
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

// ── localStorage helpers ──────────────────────────────────────────────────────

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
  const existing = lsRead().filter((e) => {
    if (entry.playlistId) return e.playlistId !== entry.playlistId;
    return !(e.levelIdx === entry.levelIdx && e.subjectIdx === entry.subjectIdx && e.courseIdx === entry.courseIdx && !e.playlistId);
  });
  lsWrite([{ ...entry, timestamp: Date.now() }, ...existing].slice(0, MAX));
}

// ── Public API ────────────────────────────────────────────────────────────────

export function useRecentlyWatched(): { entries: WatchedEntry[]; loading: boolean } {
  const { status } = useSession();
  const [entries, setEntries] = useState<WatchedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      fetch("/api/recently-visited")
        .then((r) => r.json())
        .then(({ keys }: { keys: string[] }) => {
          const seenCurriculum = new Set<string>();
          const seenPlaylist = new Set<string>();
          const parsed = keys
            .map((k, i) => keyToEntry(k, Date.now() - i))
            .filter((e): e is WatchedEntry => {
              if (!e) return false;
              if (e.playlistId) {
                if (seenPlaylist.has(e.playlistId)) return false;
                seenPlaylist.add(e.playlistId);
              } else {
                const courseKey = `${e.levelIdx}:${e.subjectIdx}:${e.courseIdx}`;
                if (seenCurriculum.has(courseKey)) return false;
                seenCurriculum.add(courseKey);
              }
              return true;
            });
          setEntries(parsed);
        })
        .catch(() => setEntries(lsRead()))
        .finally(() => setLoading(false));
    } else {
      setEntries(lsRead());
      setLoading(false);
    }
  }, [status]);

  return { entries, loading };
}

export function saveWatched(
  entry: Omit<WatchedEntry, "timestamp">,
  isLoggedIn: boolean,
  keyPrefix?: string
) {
  const lessonKey = keyPrefix
    ? `${keyPrefix}:${entry.lessonIdx}`
    : `${entry.levelIdx}:${entry.subjectIdx}:${entry.courseIdx}:${entry.lessonIdx}`;

  lsSave(entry);

  if (isLoggedIn) {
    fetch("/api/recently-visited", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonKey }),
    }).catch(() => {});
  }
}
