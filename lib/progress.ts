import type { Course, Subject, Level } from "@/lib/data";

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
