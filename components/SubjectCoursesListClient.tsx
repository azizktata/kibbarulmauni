"use client";

import Link from "next/link";
import Image from "next/image";
import { memo, useMemo } from "react";
import { useWatched } from "@/lib/watchedContext";
import { courseProgress } from "@/lib/progress";
import type { Course } from "@/lib/data";
import { extractScholars } from "@/lib/data";
import durationsJson from "@/data/durations.json";
import { lessonWord } from "@/lib/arabicUtils";

const durations = durationsJson as Record<string, number>;

function courseTotalSeconds(course: Course): number {
  let total = 0;
  for (const lesson of course.files) {
    if (lesson.youtube) {
      const m = lesson.youtube.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      if (m) total += durations[m[1]] ?? 0;
    }
  }
  return total;
}

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

interface CardProps {
  course: Course;
  cIdx: number;
  lIdx: number;
  sIdx: number;
  pct: number;
  isLoaded: boolean;
  scholars: string[];
  totalSecs: number;
  youtubeId: string | null;
}

const CourseCard = memo(function CourseCard({ course, cIdx, lIdx, sIdx, pct, isLoaded, scholars, totalSecs, youtubeId }: CardProps) {
  const totalHours = totalSecs >= 3600 ? Math.round(totalSecs / 3600) : 0;
  const totalMins = totalSecs > 0 && totalHours === 0 ? Math.round(totalSecs / 60) : 0;
  const thumbUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null;

  return (
    <Link
      href={`/level/${lIdx}/${sIdx}/${cIdx}`}
      className="group bg-white dark:bg-white/[0.04] rounded-xl border border-[#DEDAD0] dark:border-white/[0.06] overflow-hidden hover:shadow-[0_4px_24px_rgba(240,188,83,.13)] hover:-translate-y-0.5 hover:border-[#C9973A]/35 transition-all duration-200 flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-[#F6F5F1] dark:bg-white/[0.06] overflow-hidden">
        {thumbUrl ? (
          <>
            <Image
              src={thumbUrl}
              alt={course.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-[#C9973A]/20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
          </div>
        )}
        {isLoaded && pct > 0 && (
          <div className="absolute bottom-0 inset-x-0 h-[3px] bg-black/15">
            <div className="h-full bg-gold transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="font-bold text-[#0F2822]/80 dark:text-white/80 text-sm leading-snug line-clamp-2 flex-1 group-hover:text-[#0F2822] dark:group-hover:text-white transition-colors duration-150"
            
          >
            {course.title}
          </h3>
          {course.files.length > 0 && (
            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 bg-[#F6F5F1] dark:bg-white/[.06] text-[#C9973A] border border-[#DEDAD0] dark:border-white/[.08]">
              {course.files.length} {lessonWord(course.files.length)}
            </span>
          )}
        </div>
        {scholars.length > 0 && (
          <p className="text-[11px] text-[#C9973A]/60 dark:text-gold/35 truncate">
            {scholars.map((s) => `الشيخ ${s}`).join("  ·  ")}
          </p>
        )}
        {(totalHours > 0 || totalMins > 0) && (
          <div className="flex items-center gap-1 text-[11px] text-[#0F2822]/30 dark:text-white/25">
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span>{totalHours > 0 ? `${totalHours} ساعة` : `${totalMins} دقيقة`}</span>
          </div>
        )}
        {/* {isLoaded && pct > 0 && (
          <p className="text-[11px] font-semibold mt-auto pt-1 text-[#C9973A]">{pct}٪ مكتمل</p>
        )} */}
      </div>
    </Link>
  );
});

interface Props {
  lIdx: number;
  sIdx: number;
  courses: Course[];
}

export function SubjectCoursesListClient({ lIdx, sIdx, courses }: Props) {
  const { watchedKeys, isLoaded } = useWatched();

  const staticMeta = useMemo(
    () =>
      courses.map((course) => ({
        scholars: extractScholars(course),
        totalSecs: courseTotalSeconds(course),
        youtubeId: getFirstYoutubeId(course),
      })),
    [courses]
  );

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
        const { scholars, totalSecs, youtubeId } = staticMeta[cIdx];
        return (
          <CourseCard
            key={cIdx}
            course={course}
            cIdx={cIdx}
            lIdx={lIdx}
            sIdx={sIdx}
            pct={progresses[cIdx]}
            isLoaded={isLoaded}
            scholars={scholars}
            totalSecs={totalSecs}
            youtubeId={youtubeId}
          />
        );
      })}
    </div>
  );
}
