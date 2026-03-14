"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Lesson } from "@/lib/data";
import type { LevelColor } from "@/lib/constants";
import { saveWatched } from "@/lib/useRecentlyWatched";

/** Convert any positive integer to Arabic-Indic digits */
function toAr(n: number): string {
  return (n + 1).toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

interface Props {
  lessons: Lesson[];
  col: LevelColor;
  levelIdx: number;
  subjectIdx: number;
  courseIdx: number;
  courseTitle: string;
  levelTitle: string;
}

export function CoursePlayer({ lessons, col, levelIdx, subjectIdx, courseIdx, courseTitle, levelTitle }: Props) {
  const searchParams = useSearchParams();
  const initialLesson = Math.min(
    Number(searchParams.get("lesson") ?? 0) || 0,
    lessons.length - 1
  );
  const [selected, setSelected] = useState(initialLesson);

  useEffect(() => {
    saveWatched({
      levelIdx, subjectIdx, courseIdx,
      lessonIdx: selected,
      courseTitle,
      lessonTitle: lessons[selected].title,
      levelTitle,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseIdx]);
  const lesson = lessons[selected];
  const ytId = lesson.youtube?.match(/[?&]v=([^&]+)/)?.[1] ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* ── Video panel ── */}
      <div className="lg:col-span-2 flex flex-col gap-3">
        <div className="aspect-video bg-stone-900 rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5">
          {ytId ? (
            <iframe
              key={ytId}
              src={`https://www.youtube.com/embed/${ytId}`}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-stone-500 gap-3">
              <svg className="w-10 h-10 opacity-40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
              <p className="text-sm">الفيديو غير متاح</p>
            </div>
          )}
        </div>

        {/* Lesson info below video */}
        <div className="bg-white rounded-xl border border-stone-100 shadow-sm px-4 py-3.5 flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-stone-800 text-sm leading-snug">{lesson.title}</p>
            <p className={`text-xs mt-1 ${col.text}`}>
              الدرس {toAr(selected)} من {toAr(lessons.length - 1)}
            </p>
          </div>
          {lesson.youtube && (
            <a
              href={lesson.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1.5 text-xs text-stone-400 hover:text-red-500 transition-colors py-1"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 14" fill="currentColor">
                <path d="M19.6 2.2C19.4 1.4 18.8.8 18 .6 16.4.2 10 .2 10 .2S3.6.2 2 .6C1.2.8.6 1.4.4 2.2 0 3.8 0 7 0 7s0 3.2.4 4.8c.2.8.8 1.4 1.6 1.6C3.6 13.8 10 13.8 10 13.8s6.4 0 8-.4c.8-.2 1.4-.8 1.6-1.6.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM8 10V4l5.3 3L8 10z" />
              </svg>
              يوتيوب
            </a>
          )}
        </div>

        {/* Prev / Next */}
        <div className="flex justify-between gap-3">
          <button
            onClick={() => setSelected((s) => Math.min(s + 1, lessons.length - 1))}
            disabled={selected === lessons.length - 1}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-stone-100 rounded-xl py-2.5 text-xs font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 rotate-180" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10.5 8L6 4l-1 1L8.5 8 5 11l1 1 4.5-4z" />
            </svg>
            الدرس التالي
          </button>
          <button
            onClick={() => setSelected((s) => Math.max(s - 1, 0))}
            disabled={selected === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-stone-100 rounded-xl py-2.5 text-xs font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            الدرس السابق
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10.5 8L6 4l-1 1L8.5 8 5 11l1 1 4.5-4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Playlist ── */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden flex flex-col">
        {/* Playlist header */}
        <div className={`px-4 py-3 ${col.bg} text-white shrink-0`}>
          <p className="text-sm font-semibold">قائمة الدروس</p>
          <p className="text-white/70 text-xs mt-0.5">{lessons.length} درس</p>
        </div>

        {/* Scrollable lesson list */}
        <div className="divide-y divide-stone-50 overflow-y-auto" style={{ maxHeight: "min(60vh, 520px)" }}>
          {lessons.map((l, idx) => {
            const isActive = idx === selected;
            return (
              <button
                key={idx}
                onClick={() => setSelected(idx)}
                className={`w-full text-right px-3.5 py-3 flex items-start gap-2.5 border-r-2 transition-colors ${
                  isActive
                    ? `${col.light} ${col.activeBorder}`
                    : "border-r-transparent hover:bg-stone-50"
                }`}
              >
                {/* Number */}
                <div
                  className={`shrink-0 w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center mt-0.5 ${
                    isActive ? `${col.bg} text-white` : "bg-stone-100 text-stone-400"
                  }`}
                >
                  {toAr(idx)}
                </div>
                {/* Title */}
                <p
                  className={`text-xs leading-relaxed text-right ${
                    isActive ? `${col.text} font-semibold` : "text-stone-600"
                  }`}
                >
                  {l.title}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
