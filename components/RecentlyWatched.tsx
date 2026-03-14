"use client";

import Link from "next/link";
import { useRecentlyWatched } from "@/lib/useRecentlyWatched";
import { LEVEL_COLORS } from "@/lib/constants";

export function RecentlyWatched() {
  const entries = useRecentlyWatched();
  if (entries.length === 0) return null;

  return (
    <section className="max-w-5xl mx-auto px-4 pt-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="text-xs font-semibold text-stone-400 tracking-widest">شاهدت مؤخراً</span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {entries.map((entry, i) => {
          const col = LEVEL_COLORS[entry.levelIdx];
          return (
            <Link
              key={i}
              href={`/level/${entry.levelIdx}/${entry.subjectIdx}/${entry.courseIdx}?lesson=${entry.lessonIdx}`}
              className="group bg-white rounded-xl border border-stone-100 shadow-sm px-4 py-3.5 flex items-center gap-3 hover:shadow-md hover:border-stone-200 transition-all"
            >
              <div className={`shrink-0 w-8 h-8 rounded-lg ${col.bg} text-white flex items-center justify-center`}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-stone-800 truncate">{entry.courseTitle}</p>
                <p className="text-[11px] text-stone-400 mt-0.5 truncate">{entry.levelTitle}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
