"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useWatched } from "@/lib/watchedContext";
import { courseProgress } from "@/lib/progress";
import type { Course } from "@/lib/data";
import type { LevelColor } from "@/lib/constants";
import { ARABIC_DIGITS } from "@/lib/constants";
import { extractScholars } from "@/lib/data";

function lessonWord(n: number) {
  return n === 1 ? "درس" : "دروس";
}

interface Props {
  lIdx: number;
  sIdx: number;
  courses: Course[];
  col: LevelColor;
}

export function SubjectCoursesListClient({ lIdx, sIdx, courses, col }: Props) {
  const { watchedKeys, isLoaded } = useWatched();

  const progresses = useMemo(
    () =>
      courses.map((course, cIdx) =>
        courseProgress(lIdx, sIdx, cIdx, course, watchedKeys)
      ),
    [courses, lIdx, sIdx, watchedKeys]
  );

  if (courses.length === 0) {
    return (
      <div className="text-center py-20 text-stone-400">
        <div className="text-4xl mb-3">📚</div>
        <p className="text-sm">لا توجد مقررات متاحة حالياً</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {courses.map((course, cIdx) => {
        const scholars = extractScholars(course);
        const pct = progresses[cIdx];
        return (
          <Link
            key={cIdx}
            href={`/level/${lIdx}/${sIdx}/${cIdx}`}
            className="group bg-white dark:bg-white/[0.04] rounded-xl border border-stone-100 dark:border-white/[0.08] shadow-sm dark:shadow-none px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-stone-200 dark:hover:border-white/[0.15] dark:hover:bg-white/[0.08] transition-all duration-200"
          >
            {/* Course number */}
            <div
              className={`shrink-0 w-8 h-8 rounded-lg ${col.bg} text-white text-xs font-bold flex items-center justify-center`}
            >
              {ARABIC_DIGITS[cIdx]}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-stone-800 dark:text-white/80 text-sm leading-snug">
                {course.title}
              </h3>
              {scholars.length > 0 && (
                <p className="text-xs text-stone-400 dark:text-white/35 mt-1 truncate">
                  {scholars.map((s) => `الشيخ ${s}`).join("  ·  ")}
                </p>
              )}
              {/* Progress bar */}
              {isLoaded && pct > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1 bg-stone-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${col.bg} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-medium ${col.text}`}>
                    {pct}٪
                  </span>
                </div>
              )}
            </div>

            {/* Lesson count badge */}
            {course.files.length > 0 && (
              <span
                className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${col.light} ${col.text}`}
              >
                {course.files.length} {lessonWord(course.files.length)}
              </span>
            )}

            {/* RTL forward arrow */}
            <div className="shrink-0 text-stone-200 dark:text-white/15 group-hover:text-stone-400 dark:group-hover:text-white/40 transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M10.5 8L6 4l-1 1L8.5 8 5 11l1 1 4.5-4z" transform="scale(-1,1) translate(-16,0)" />
              </svg>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
