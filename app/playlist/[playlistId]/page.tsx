import { Suspense } from "react";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { LEVEL_COLORS } from "@/lib/constants";
import { CoursePlayer } from "@/components/CoursePlayer";
import scholarPlaylistsJson from "@/data/scholar-playlists.json";
import playlistIdsJson from "@/data/playlist-ids.json";
import type { ScholarPlaylist } from "@/components/ScholarPlaylistsSection";

const allPlaylists = scholarPlaylistsJson as Record<string, ScholarPlaylist[]>;
const knownIds = new Set(playlistIdsJson as string[]);
const playlistsDir = resolve(process.cwd(), "data/playlists");

export function generateStaticParams() {
  try {
    return readdirSync(playlistsDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => ({ playlistId: f.replace(".json", "") }));
  } catch {
    return [];
  }
}

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ playlistId: string }>;
}) {
  const { playlistId } = await params;

  let items: { videoId: string; title: string; position: number }[] = [];
  try {
    items = JSON.parse(readFileSync(resolve(playlistsDir, `${playlistId}.json`), "utf8"));
  } catch {
    notFound();
  }
  if (items.length === 0) notFound();

  // Find which scholar owns this playlist
  let scholarName = "";
  let playlist: ScholarPlaylist | undefined;
  for (const [name, playlists] of Object.entries(allPlaylists)) {
    const found = playlists.find((p) => p.playlistId === playlistId);
    if (found) { scholarName = name; playlist = found; break; }
  }

  // Detect leading lesson number in title (e.g. "18 - تفسير..." → 18)
  function leadingNum(title: string): number | null {
    const m = title.match(/^(\d+)\s*[-–]/);
    return m ? parseInt(m[1], 10) : null;
  }
  // If the majority of titles carry a leading number, sort by that number
  // (handles channels that uploaded lessons in wrong order)
  const titlesWithNum = items.filter((v) => leadingNum(v.title) !== null).length;
  const sortedItems = titlesWithNum >= items.length * 0.6
    ? [...items].sort((a, b) => (leadingNum(a.title) ?? 0) - (leadingNum(b.title) ?? 0))
    : [...items].sort((a, b) => a.position - b.position);

  // Map to Lesson shape
  const lessons = sortedItems.map((v) => ({
    title: v.title,
    url: `https://www.youtube.com/watch?v=${v.videoId}`,
    youtube: `https://www.youtube.com/watch?v=${v.videoId}`,
  }));

  const col = LEVEL_COLORS[0];
  const playlistTitle = playlist?.title ?? playlistId;
  const category = playlist?.category ?? "";

  // Related: other playlists from the same scholar + same category (exclude current)
  const related: ScholarPlaylist[] = scholarName && category
    ? (allPlaylists[scholarName] ?? [])
        .filter((p) => p.playlistId !== playlistId && p.category === category)
        .slice(0, 8)
    : [];

  return (
    <div className="relative min-h-screen">
      {/* Mobile decorative header */}
      <header className="relative text-white overflow-hidden lg:hidden">
        <div className="absolute inset-0 bg-center" style={{ backgroundImage: "url('/islamic-geometric-4.jfif')" }} />
        <div className={`absolute inset-0 bg-gradient-to-b ${col.gradient} opacity-70`} />
        <div className="relative max-w-7xl mx-auto px-4 py-6">
          <nav className="flex items-center gap-1.5 text-white/60 text-xs mb-4 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">الرئيسية</Link>
            <span className="text-gold">›</span>
            <Link href="/scholars" className="hover:text-white transition-colors">المشايخ</Link>
            {scholarName && (
              <>
                <span className="text-gold">›</span>
                <Link href={`/scholars/${encodeURIComponent(scholarName)}`} className="hover:text-white transition-colors">
                  الشيخ {scholarName}
                </Link>
              </>
            )}
            <span className="text-gold">›</span>
            <span className="text-white font-medium line-clamp-1">{playlistTitle}</span>
          </nav>
          {/* <h1 className="text-xl font-bold">{playlistTitle}</h1>
          {category && <p className="text-white/60 text-xs mt-1">{category}</p>} */}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-8 lg:py-6 flex flex-col gap-4">
        {/* Desktop breadcrumb */}
        <nav className="hidden lg:flex items-center gap-1.5 pr-1 text-stone-400 dark:text-white/40 text-xs flex-wrap">
          <Link href="/" className="hover:text-stone-700 dark:hover:text-white/70 transition-colors">الرئيسية</Link>
          <span className="text-gold">›</span>
          <Link href="/scholars" className="hover:text-stone-700 dark:hover:text-white/70 transition-colors">المشايخ</Link>
          {scholarName && (
            <>
              <span className="text-gold">›</span>
              <Link
                href={`/scholars/${encodeURIComponent(scholarName)}`}
                className="hover:text-stone-700 dark:hover:text-white/70 transition-colors"
              >
                الشيخ {scholarName}
              </Link>
            </>
          )}
          <span className="text-gold">›</span>
          <span className="text-stone-600 dark:text-white/60 font-medium line-clamp-1">{playlistTitle}</span>
        </nav>

        {category && (
          <span className="self-start text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary dark:bg-white/[0.08] dark:text-white/50 hidden lg:inline-flex">
            {category}
          </span>
        )}

        <Suspense fallback={<div className="h-64 flex items-center justify-center text-stone-400 text-sm">جارٍ التحميل…</div>}>
          <CoursePlayer
            lessons={lessons}
            col={col}
            levelIdx={null}
            subjectIdx={0}
            courseIdx={0}
            courseTitle={playlistTitle}
            levelTitle={scholarName ? `الشيخ ${scholarName}` : "قوائم يوتيوب"}
            keyPrefix={`playlist:${playlistId}`}
          />
        </Suspense>

        {/* Related playlists — same scholar, same category */}
        {related.length > 0 && (
          <section className="mt-4 border-t border-stone-100 dark:border-white/[0.07] pt-8">
            <h2 className="text-sm font-semibold text-stone-700 dark:text-white/60 mb-4">
              قوائم أخرى في <span className="text-primary dark:text-gold">{category}</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {related.map((p) => {
                const href = knownIds.has(p.playlistId)
                  ? `/playlist/${p.playlistId}`
                  : `https://www.youtube.com/playlist?list=${p.playlistId}`;
                const isExternal = !knownIds.has(p.playlistId);
                return (
                  <Link
                    key={p.playlistId}
                    href={href}
                    {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group bg-white dark:bg-white/[0.04] rounded-2xl border border-stone-100 dark:border-white/[0.08] overflow-hidden hover:shadow-md hover:-translate-y-0.5 hover:border-gold/30 transition-all duration-200 flex flex-col"
                  >
                    <div className="relative w-full aspect-video bg-stone-100 dark:bg-white/[0.06] overflow-hidden">
                      {p.thumbnail ? (
                        <Image
                          src={p.thumbnail}
                          alt={p.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-primary/20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute bottom-1.5 left-1.5 bg-black/60 rounded px-1.5 py-0.5 text-white text-[10px]">
                        {p.videoCount} درس
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-medium text-stone-800 dark:text-white/75 leading-snug line-clamp-2">
                        {p.title}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
