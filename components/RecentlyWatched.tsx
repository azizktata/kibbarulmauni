"use client";

import Link from "next/link";
import Image from "next/image";
import { useRecentlyWatched } from "@/lib/useRecentlyWatched";
import { getCourse } from "@/lib/data";
import { JOURNEY_GRADIENTS } from "@/lib/constants";
import scholarPlaylistsData from "@/data/scholar-playlists.json";
import type { ScholarPlaylist } from "@/components/ScholarPlaylistsSection";

const allPlaylists = scholarPlaylistsData as Record<string, ScholarPlaylist[]>;
const playlistThumbnails: Record<string, string> = {};
for (const playlists of Object.values(allPlaylists)) {
  for (const p of playlists) {
    if (p.thumbnail) playlistThumbnails[p.playlistId] = p.thumbnail;
  }
}

function extractYoutubeId(url: string): string | null {
  const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function getCourseThumbnail(levelIdx: number, subjectIdx: number, courseIdx: number): string | null {
  const course = getCourse(levelIdx, subjectIdx, courseIdx);
  if (!course) return null;
  for (const lesson of course.files) {
    if (lesson.youtube) {
      const id = extractYoutubeId(lesson.youtube);
      if (id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    }
  }
  return null;
}

function SkeletonCard({ border }: { border: boolean }) {
  return (
    <div className={`flex flex-1 items-center gap-4 px-4 py-3 bg-[#F6F5F1] dark:bg-[#082e27]${border ? " border-t md:border-t-0 md:border-r border-[#DEDAD0] dark:border-white/[.06]" : ""}`}>
      <div className="shrink-0 rounded bg-stone-200 dark:bg-white/10 animate-pulse" style={{ width: 88, height: 50 }} />
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <div className="h-3 w-2/3 rounded bg-stone-200 dark:bg-white/10 animate-pulse" />
        <div className="h-2 w-1/3 rounded bg-stone-200 dark:bg-white/10 animate-pulse" />
      </div>
      <div className="h-2 w-10 rounded bg-stone-200 dark:bg-white/10 animate-pulse shrink-0" />
    </div>
  );
}

export function RecentlyWatched() {
  const { entries, loading } = useRecentlyWatched();

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-0 w-full max-w-[1800px] mx-auto">
        <p className="text-[10px]  text-[#C9973A] dark:text-gold/60 tracking-[.22em] font-bold mb-3">
          شاهدت مؤخراً
        </p>
        <div className="flex flex-col md:flex-row border border-[#DEDAD0] dark:border-white/[.08]">
          <SkeletonCard border={false} />
          <SkeletonCard border={true} />
          <SkeletonCard border={true} />
        </div>
      </div>
    );
  }

  const visible = entries.slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-0 w-full max-w-[1800px] mx-auto">
      {/* Label */}
      <p className="text-[10px] text-center text-[#C9973A] dark:text-gold/60 tracking-[.22em] font-bold mb-3">
        شاهدت مؤخراً
      </p>

      {/* Cards — flex row so no empty cells when < 3 entries */}
      <div className="flex flex-col md:flex-row border border-[#DEDAD0] dark:border-white/[.08]">
        {visible.map((entry, i) => {
          const thumbUrl = entry.playlistId
            ? (playlistThumbnails[entry.playlistId] ?? null)
            : getCourseThumbnail(entry.levelIdx, entry.subjectIdx, entry.courseIdx);
          const href = entry.playlistId
            ? `/playlist/${entry.playlistId}?lesson=${entry.lessonIdx}`
            : `/level/${entry.levelIdx}/${entry.subjectIdx}/${entry.courseIdx}?lesson=${entry.lessonIdx}`;
          const levelGrad = !entry.playlistId
            ? (JOURNEY_GRADIENTS[entry.levelIdx] ?? JOURNEY_GRADIENTS[0])
            : JOURNEY_GRADIENTS[0];

          return (
            <Link
              key={i}
              href={href}
              className={`group flex flex-1 items-center gap-4 px-4 py-3 bg-[#F6F5F1] dark:bg-[#082e27]  dark:hover:bg-[#0d3a30] hover:shadow-[inset_3px_0_0_#F0BC53] transition-all duration-200${i > 0 ? " border-t md:border-t-0 md:border-r border-[#DEDAD0] dark:border-white/[.06]" : ""}`}
            >
              {/* Thumbnail with level gradient as fallback bg */}
              <div
                className="relative shrink-0 overflow-hidden"
                style={{ width: 88, height: 50, background: levelGrad }}
              >
                {thumbUrl ? (
                  <Image
                    src={thumbUrl}
                    alt={entry.courseTitle}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="88px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gold/50" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white/80" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-bold text-[#0F2822] dark:text-cream/80 leading-snug line-clamp-1"
                
                >
                  {entry.courseTitle}
                </p>
                <p className="text-[10px] text-[#C9973A]/70 dark:text-gold/45 mt-0.5 truncate tracking-[.04em]">
                  {entry.levelTitle}
                </p>
              </div>

              <span className="shrink-0 text-[10px] text-[#C9973A]/50 dark:text-gold/35 group-hover:text-[#C9973A] dark:group-hover:text-gold font-bold tracking-[.06em] transition-colors duration-200">
                استمر ←
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
