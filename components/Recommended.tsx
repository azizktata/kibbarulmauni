import Link from "next/link";
import Image from "next/image";
import { JOURNEY_GRADIENTS } from "@/lib/constants";
import { lessonWord } from "@/lib/arabicUtils";
import { RECOMMENDED_PLAYLISTS } from "@/lib/recommendations";
import scholarPlaylistsData from "@/data/scholar-playlists.json";
import type { ScholarPlaylist } from "@/components/ScholarPlaylistsSection";

const allPlaylists = scholarPlaylistsData as Record<string, ScholarPlaylist[]>;

function findPlaylistMeta(playlistId: string): { scholarName: string; playlist: ScholarPlaylist } | null {
  for (const [scholarName, playlists] of Object.entries(allPlaylists)) {
    const playlist = playlists.find((p) => p.playlistId === playlistId);
    if (playlist) return { scholarName, playlist };
  }
  return null;
}

export function Recommended() {
  const items = RECOMMENDED_PLAYLISTS.map(findPlaylistMeta).filter(
    (m): m is { scholarName: string; playlist: ScholarPlaylist } => m !== null,
  );

  if (items.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-0 w-full max-w-[1800px] mx-auto">
      {/* Label */}
      <p className="text-[10px] text-center text-[#C9973A] dark:text-gold/60 tracking-[.22em] font-bold mb-3">
        نوصي بها
      </p>

      {/* Cards — flex row so no empty cells when < 3 entries */}
      <div className="flex flex-col md:flex-row border border-[#DEDAD0] dark:border-white/[.08]">
        {items.map(({ scholarName, playlist }, i) => (
          <Link
            key={playlist.playlistId}
            href={`/playlist/${playlist.playlistId}`}
            className={`group flex flex-1 items-center gap-4 px-4 py-3 bg-[#F6F5F1] dark:bg-[#082e27]  dark:hover:bg-[#0d3a30] hover:shadow-[inset_3px_0_0_#F0BC53] transition-all duration-200${i > 0 ? " border-t md:border-t-0 md:border-r border-[#DEDAD0] dark:border-white/[.06]" : ""}`}
          >
            {/* Thumbnail with level gradient as fallback bg */}
            <div
              className="relative shrink-0 overflow-hidden"
              style={{ width: 88, height: 50, background: JOURNEY_GRADIENTS[0] }}
            >
              {playlist.thumbnail ? (
                <Image
                  src={playlist.thumbnail}
                  alt={playlist.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="88px"
                  unoptimized
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
              <p className="text-sm font-bold text-[#0F2822] dark:text-cream/80 leading-snug line-clamp-1">
                {playlist.title}
              </p>
              <p className="text-[10px] text-[#C9973A]/70 dark:text-gold/45 mt-0.5 truncate tracking-[.04em]">
                {scholarName} · {playlist.videoCount} {lessonWord(playlist.videoCount)}
              </p>
            </div>

            <span className="shrink-0 text-[10px] text-[#C9973A]/50 dark:text-gold/35 group-hover:text-[#C9973A] dark:group-hover:text-gold font-bold tracking-[.06em] transition-colors duration-200">
              ابدأ ←
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
