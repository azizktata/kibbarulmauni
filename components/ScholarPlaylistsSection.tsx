"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { lessonWord } from "@/lib/arabicUtils";
import { Pagination } from "@/components/ui/Pagination";

export type ScholarPlaylist = {
  playlistId: string;
  title: string;
  description: string;
  thumbnail: string;
  videoCount: number;
  publishedAt: string;
  category: string;
};

const PLAYLISTS_PER_PAGE = 24;

export function ScholarPlaylistsSection({ playlists, knownPlaylistIds = new Set() }: { playlists: ScholarPlaylist[]; knownPlaylistIds?: Set<string> }) {
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [sort, setSort] = useState<"videos" | "alpha" | "newest">("videos");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const p of playlists) seen.add(p.category);
    return ["الكل", ...["القرآن والتفسير", "علوم القرآن", "الحديث", "مصطلح الحديث", "العقيدة", "الفقه", "أصول الفقه", "السيرة والتاريخ", "اللغة العربية", "فتاوى", "فوائد", "عام"].filter((c) => seen.has(c))];
  }, [playlists]);

  const filtered = useMemo(() => {
    let list = activeCategory === "الكل" ? playlists : playlists.filter((p) => p.category === activeCategory);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }
    if (sort === "videos") list = [...list].sort((a, b) => b.videoCount - a.videoCount);
    else if (sort === "alpha") list = [...list].sort((a, b) => a.title.localeCompare(b.title, "ar"));
    else if (sort === "newest") list = [...list].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return list;
  }, [playlists, activeCategory, sort, search]);

  const totalPages = Math.ceil(filtered.length / PLAYLISTS_PER_PAGE);
  const paged = filtered.slice((page - 1) * PLAYLISTS_PER_PAGE, page * PLAYLISTS_PER_PAGE);

  function changeFilter(cat: string) { setActiveCategory(cat); setPage(1); }
  function changeSort(s: "videos" | "alpha" | "newest") { setSort(s); setPage(1); }
  function changeSearch(q: string) { setSearch(q); setPage(1); }

  return (
    <section>

      {/* Search input */}
      <div className="relative mb-4">
        <svg className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-stone-400 dark:text-white/25 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => changeSearch(e.target.value)}
          placeholder="ابحث في القوائم..."
          className="w-full text-[16px] border border-stone-200 dark:border-white/10 rounded-lg px-4 pe-9 py-2.5 bg-white dark:bg-white/[0.04] text-stone-700 dark:text-white/70 placeholder:text-stone-400 dark:placeholder:text-white/25 outline-none focus:border-primary/40 dark:focus:border-white/20 transition-colors"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Category chips */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => changeFilter(cat)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-white border-primary"
                  : "border-stone-200 dark:border-white/10 text-stone-500 dark:text-white/40 hover:border-stone-300 dark:hover:border-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort select */}
        <select
          value={sort}
          onChange={(e) => changeSort(e.target.value as typeof sort)}
          className="text-xs border border-stone-200 dark:border-white/10 rounded-lg px-3 py-1.5 bg-white dark:bg-white/[0.04] text-stone-500 dark:text-white/40 outline-none shrink-0"
        >
          <option value="videos">الأكثر دروساً</option>
          <option value="alpha">أبجدي</option>
          <option value="newest">الأحدث</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-xs text-stone-400 dark:text-white/30 mb-4">{filtered.length} قائمة</p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {paged.map((playlist) => {
          const isInternal = knownPlaylistIds.has(playlist.playlistId);
          const cardClass = "group bg-white dark:bg-white/[0.04] rounded-2xl border border-stone-100 dark:border-white/[0.08] shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 hover:border-gold/30 transition-all duration-200 flex flex-col";
          const cardContent = (
            <>
              {/* Thumbnail */}
              <div className="relative w-full aspect-video bg-stone-100 dark:bg-white/[0.06] overflow-hidden">
                {playlist.thumbnail ? (
                  <Image
                    src={playlist.thumbnail}
                    alt={playlist.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary/20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                    </svg>
                  </div>
                )}
                {/* Badge */}
                <div className="absolute bottom-2 left-2 bg-black/60 rounded px-1.5 py-0.5 flex items-center gap-1">
                  {isInternal ? (
                    <svg className="w-3 h-3 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
                    </svg>
                  )}
                  <span className="text-white text-[10px]">{playlist.videoCount} {lessonWord(playlist.videoCount)}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 flex flex-col gap-1.5 flex-1">
                <h3 className="text-sm font-semibold text-stone-800 dark:text-white/80 leading-snug line-clamp-2">
                  {playlist.title}
                </h3>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-white/[0.06] text-stone-500 dark:text-white/40 self-start">
                  {playlist.category}
                </span>
              </div>
            </>
          );

          return isInternal ? (
            <Link key={playlist.playlistId} href={`/playlist/${playlist.playlistId}`} className={cardClass}>
              {cardContent}
            </Link>
          ) : (
            <a key={playlist.playlistId} href={`https://www.youtube.com/playlist?list=${playlist.playlistId}`} target="_blank" rel="noopener noreferrer" className={cardClass}>
              {cardContent}
            </a>
          );
        })}
      </div>

      <Pagination page={page} total={totalPages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
    </section>
  );
}
