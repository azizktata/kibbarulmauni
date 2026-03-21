import type { Course, Subject, Level } from "@/lib/data";
import durationsJson from "@/data/durations.json";

const durations = durationsJson as Record<string, number>;

function videoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export type SubjectStats = {
  watchedCount: number;
  totalCount: number;
  watchedSeconds: number;
  totalSeconds: number;
};

export function subjectStats(
  lIdx: number,
  sIdx: number,
  subject: Subject,
  watchedKeys: ReadonlySet<string>
): SubjectStats {
  let watchedCount = 0, totalCount = 0, watchedSeconds = 0, totalSeconds = 0;
  subject.courses.forEach((course, cIdx) => {
    course.files.forEach((file, fIdx) => {
      totalCount++;
      const secs = durations[videoId(file.youtube) ?? ""] ?? 0;
      totalSeconds += secs;
      if (watchedKeys.has(`${lIdx}:${sIdx}:${cIdx}:${fIdx}`)) {
        watchedCount++;
        watchedSeconds += secs;
      }
    });
  });
  return { watchedCount, totalCount, watchedSeconds, totalSeconds };
}

export type LevelStats = {
  watchedCount: number;
  totalCount: number;
  watchedSeconds: number;
  totalSeconds: number;
};

export function levelStats(
  lIdx: number,
  level: Level,
  watchedKeys: ReadonlySet<string>
): LevelStats {
  let watchedCount = 0, totalCount = 0, watchedSeconds = 0, totalSeconds = 0;
  level.subjects.forEach((subject, sIdx) => {
    subject.courses.forEach((course, cIdx) => {
      course.files.forEach((file, fIdx) => {
        totalCount++;
        const secs = durations[videoId(file.youtube) ?? ""] ?? 0;
        totalSeconds += secs;
        if (watchedKeys.has(`${lIdx}:${sIdx}:${cIdx}:${fIdx}`)) {
          watchedCount++;
          watchedSeconds += secs;
        }
      });
    });
  });
  return { watchedCount, totalCount, watchedSeconds, totalSeconds };
}

export function courseProgress(
  lIdx: number,
  sIdx: number,
  cIdx: number,
  course: Course,
  watchedKeys: ReadonlySet<string>
): number {
  if (course.files.length === 0) return 0;
  let watched = 0;
  for (let i = 0; i < course.files.length; i++) {
    if (watchedKeys.has(`${lIdx}:${sIdx}:${cIdx}:${i}`)) watched++;
  }
  return Math.round((watched / course.files.length) * 100);
}

export function subjectProgress(
  lIdx: number,
  sIdx: number,
  subject: Subject,
  watchedKeys: ReadonlySet<string>
): number {
  let total = 0;
  let watched = 0;
  subject.courses.forEach((course, cIdx) => {
    for (let i = 0; i < course.files.length; i++) {
      total++;
      if (watchedKeys.has(`${lIdx}:${sIdx}:${cIdx}:${i}`)) watched++;
    }
  });
  return total === 0 ? 0 : Math.round((watched / total) * 100);
}

export function levelProgress(
  lIdx: number,
  level: Level,
  watchedKeys: ReadonlySet<string>
): number {
  let total = 0;
  let watched = 0;
  level.subjects.forEach((subject, sIdx) => {
    subject.courses.forEach((course, cIdx) => {
      for (let i = 0; i < course.files.length; i++) {
        total++;
        if (watchedKeys.has(`${lIdx}:${sIdx}:${cIdx}:${i}`)) watched++;
      }
    });
  });
  return total === 0 ? 0 : Math.round((watched / total) * 100);
}
