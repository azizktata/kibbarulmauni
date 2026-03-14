"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useWatched } from "@/lib/watchedContext";
import { subjectProgress } from "@/lib/progress";
import type { Subject } from "@/lib/data";
import type { LevelColor } from "@/lib/constants";
import { ARABIC_DIGITS } from "@/lib/constants";
import { countSubjectLessons } from "@/lib/data";
import { ProgressRing } from "./ProgressRing";

function lessonWord(n: number) {
  return n === 1 ? "درس" : "دروس";
}

interface Props {
  levelIdx: number;
  subjects: Subject[];
  col: LevelColor;
}

export function LevelSubjectsGrid({ levelIdx, subjects, col }: Props) {
  const { watchedKeys, isLoaded } = useWatched();

  const progresses = useMemo(
    () =>
      subjects.map((subject, sIdx) =>
        subjectProgress(levelIdx, sIdx, subject, watchedKeys)
      ),
    [subjects, levelIdx, watchedKeys]
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {subjects.map((subject, sIdx) => {
        const lessons = countSubjectLessons(subject);
        const pct = progresses[sIdx];
        return (
          <Link
            key={sIdx}
            href={`/level/${levelIdx}/${sIdx}`}
            className="group bg-white rounded-2xl border border-stone-100 shadow-sm p-5 hover:shadow-md hover:border-stone-200 transition-all duration-200 flex items-start gap-4"
          >
            {/* Number badge */}
            <div
              className={`shrink-0 w-9 h-9 rounded-xl ${col.bg} text-white text-sm font-bold flex items-center justify-center shadow-sm mt-0.5`}
            >
              {ARABIC_DIGITS[sIdx]}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-stone-800 text-sm leading-snug group-hover:text-stone-900">
                {subject.title}
              </h3>
              <div className="flex items-center gap-2 mt-2 text-xs text-stone-400">
                <span>{subject.courses.length} مقرر</span>
                {lessons > 0 && (
                  <>
                    <span className="text-stone-200">·</span>
                    <span>{lessons} {lessonWord(lessons)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Progress ring + arrow */}
            <div className="shrink-0 flex flex-col items-center gap-1 mt-0.5">
              {isLoaded && pct > 0 ? (
                <ProgressRing pct={pct} size={28} stroke={3} color={col.ring} />
              ) : (
                <div className="text-stone-200 group-hover:text-stone-400 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M10 8L6 4.5l.9-.9L11.8 8 6.9 12.4 6 11.5 10 8z" transform="scale(-1,1) translate(-16,0)" />
                  </svg>
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
