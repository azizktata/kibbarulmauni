"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { university } from "@/lib/data";
import { useWatched } from "@/lib/watchedContext";
import { courseProgress } from "@/lib/progress";
import type { ScholarCourse } from "@/lib/scholars";
import { ScholarPlaylistsSection } from "./ScholarPlaylistsSection";
import type { ScholarPlaylist } from "./ScholarPlaylistsSection";
import durationsJson from "@/data/durations.json";

const durations = durationsJson as Record<string, number>;

function lessonWord(n: number) {
  if (n === 2) return "درسان";
  if (n >= 3 && n <= 10) return "دروس";
  return "درس";
}

function getFirstYoutubeId(lIdx: number, sIdx: number, cIdx: number): string | null {
  const files = university[lIdx]?.subjects[sIdx]?.courses[cIdx]?.files;
  if (!files) return null;
  for (const f of files) {
    const m = f.youtube?.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
  }
  return null;
}

function courseTotalSeconds(lIdx: number, sIdx: number, cIdx: number): number {
  const files = university[lIdx]?.subjects[sIdx]?.courses[cIdx]?.files;
  if (!files) return 0;
  let total = 0;
  for (const f of files) {
    if (f.youtube) {
      const m = f.youtube.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      if (m) total += durations[m[1]] ?? 0;
    }
  }
  return total;
}

const COURSES_PER_PAGE = 20;

interface Props {
  courses: ScholarCourse[];
  playlists: ScholarPlaylist[];
  knownPlaylistIds?: Set<string>;
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;

  const pages: (number | "…")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-white/10 text-stone-500 dark:text-white/40 disabled:opacity-30 hover:bg-stone-50 dark:hover:bg-white/[0.04] transition-colors"
      >
        السابق
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-stone-300 dark:text-white/20 text-xs">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-8 h-8 text-xs rounded-lg transition-colors ${
              p === page
                ? "bg-primary text-white"
                : "border border-stone-200 dark:border-white/10 text-stone-500 dark:text-white/40 hover:bg-stone-50 dark:hover:bg-white/[0.04]"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === total}
        className="px-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-white/10 text-stone-500 dark:text-white/40 disabled:opacity-30 hover:bg-stone-50 dark:hover:bg-white/[0.04] transition-colors"
      >
        التالي
      </button>
    </div>
  );
}

export function ScholarProfileTabs({ courses, playlists, knownPlaylistIds = new Set() }: Props) {
  const [tab, setTab] = useState<"courses" | "playlists">("courses");
  const [courseSearch, setCourseSearch] = useState("");
  const [coursePage, setCoursePage] = useState(1);
  const { watchedKeys, isLoaded } = useWatched();

  const filteredCourses = courseSearch.trim()
    ? courses.filter((c) => c.courseTitle.includes(courseSearch.trim()))
    : courses;

  const totalCoursePages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
  const pagedCourses = filteredCourses.slice((coursePage - 1) * COURSES_PER_PAGE, coursePage * COURSES_PER_PAGE);

  function changeCourseSearch(q: string) { setCourseSearch(q); setCoursePage(1); }

  function switchTab(t: "courses" | "playlists") {
    setTab(t);
    setCoursePage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      {/* Floating tab switcher — fixed to left edge, icon-only */}
      {playlists.length > 0 && (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/[0.10] rounded-2xl p-1 shadow-lg backdrop-blur-sm">
          <button
            onClick={() => switchTab("courses")}
            title="مقررات الجامعة"
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
              tab === "courses"
                ? "bg-primary text-white shadow-sm"
                : "text-stone-400 dark:text-white/30 hover:bg-stone-100 dark:hover:bg-white/[0.07]"
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 3L2 8l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </button>
          <button
            onClick={() => switchTab("playlists")}
            title="قوائم يوتيوب"
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
              tab === "playlists"
                ? "bg-primary text-white shadow-sm"
                : "text-stone-400 dark:text-white/30 hover:bg-stone-100 dark:hover:bg-white/[0.07]"
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill={tab === "playlists" ? "white" : "#ef4444"}>
              <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
            </svg>
          </button>
        </div>
      )}

      {/* Courses tab */}
      {tab === "courses" && (
        <>
          {/* Search */}
          <div className="relative mb-6">
            <svg className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-stone-400 dark:text-white/25 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={courseSearch}
              onChange={(e) => changeCourseSearch(e.target.value)}
              placeholder="ابحث في المقررات..."
              className="w-full text-sm border border-stone-200 dark:border-white/10 rounded-xl px-4 pe-9 py-2.5 bg-white dark:bg-white/[0.04] text-stone-700 dark:text-white/70 placeholder:text-stone-400 dark:placeholder:text-white/25 outline-none focus:border-primary/40 dark:focus:border-white/20 transition-colors"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {pagedCourses.map((course, i) => {
              const youtubeId = getFirstYoutubeId(course.levelIdx, course.subjectIdx, course.courseIdx);
              const thumbUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null;
              const totalSecs = courseTotalSeconds(course.levelIdx, course.subjectIdx, course.courseIdx);
              const totalHours = totalSecs >= 3600 ? Math.round(totalSecs / 3600) : 0;
              const totalMins = totalSecs > 0 && totalHours === 0 ? Math.round(totalSecs / 60) : 0;
              const courseData = university[course.levelIdx]?.subjects[course.subjectIdx]?.courses[course.courseIdx];
              const pct = courseData ? courseProgress(course.levelIdx, course.subjectIdx, course.courseIdx, courseData, watchedKeys) : 0;
              return (
                <Link
                  key={i}
                  href={`/level/${course.levelIdx}/${course.subjectIdx}/${course.courseIdx}`}
                  className="group bg-white dark:bg-white/[0.04] rounded-2xl border border-stone-100 dark:border-white/[0.08] shadow-sm dark:shadow-none overflow-hidden hover:shadow-lg hover:-translate-y-1 hover:border-gold/30 transition-all duration-200 flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="relative w-full aspect-video bg-stone-100 dark:bg-white/[0.06] overflow-hidden">
                    {thumbUrl ? (
                      <>
                        <Image
                          src={thumbUrl}
                          alt={course.courseTitle}
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
                    {isLoaded && pct > 0 && (
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-black/20">
                        <div className="h-full bg-gold transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col gap-1 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-stone-800 dark:text-white/80 text-sm leading-snug line-clamp-2 flex-1">
                        {course.courseTitle}
                      </h3>
                      <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gold/15 text-primary dark:text-gold">
                        {course.lessonCount} {lessonWord(course.lessonCount)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 dark:text-white/35 truncate">
                      {course.levelTitle} · {course.subjectTitle}
                    </p>
                    {(totalHours > 0 || totalMins > 0) && (
                      <div className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-white/30">
                        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                        <span>{totalHours > 0 ? `${totalHours} ساعة` : `${totalMins} دقيقة`}</span>
                      </div>
                    )}
                    {/* {isLoaded && pct > 0 && (
                      <p className="text-[11px] font-medium mt-auto pt-1 text-gold">{pct}٪ مكتمل</p>
                    )} */}
                  </div>
                </Link>
              );
            })}
          </div>
          <Pagination page={coursePage} total={totalCoursePages} onChange={(p) => { setCoursePage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </>
      )}
      

      {/* Playlists tab */}
      {tab === "playlists" && (
        <ScholarPlaylistsSection playlists={playlists} knownPlaylistIds={knownPlaylistIds} />
      )}
    </div>
  );
}
