"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ProgressRing } from "./ProgressRing";
import { useWatched } from "@/lib/watchedContext";
import { subjectProgress } from "@/lib/progress";
import type { Subject } from "@/lib/data";

const BG_IMAGE = "/islamic-geometri-2.jfif";

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
      {subjects.map((subject, sIdx) => {
        const pct = progresses[sIdx];
        const bgImage = BG_IMAGE;
        return (
          <Link
            key={sIdx}
            href={`/level/${levelIdx}/${sIdx}`}
            className="group bg-white dark:bg-white/[0.04] rounded-2xl border border-stone-100 dark:border-white/[0.08] shadow-sm dark:shadow-none overflow-hidden hover:shadow-lg hover:-translate-y-1 hover:border-gold/30 transition-all duration-200 flex flex-col"
          >
            {/* Thumbnail */}
            <div className="relative w-full h-56 overflow-hidden flex items-center justify-center">
              <div
                className="absolute inset-0 bg-cover bg-center scale-105 group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundImage: `url('${bgImage}')` }}
              />
              <div className="absolute inset-0 bg-primary-dark/80 group-hover:bg-primary-dark/75 transition-colors duration-300" />

              {/* <div className="absolute top-0 inset-x-0 h-px bg-gold/60" />
              <div className="absolute bottom-0 inset-x-0 h-px bg-gold/30" /> */}

              {/* Circular progress ring + title */}
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
                <h3
                  className="text-gold text-xl font-bold text-center px-10 leading-relaxed line-clamp-2 drop-shadow-md"
                  style={{ fontFamily: "var(--font-aref-ruqaa)" }}
                >
                  {subject.title}
                </h3>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
