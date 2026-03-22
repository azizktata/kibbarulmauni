import { university } from "@/lib/data";
import { canonicalize } from "@/lib/scholarAliases";
import durationsJson from "@/data/durations.json";

const durations = durationsJson as Record<string, number>;

function extractVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export type ScholarCourse = {
  levelIdx: number;
  subjectIdx: number;
  courseIdx: number;
  courseTitle: string;
  subjectTitle: string;
  levelTitle: string;
  lessonCount: number;
};

export type Scholar = {
  name: string;
  courses: ScholarCourse[];
  totalLessons: number;
  totalSeconds: number;
};

function extractScholarNames(lessonTitle: string): string[] {
  const names: string[] = [];
  const re = /(?:الشيخ|للشيخ|للعلامة|العلامة)\s+(\S+(?:\s+\S+)*?)(?=\s*(?:الشيخ|للشيخ|للعلامة|العلامة|$))/g;
  let m;
  while ((m = re.exec(lessonTitle)) !== null) {
    const raw = m[1].trim().replace(/[\s\-–—]+$/, "").trim();
    if (raw) names.push(raw);
  }
  return names;
}

export function buildScholarsIndex(): Scholar[] {
  // Map from short name → Scholar
  const map = new Map<string, Scholar>();

  for (let lIdx = 0; lIdx < university.length; lIdx++) {
    const level = university[lIdx];
    for (let sIdx = 0; sIdx < level.subjects.length; sIdx++) {
      const subject = level.subjects[sIdx];
      for (let cIdx = 0; cIdx < subject.courses.length; cIdx++) {
        const course = subject.courses[cIdx];

        // Collect all full names from this course's lessons
        const fullNames = new Set<string>();
        for (const file of course.files) {
          for (const name of extractScholarNames(file.title)) {
            fullNames.add(name);
          }
        }

        if (fullNames.size === 0) continue;

        // Deduplicate: drop any name that is a suffix of a longer name (O(n log n))
        const nameArr = [...fullNames].sort((a, b) => b.length - a.length);
        const kept: string[] = [];
        for (const n of nameArr) {
          if (!kept.some((k) => k.endsWith(n))) kept.push(n);
        }
        const unique = kept;

        const entry: ScholarCourse = {
          levelIdx: lIdx,
          subjectIdx: sIdx,
          courseIdx: cIdx,
          courseTitle: course.title,
          subjectTitle: subject.title,
          levelTitle: level.title,
          lessonCount: course.files.length,
        };

        for (const full of unique) {
          const key = canonicalize(full);
          if (key === null) continue; // not a real scholar
          if (!map.has(key)) {
            map.set(key, { name: key, courses: [], totalLessons: 0, totalSeconds: 0 });
          }
          const scholar = map.get(key)!;
          // Avoid duplicate course entries
          const alreadyAdded = scholar.courses.some(
            (c) => c.levelIdx === lIdx && c.subjectIdx === sIdx && c.courseIdx === cIdx
          );
          if (!alreadyAdded) {
            scholar.courses.push(entry);
            scholar.totalLessons += entry.lessonCount;
            for (const file of course.files) {
              const id = extractVideoId(file.youtube);
              if (id) scholar.totalSeconds += durations[id] ?? 0;
            }
          }
        }
      }
    }
  }

  return [...map.values()].sort((a, b) => b.totalLessons - a.totalLessons);
}

export const scholarsIndex = buildScholarsIndex();
