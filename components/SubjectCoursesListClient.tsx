"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { useWatched } from "@/lib/watchedContext";
import { courseProgress } from "@/lib/progress";
import type { Course } from "@/lib/data";
import { extractScholars } from "@/lib/data";

function extractYoutubeId(url: string): string | null {
  const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function getFirstYoutubeId(course: Course): string | null {
  for (const lesson of course.files) {
    if (lesson.youtube) {
      const id = extractYoutubeId(lesson.youtube);
      if (id) return id;
    }
  }
  return null;
}

interface Props {
  lIdx: number;
  sIdx: number;
  courses: Course[];
}

export function SubjectCoursesListClient({ lIdx, sIdx, courses }: Props) {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {courses.map((course, cIdx) => {
        const scholars = extractScholars(course);
        const pct = progresses[cIdx];
        const youtubeId = getFirstYoutubeId(course);
        const thumbUrl = youtubeId
          ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
          : null;

        return (
          <Link
            key={cIdx}
            href={`/level/${lIdx}/${sIdx}/${cIdx}`}
            className="group bg-white dark:bg-white/[0.04] rounded-2xl border border-stone-100 dark:border-white/[0.08] shadow-sm dark:shadow-none overflow-hidden hover:shadow-lg hover:-translate-y-1 hover:border-gold/30 transition-all duration-200 flex flex-col"
          >
            
            {/* Thumbnail */}
            <div className="relative w-full aspect-video bg-stone-100 dark:bg-white/[0.06] overflow-hidden">

              {thumbUrl ? (
                <>
                <Image
                  src={thumbUrl}
                  alt={course.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                                            <div className="absolute inset-0 bg-primary-dark/5 group-hover:bg-transparent transition-colors duration-300" />
                  </>

              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                  <svg className="w-10 h-10 text-primary/20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                  </svg>
                </div>
              )}

              {/* Progress bar overlay at bottom of thumbnail */}
              {isLoaded && pct > 0 && (
                <div className="absolute bottom-0 inset-x-0 h-1 bg-black/20">
                  <div
                    className="h-full bg-gold transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col gap-1 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-stone-800 dark:text-white/80 text-sm leading-snug line-clamp-2 flex-1">
                  {course.title}
                </h3>
                {course.files.length > 0 && (
                  <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gold/15 text-primary dark:text-gold">
                    {course.files.length} درس
                  </span>
                )}
              </div>
              {scholars.length > 0 && (
                <p className="text-xs text-stone-400 dark:text-white/35 truncate">
                  {scholars.map((s) => `الشيخ ${s}`).join("  ·  ")}
                </p>
              )}
              {isLoaded && pct > 0 && (
                <p className="text-[11px] font-medium mt-auto pt-1 text-gold">
                  {pct}٪ مكتمل
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
