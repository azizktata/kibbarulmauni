"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRecentlyWatched } from "@/lib/useRecentlyWatched";
import { getCourse } from "@/lib/data";
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

export function RecentlyWatched() {
  const { status } = useSession();
  const entries = useRecentlyWatched();

  // Show nothing if not yet hydrated or no entries and logged in
  if (status === "loading") return null;

  const visible = entries.slice(0, 3);

  // Logged out: show a sign-in nudge (only if they have entries to show value)
  // if (!isLoggedIn) {
  //   return (
  //     <section className="bg-stone-50 dark:bg-white/5 border-b border-stone-100 dark:border-white/[0.06] py-4 px-4">
  //       <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
  //         <p className="text-xs text-stone-400 dark:text-white/30">
  //           سجّل دخولك لتتبّع تقدّمك وحفظ سجل المشاهدة
  //         </p>
  //         <SignInDialog
  //           trigger={
  //             <button className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline shrink-0">
  //               دخول
  //             </button>
  //           }
  //         />
  //       </div>
  //     </section>
  //   );
  // }

  // Logged in but no entries yet
  if (visible.length === 0) return null;

  return (
    <section className="bg-stone-50 dark:bg-white/5 border-b border-stone-100 dark:border-white/[0.06] py-5 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-stone-200 dark:bg-white/10" />
          <span className="text-[11px] font-semibold text-stone-400 dark:text-white/30 tracking-widest">
            شاهدت مؤخراً
          </span>
          <div className="h-px flex-1 bg-stone-200 dark:bg-white/10" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {visible.map((entry, i) => {
            const thumbUrl = entry.playlistId
              ? (playlistThumbnails[entry.playlistId] ?? null)
              : getCourseThumbnail(entry.levelIdx, entry.subjectIdx, entry.courseIdx);
            const href = entry.playlistId
              ? `/playlist/${entry.playlistId}?lesson=${entry.lessonIdx}`
              : `/level/${entry.levelIdx}/${entry.subjectIdx}/${entry.courseIdx}?lesson=${entry.lessonIdx}`;
            return (
              <Link
                key={i}
                href={href}
                className="group bg-white dark:bg-white/[0.04] rounded-xl border border-stone-100 dark:border-white/[0.08] shadow-sm dark:shadow-none overflow-hidden hover:shadow-md hover:-translate-y-0.5 hover:border-gold/30 transition-all duration-200 flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative w-full h-24 bg-stone-100 dark:bg-white/[0.06] overflow-hidden">
                  {thumbUrl ? (
                    <Image
                      src={thumbUrl}
                      alt={entry.courseTitle}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/islamic-geometri-2.jfif')" }}>
                      <div className="absolute inset-0 bg-primary/65 flex items-center justify-center">
                        <svg className="w-7 h-7 text-gold/70" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="px-3 py-2 flex flex-col gap-0.5">
                  <p className="font-semibold text-stone-800 dark:text-white/80 text-xs leading-snug line-clamp-1">
                    {entry.courseTitle}
                  </p>
                  <p className="text-[10px] text-stone-400 dark:text-white/35 truncate">
                    {entry.levelTitle}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
