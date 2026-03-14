import raw from "@/data/kibbarulmauni.json";
import { canonicalize } from "@/lib/scholarAliases";

export type Lesson = {
  title: string;
  url: string;
  youtube: string | null;
};

export type Course = {
  title: string;
  url: string;
  files: Lesson[];
};

export type Subject = {
  title: string;
  url: string;
  courses: Course[];
};

export type Level = {
  title: string;
  url: string;
  subjects: Subject[];
};

export const university = raw as Level[];

export function getLevel(idx: number): Level | undefined {
  return university[idx];
}

export function getSubject(
  levelIdx: number,
  subjectIdx: number
): Subject | undefined {
  return university[levelIdx]?.subjects[subjectIdx];
}

export function getCourse(
  levelIdx: number,
  subjectIdx: number,
  courseIdx: number
): Course | undefined {
  return university[levelIdx]?.subjects[subjectIdx]?.courses[courseIdx];
}

export function countLevelLessons(level: Level): number {
  return level.subjects.reduce(
    (sum, s) =>
      sum + s.courses.reduce((s2, c) => s2 + c.files.length, 0),
    0
  );
}

export function countSubjectLessons(subject: Subject): number {
  return subject.courses.reduce((sum, c) => sum + c.files.length, 0);
}

/**
 * Extract unique scholar names from a course's lesson titles.
 * Applies the same canonicalization and alias map used on the scholars index.
 */
export function extractScholars(course: Course): string[] {
  const fullNames = new Set<string>();
  for (const file of course.files) {
    const m = file.title.match(/(?:الشيخ|للشيخ|للعلامة|العلامة)\s+(.+)$/);
    if (!m) continue;
    fullNames.add(m[1].trim().replace(/[\s\-–—]+$/, "").trim());
  }
  // Drop any name that is a trailing word-suffix of a longer name in the set
  const names = [...fullNames];
  const deduplicated = names.filter(
    (name) => !names.some((other) => other !== name && other.endsWith(name))
  );
  // Canonicalize, filter out nulls, deduplicate canonical names
  const seen = new Set<string>();
  const result: string[] = [];
  for (const full of deduplicated) {
    const canonical = canonicalize(full);
    if (!canonical || seen.has(canonical)) continue;
    seen.add(canonical);
    result.push(canonical);
  }
  return result;
}
