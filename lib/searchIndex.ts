import { university } from "@/lib/data";

export type SearchEntry = {
  type: "subject" | "course" | "lesson";
  title: string;
  levelIdx: number;
  subjectIdx: number;
  courseIdx: number;
  lessonIdx?: number;
  levelTitle: string;
  subjectTitle: string;
  courseTitle: string;
  href: string;
};

function buildIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (let lIdx = 0; lIdx < university.length; lIdx++) {
    const level = university[lIdx];
    for (let sIdx = 0; sIdx < level.subjects.length; sIdx++) {
      const subject = level.subjects[sIdx];

      entries.push({
        type: "subject",
        title: subject.title,
        levelIdx: lIdx,
        subjectIdx: sIdx,
        courseIdx: 0,
        levelTitle: level.title,
        subjectTitle: subject.title,
        courseTitle: "",
        href: `/level/${lIdx}/${sIdx}`,
      });

      for (let cIdx = 0; cIdx < subject.courses.length; cIdx++) {
        const course = subject.courses[cIdx];

        entries.push({
          type: "course",
          title: course.title,
          levelIdx: lIdx,
          subjectIdx: sIdx,
          courseIdx: cIdx,
          levelTitle: level.title,
          subjectTitle: subject.title,
          courseTitle: course.title,
          href: `/level/${lIdx}/${sIdx}/${cIdx}`,
        });

        for (let fIdx = 0; fIdx < course.files.length; fIdx++) {
          const lesson = course.files[fIdx];
          entries.push({
            type: "lesson",
            title: lesson.title,
            levelIdx: lIdx,
            subjectIdx: sIdx,
            courseIdx: cIdx,
            lessonIdx: fIdx,
            levelTitle: level.title,
            subjectTitle: subject.title,
            courseTitle: course.title,
            href: `/level/${lIdx}/${sIdx}/${cIdx}?lesson=${fIdx}`,
          });
        }
      }
    }
  }

  return entries;
}

export const searchIndex = buildIndex();
