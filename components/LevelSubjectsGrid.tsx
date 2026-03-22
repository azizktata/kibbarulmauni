"use client";

import Link from "next/link";
import { memo, useMemo } from "react";
import { useWatched } from "@/lib/watchedContext";
import { subjectProgress, subjectStats } from "@/lib/progress";
import type { Subject } from "@/lib/data";
import { ProgressRing } from "./ProgressRing";

interface SubjectCardProps {
  subject: Subject;
  sIdx: number;
  levelIdx: number;
  pct: number;
  isLoaded: boolean;
  watchedCount: number;
  totalCount: number;
  watchedSeconds: number;
}

const SubjectCard = memo(function SubjectCard({
  subject,
  sIdx,
  levelIdx,
  pct,
  isLoaded,
  watchedCount,
  totalCount,
  watchedSeconds,
}: SubjectCardProps) {
  const hasProgress = isLoaded && watchedCount > 0;
  const watchedHours = Math.floor(watchedSeconds / 3600);
  const watchedMins = Math.floor((watchedSeconds % 3600) / 60);

  return (
    <Link
      href={`/level/${levelIdx}/${sIdx}`}
      className="group relative block bg-[#F6F5F1] dark:bg-[#082e27] px-5 py-5  dark:hover:bg-[#1e4840] hover:shadow-[inset_3px_0_0_#F0BC53] transition-all duration-150 overflow-hidden"
    >
      {/* Subject number */}
      <div className="relative text-[10px] text-[#C9973A]/50 dark:text-gold/30 font-bold tracking-[.12em] mb-3 flex items-center justify-between">
        <span>{String(sIdx + 1).padStart(2, "0")}</span>
        {hasProgress && (
          <ProgressRing pct={pct} size={28} stroke={2.5} color="stroke-[#C9973A]" trackColor="stroke-[#DEDAD0]" />
        )}
      </div>

      {/* Title */}
      <h3
        className="relative text-xl font-bold text-[#0F2822]/75 dark:text-cream/60 leading-snug mb-3 line-clamp-2 group-hover:text-[#0F2822] dark:group-hover:text-cream/90 transition-colors duration-150"
        
      >
        {subject.title}
      </h3>

      {/* Meta — course + lesson count */}
      <div className="relative text-[11px] text-[#0F2822]/30 dark:text-cream/20">
        {subject.courses.length} مقرر
        <span className="mx-1.5 text-[#DEDAD0]">·</span>
        {totalCount} درس
      </div>

      {/* Progress bar (only when started) */}
      {hasProgress && (
        <div className="relative mt-3">
          <div className="w-full h-px bg-[#DEDAD0] dark:bg-white/10">
            <div
              className="h-full bg-[#C9973A]/60 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Analytics panel — slides up on hover when progress exists */}
      {hasProgress && (
        <div className="absolute inset-x-0 bottom-0 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-black/55 backdrop-blur-sm px-4 py-3 flex items-center justify-around text-white">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-white/50">الدروس</span>
            <span className="text-sm font-semibold tabular-nums">
              {watchedCount}<span className="text-white/40 font-normal text-xs"> / {totalCount}</span>
            </span>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-white/50">المشاهد</span>
            <span className="text-sm font-semibold tabular-nums">
              {watchedHours > 0 ? `${watchedHours}س ${watchedMins}د` : `${watchedMins} دقيقة`}
            </span>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-white/50">الإتمام</span>
            <span className="text-sm font-semibold text-gold">{pct}٪</span>
          </div>
        </div>
      )}

      {/* Arrow hint on hover */}
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C9973A]/0 group-hover:text-[#C9973A]/50 transition-colors duration-200 text-sm">
        ←
      </span>
    </Link>
  );
});

interface Props {
  levelIdx: number;
  subjects: Subject[];
}

export function LevelSubjectsGrid({ levelIdx, subjects }: Props) {
  const { watchedKeys, isLoaded } = useWatched();

  const progresses = useMemo(
    () =>
      subjects.map((subject, sIdx) =>
        subjectProgress(levelIdx, sIdx, subject, watchedKeys)
      ),
    [subjects, levelIdx, watchedKeys]
  );

  const stats = useMemo(
    () =>
      subjects.map((subject, sIdx) =>
        subjectStats(levelIdx, sIdx, subject, watchedKeys)
      ),
    [subjects, levelIdx, watchedKeys]
  );

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px"
      style={{ background: "rgba(240,188,83,.35)" }}
    >
      {subjects.map((subject, sIdx) => {
        const s = stats[sIdx];
        return (
          <SubjectCard
            key={sIdx}
            subject={subject}
            sIdx={sIdx}
            levelIdx={levelIdx}
            pct={progresses[sIdx]}
            isLoaded={isLoaded}
            watchedCount={s.watchedCount}
            totalCount={s.totalCount}
            watchedSeconds={s.watchedSeconds}
          />
        );
      })}
    </div>
  );
}
