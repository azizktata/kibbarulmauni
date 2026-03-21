import Link from "next/link";
import { notFound } from "next/navigation";
import { scholarsIndex } from "@/lib/scholars";
import { LEVEL_COLORS } from "@/lib/constants";
import playlistsJson from "@/data/scholar-playlists.json";
import { ScholarProfileTabs } from "@/components/ScholarProfileTabs";
import type { ScholarPlaylist } from "@/components/ScholarPlaylistsSection";

const allPlaylists = playlistsJson as Record<string, ScholarPlaylist[]>;

let playlistIds: string[] = [];
try {
  playlistIds = (await import("@/data/playlist-ids.json")).default as string[];
} catch { /* file doesn't exist yet — run sync-playlist-items.mjs */ }

const knownPlaylistIds = new Set(playlistIds);

export function generateStaticParams() {
  return scholarsIndex.map((s) => ({ name: encodeURIComponent(s.name) }));
}

export default async function ScholarPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const c = LEVEL_COLORS[0];
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const scholar = scholarsIndex.find((s) => s.name === decoded);
  if (!scholar) notFound();

  return (
    <div className="min-h-screen">
      <header className="relative text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-center"
          style={{ backgroundImage: "url('/islamic-geometric-4.jfif')" }}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-b ${c.gradient} opacity-70`}
        />

        <div className="relative max-w-7xl mx-auto px-4 py-10">
          <nav className="flex items-center gap-1.5 text-white/60 text-xs mb-4 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">
              الرئيسية
            </Link>
            <span className="text-gold">›</span>
            <Link
              href="/scholars"
              className="hover:text-white transition-colors"
            >
              المشايخ
            </Link>
            <span className="text-gold">›</span>
            <span className="text-white font-medium">الشيخ {scholar.name}</span>
          </nav>
          <h1 className="text-3xl font-bold">الشيخ {scholar.name}</h1>
          <p className="text-white/70 text-sm mt-1">
            {scholar.courses.length} مقرر · {scholar.totalLessons} درس
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        <ScholarProfileTabs
          courses={scholar.courses}
          playlists={allPlaylists[scholar.name] ?? []}
          knownPlaylistIds={knownPlaylistIds}
        />
      </main>
    </div>
  );
}
