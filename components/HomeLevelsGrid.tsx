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
  glass?: boolean;
}

export function HomeLevelsGrid({ levels, glass = false }: Props) {
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
            className={
              glass
                ? "group rounded-2xl border border-[#193833]/10 overflow-hidden bg-[#193833]/[0.04] hover:bg-[#193833]/[0.08] hover:-translate-y-1 hover:border-[#193833]/20 hover:shadow-md transition-all duration-200"
                : "group bg-white dark:bg-white/[0.04] rounded-2xl shadow-sm dark:shadow-none border border-stone-100 dark:border-white/[0.08] overflow-hidden hover:shadow-lg hover:-translate-y-1.5 hover:border-stone-200 dark:hover:border-white/[0.15] dark:hover:bg-white/[0.08] transition-all duration-200"
            }
          >
            <div className={`h-1 w-full bg-gradient-to-l ${c.gradient} ${glass ? "opacity-80 h-0.5" : ""}`} />
            <div className="p-5">
              <div
                className={`w-11 h-11 rounded-xl ${c.bg} text-white flex items-center justify-center text-xl font-bold mb-3 shadow-sm group-hover:scale-110 transition-transform duration-200`}
              >
                {ARABIC_DIGITS[idx]}
              </div>

              {/* Title + progress ring on the same row */}
              <div className="flex items-start gap-2 mb-3">
                <h3 className={`flex-1 font-bold text-sm leading-snug ${glass ? "text-[#193833]" : "text-stone-800 dark:text-white/80"}`}>
                  {level.title}
                </h3>
                {isLoaded && pct > 0 && (
                  <ProgressRing pct={pct} size={28} stroke={3} color={c.ring} className="shrink-0 mt-0.5" />
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span
                  className={glass
                    ? `${c.light} ${c.text} text-[11px] font-semibold px-1.5 py-0.5 rounded-full`
                    : `${c.light} ${c.text} text-[11px] font-semibold px-1.5 py-0.5 rounded-full`}
                >
                  {level.subjects.length} مادة
                </span>
                <span className={glass ? "text-[#193833]/20" : "text-stone-300 dark:text-white/20"}>·</span>
                <span className={glass ? "text-[#193833]/50" : "text-stone-400 dark:text-white/35"}>{lessons} {lessonWord(lessons)}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
