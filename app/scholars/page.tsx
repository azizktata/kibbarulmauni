import Link from "next/link";
import { scholarsIndex, type Scholar } from "@/lib/scholars";
import { LEVEL_COLORS, JOURNEY_GRADIENTS, GRADIENTS } from "@/lib/constants";
import { SCHOLAR_WEBSITES, SCHOLAR_YOUTUBE } from "@/lib/scholarWebsites";

function prepareScholar(scholar: Scholar) {
  const levelCounts = new Map<number, number>();
  for (const c of scholar.courses)
    levelCounts.set(c.levelIdx, (levelCounts.get(c.levelIdx) ?? 0) + c.lessonCount);
  const dominantLevel = [...levelCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
  const uniqueLevels = [
    ...new Map(
      scholar.courses.map((c) => [c.levelIdx, { idx: c.levelIdx, title: c.levelTitle }]),
    ).values(),
  ].sort((a, b) => a.idx - b.idx);
  return {
    gradient: GRADIENTS[dominantLevel] ?? JOURNEY_GRADIENTS[0],
    uniqueLevels,
    websiteUrl: SCHOLAR_WEBSITES[scholar.name],
    youtubeUrl: SCHOLAR_YOUTUBE[scholar.name],
  };
}

const preparedScholars = scholarsIndex.map(prepareScholar);

export default function ScholarsPage() {
  const c = LEVEL_COLORS[0];
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
          <nav className="flex items-center gap-1.5 text-white/60 text-xs mb-4">
            <Link href="/" className="hover:text-white transition-colors">
              الرئيسية
            </Link>
            <span className="text-gold">›</span>
            <span className="text-white font-medium">المشايخ</span>
          </nav>
          <h1 className="text-3xl font-bold">المشايخ</h1>
          <p className="text-white/70 text-sm mt-1">
            {scholarsIndex.length} شيخ
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {scholarsIndex.map((scholar, i) => {
            const { gradient, uniqueLevels, websiteUrl, youtubeUrl } = preparedScholars[i];

            return (
              <div
                key={scholar.name}
                className="relative group bg-white dark:bg-white/[0.04] rounded-xl border border-[#DEDAD0] dark:border-white/[0.06] overflow-hidden hover:shadow-[0_4px_24px_rgba(240,188,83,.12)] hover:-translate-y-0.5 hover:border-[#C9973A]/35 transition-all duration-200 flex flex-col"
              >
                {/* Header quick-links */}
                {(websiteUrl || youtubeUrl) && (
                  <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1">
                    {websiteUrl && (
                      <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full bg-black/25 hover:bg-black/45 text-white/70 hover:text-white transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <circle cx="12" cy="12" r="10" />
                          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      </a>
                    )}
                    {youtubeUrl && (
                      <a
                        href={youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full bg-black/25 hover:bg-black/45 text-white/70 hover:text-white transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
                <Link
                  href={`/scholars/${encodeURIComponent(scholar.name)}`}
                  className="flex flex-col flex-1"
                >
                  {/* Header */}
                  <div className="relative h-36 overflow-hidden flex items-center justify-center">
                    {/* Journey gradient base */}
                    <div className="absolute inset-0" style={{ background: gradient }} />
                    {/* SVG geometric pattern overlay */}
                    <svg
                      className="absolute inset-0 w-full h-full opacity-[.18] group-hover:opacity-[.28] transition-opacity duration-300 pointer-events-none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <pattern id={`sp-${i}`} x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
                          {/* Outer diamond */}
                          <path d="M18 1 L35 18 L18 35 L1 18 Z" fill="none" stroke="#F0BC53" strokeWidth="0.7"/>
                          {/* Inner rotated square */}
                          <path d="M18 7 L29 18 L18 29 L7 18 Z" fill="none" stroke="#F0BC53" strokeWidth="0.5"/>
                          {/* Corner dots */}
                          <circle cx="18" cy="1"  r="1" fill="#F0BC53"/>
                          <circle cx="35" cy="18" r="1" fill="#F0BC53"/>
                          <circle cx="18" cy="35" r="1" fill="#F0BC53"/>
                          <circle cx="1"  cy="18" r="1" fill="#F0BC53"/>
                          {/* Center */}
                          <circle cx="18" cy="18" r="1.5" fill="#F0BC53"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill={`url(#sp-${i})`}/>
                    </svg>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
                    {/* Gold bottom edge */}
                    <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-gold/40 to-transparent" />
                    <p
                      className="relative z-10 text-white text-xl font-bold text-center px-4 leading-relaxed drop-shadow-md line-clamp-3"
                 
                    >
                      الشيخ {scholar.name}
                    </p>
                  </div>

                  {/* Info */}
                  <div className="px-4 pt-3 pb-3 flex flex-col gap-2.5">
                    {/* Stats row */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#0F2822]/40 dark:text-white/40">
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        <span>{scholar.courses.length} مقرر</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#0F2822]/40 dark:text-white/40">
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                        </svg>
                        <span>{scholar.totalLessons} درس</span>
                      </div>
                      {scholar.totalSeconds > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#0F2822]/40 dark:text-white/40">
                          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                          <span>{Math.round(scholar.totalSeconds / 3600)} ساعة</span>
                        </div>
                      )}
                    </div>

                    {/* Level badges */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {uniqueLevels.slice(0, 3).map(({ idx, title }) => {
                        const lc = LEVEL_COLORS[idx];
                        return (
                          <span
                            key={idx}
                            className={`text-[10px] font-bold px-2 py-0.5 border ${lc.light} ${lc.text} ${lc.border}`}
                          >
                            {title}
                          </span>
                        );
                      })}
                      {uniqueLevels.length > 3 && (
                        <span className="text-[10px] text-[#C9973A]/50 dark:text-white/30">
                          +{uniqueLevels.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
