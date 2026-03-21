"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useWatched } from "@/lib/watchedContext";
import { levelProgress, levelStats } from "@/lib/progress";
import type { Level } from "@/lib/data";
import { LEVEL_COLORS, ARABIC_DIGITS } from "@/lib/constants";
import { ProgressRing } from "./ProgressRing";

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

  if (glass) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {levels.map((level, idx) => {
          const c = LEVEL_COLORS[idx];
          const pct = progresses[idx];
          return (
            <Link
              key={idx}
              href={`/level/${idx}`}
              className="group relative rounded-2xl border border-primary/10 overflow-hidden bg-primary/[0.03] hover:bg-primary/[0.07] hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-lg transition-all duration-200 flex flex-col items-center justify-center py-10 px-4 text-center"
            >
              <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-l ${c.gradient}`} />

              <div
                className={`text-6xl font-bold mb-4 ${c.text} group-hover:scale-110 transition-transform duration-200`}
                style={{ fontFamily: "var(--font-amiri)" }}
              >
                {ARABIC_DIGITS[idx]}
              </div>

              <h3
                className="font-bold text-base md:text-3xl text-primary leading-snug"
                style={{ fontFamily: "var(--font-amiri)" }}
              >
                {level.title}
              </h3>

              {isLoaded && pct > 0 && (
                <div className="mt-3">
                  <ProgressRing pct={pct} size={28} stroke={3} color={c.ring} />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {levels.map((level, idx) => {
        const pct = progresses[idx];
        const s = stats[idx];
        const watchedHours = Math.floor(s.watchedSeconds / 3600);
        const watchedMins = Math.floor((s.watchedSeconds % 3600) / 60);
        const hasProgress = isLoaded && s.watchedCount > 0;

        return (
          <Link
            key={idx}
            href={`/level/${idx}`}
            className="group rounded-lg overflow-hidden hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200"
          >
            <div className="relative w-full h-52 overflow-hidden flex items-center justify-center">
              <div
                className="absolute inset-0 bg-cover bg-center scale-105 group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundImage: "url('/islamic-geometric-4.jfif')" }}
              />
              <div className="absolute inset-0 bg-primary/70 group-hover:bg-primary/60 transition-colors duration-300" />

              {/* Circular progress ring + content */}
              <div className="relative z-10 flex items-center justify-center">
                {isLoaded && pct > 0 && (
                  <div className="absolute">
                    <ProgressRing
                      pct={pct}
                      size={148}
                      stroke={3}
                      color="stroke-gold"
                      trackColor="stroke-white/15"
                    />
                  </div>
                )}
                <div className="flex flex-col items-center gap-1 px-10 text-center">
                  <span
                    className="text-gold text-5xl font-bold leading-none drop-shadow-md"
                    style={{ fontFamily: "var(--font-aref-ruqaa)" }}
                  >
                    {ARABIC_DIGITS[idx]}
                  </span>
                  <h3
                    className="text-white text-base font-semibold leading-snug mt-1 line-clamp-2"
                    style={{ fontFamily: "var(--font-aref-ruqaa)" }}
                  >
                    {level.title}
                  </h3>
                </div>
              </div>

              {/* Hover stats overlay */}
              {hasProgress && (
                <div className="absolute inset-x-0 bottom-0 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-black/60 backdrop-blur-sm px-4 py-3 flex items-center justify-around text-white">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs text-white/50">الدروس</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {s.watchedCount}
                      <span className="text-white/40 font-normal text-xs"> / {s.totalCount}</span>
                    </span>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs text-white/50">المشاهد</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {watchedHours > 0 ? `${watchedHours}س ${watchedMins}د` : `${watchedMins} دقيقة`}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs text-white/50">الإتمام</span>
                    <span className="text-sm font-semibold text-gold">{pct}٪</span>
                  </div>
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
