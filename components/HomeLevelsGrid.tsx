"use client";

import Link from "next/link";
import { memo, useMemo } from "react";
import { useWatched } from "@/lib/watchedContext";
import { levelProgress, levelStats } from "@/lib/progress";
import type { Level } from "@/lib/data";
import { LEVEL_COLORS, ARABIC_DIGITS, JOURNEY_GRADIENTS } from "@/lib/constants";
import { ProgressRing } from "./ProgressRing";

type LevelColor = (typeof LEVEL_COLORS)[number];

interface LevelCardProps {
  level: Level;
  idx: number;
  pct: number;
  isLoaded: boolean;
  col: LevelColor;
  glass: boolean;
  watchedCount: number;
  totalCount: number;
  watchedSeconds: number;
}

const LevelCard = memo(function LevelCard({ level, idx, pct, isLoaded, col, glass, watchedCount, totalCount, watchedSeconds }: LevelCardProps) {
  if (glass) {
    return (
      <Link
        href={`/level/${idx}`}
        className="group relative rounded-2xl border border-primary/10 overflow-hidden bg-primary/[0.03] hover:bg-primary/[0.07] hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-lg transition-all duration-200 flex flex-col items-center justify-center py-10 px-4 text-center"
      >
        <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-l ${col.gradient}`} />
        <div
          className={`text-6xl font-bold mb-4 ${col.text} group-hover:scale-110 transition-transform duration-200`}
          style={{ fontFamily: "var(--font-amiri)" }}
        >
          {ARABIC_DIGITS[idx]}
        </div>
        <h3 className="font-bold text-base md:text-3xl text-primary leading-snug" style={{ fontFamily: "var(--font-amiri)" }}>
          {level.title}
        </h3>
        {isLoaded && pct > 0 && (
          <div className="mt-3">
            <ProgressRing pct={pct} size={28} stroke={3} color={col.ring} />
          </div>
        )}
      </Link>
    );
  }

  const watchedHours = Math.floor(watchedSeconds / 3600);
  const watchedMins = Math.floor((watchedSeconds % 3600) / 60);
  const hasProgress = isLoaded && watchedCount > 0;

  return (
    <Link
      href={`/level/${idx}`}
      className="group relative overflow-hidden block transition-all duration-300"
      style={{ background: JOURNEY_GRADIENTS[idx] }}
    >
      {/* Subtle SVG geometric pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[.055] group-hover:opacity-[.09] transition-opacity duration-300 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={`geo-${idx}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            {/* Diamond grid */}
            <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="#F0BC53" strokeWidth="0.6" />
            {/* Inner small diamond */}
            <path d="M20 8 L32 20 L20 32 L8 20 Z" fill="none" stroke="#F0BC53" strokeWidth="0.4" />
            {/* Center dot */}
            <circle cx="20" cy="20" r="1.2" fill="#F0BC53" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#geo-${idx})`} />
      </svg>

      {/* Arrow hint */}
      <span className="absolute top-5 left-4 text-[16px] transition-colors duration-200 text-white/0 group-hover:text-gold/70">
        ↗
      </span>

      <div className="flex flex-col items-center justify-center h-[260px] px-5 text-center">
        {/* Ring encircling both numeral and title */}
        <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
          {isLoaded && pct > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <ProgressRing pct={pct} size={160} stroke={3} color="stroke-gold" trackColor="stroke-white/10" />
            </div>
          )}
          <div className="flex flex-col items-center gap-1 px-6">
            <span
              className="text-5xl font-bold leading-none text-white/40 select-none pointer-events-none"
              style={{ fontFamily: "var(--font-amiri)" }}
              aria-hidden
            >
              {ARABIC_DIGITS[idx]}
            </span>
            <span
              className="text-[13px] font-bold text-white/35 group-hover:text-white/80 transition-colors duration-200 line-clamp-2 leading-snug"
              
            >
              {level.title}
            </span>
          </div>
        </div>

        <div className="text-[9px] text-white/0 group-hover:text-white/30 transition-colors duration-300 mt-2 tracking-[.06em]">
          {level.subjects.length} مادة · {totalCount} درس
        </div>
      </div>

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
    </Link>
  );
});

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

  const stats = useMemo(
    () => levels.map((level, idx) => levelStats(idx, level, watchedKeys)),
    [levels, watchedKeys]
  );

  const gridClass = glass
    ? "grid grid-cols-2 md:grid-cols-4 gap-5"
    : "grid grid-cols-2 md:grid-cols-4 gap-px";

  return (
    <div className={gridClass} style={glass ? undefined : { background: "rgba(240,188,83,.12)" }}>
      {levels.map((level, idx) => {
        const s = stats[idx];
        return (
          <LevelCard
            key={idx}
            level={level}
            idx={idx}
            pct={progresses[idx]}
            isLoaded={isLoaded}
            col={LEVEL_COLORS[idx]}
            glass={glass}
            watchedCount={s.watchedCount}
            totalCount={s.totalCount}
            watchedSeconds={s.watchedSeconds}
          />
        );
      })}
    </div>
  );
}
