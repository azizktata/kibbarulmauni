"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useWatched } from "@/lib/watchedContext";
import { levelProgress } from "@/lib/progress";
import type { Level } from "@/lib/data";
import { LEVEL_COLORS, ARABIC_DIGITS } from "@/lib/constants";
import { countLevelLessons } from "@/lib/data";
import { ProgressRing } from "./ProgressRing";

function lessonWord(n: number) {
  return n === 1 ? "درس" : "دروس";
}

interface Props {
  levels: Level[];
}

export function HomeLevelsGrid({ levels }: Props) {
  const { watchedKeys, isLoaded } = useWatched();

  const progresses = useMemo(
    () => levels.map((level, idx) => levelProgress(idx, level, watchedKeys)),
    [levels, watchedKeys]
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {levels.map((level, idx) => {
        const lessons = countLevelLessons(level);
        const c = LEVEL_COLORS[idx];
        const pct = progresses[idx];
        return (
          <Link
            key={idx}
            href={`/level/${idx}`}
            className="group bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-lg hover:-translate-y-1.5 hover:border-stone-200 transition-all duration-200"
          >
            <div className={`h-1 w-full bg-gradient-to-l ${c.gradient}`} />
            <div className="p-5">
              <div
                className={`w-11 h-11 rounded-xl ${c.bg} text-white flex items-center justify-center text-xl font-bold mb-3 shadow-sm group-hover:scale-110 transition-transform duration-200`}
              >
                {ARABIC_DIGITS[idx]}
              </div>

              {/* Title + progress ring on the same row */}
              <div className="flex items-start gap-2 mb-3">
                <h3 className="flex-1 font-bold text-stone-800 text-sm leading-snug">
                  {level.title}
                </h3>
                {isLoaded && pct > 0 && (
                  <ProgressRing pct={pct} size={28} stroke={3} color={c.ring} className="shrink-0 mt-0.5" />
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`${c.light} ${c.text} text-[11px] font-semibold px-1.5 py-0.5 rounded-full`}
                >
                  {level.subjects.length} مادة
                </span>
                <span className="text-stone-300">·</span>
                <span className="text-stone-400">{lessons} {lessonWord(lessons)}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
