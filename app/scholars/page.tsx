import Link from "next/link";
import { scholarsIndex } from "@/lib/scholars";
import { LEVEL_COLORS } from "@/lib/constants";

export default function ScholarsPage() {
  return (
    <div className="min-h-screen">
      <header className="bg-emerald-950 text-white px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-1.5 text-white/60 text-xs mb-4">
            <Link href="/" className="hover:text-white transition-colors">الرئيسية</Link>
            <span>›</span>
            <span className="text-white font-medium">المشايخ</span>
          </nav>
          <h1 className="text-2xl font-bold">المشايخ</h1>
          <p className="text-white/60 text-sm mt-1">{scholarsIndex.length} شيخ</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {scholarsIndex.map((scholar) => {
            // Pick color based on most-represented level
            const levelCounts = new Map<number, number>();
            for (const c of scholar.courses)
              levelCounts.set(c.levelIdx, (levelCounts.get(c.levelIdx) ?? 0) + c.lessonCount);
            const dominantLevel = [...levelCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
            const col = LEVEL_COLORS[dominantLevel];

            return (
              <Link
                key={scholar.name}
                href={`/scholars/${encodeURIComponent(scholar.name)}`}
                className="group bg-white dark:bg-white/[0.04] rounded-xl border border-stone-100 dark:border-white/[0.08] shadow-sm px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-stone-200 dark:hover:border-white/[0.15] dark:hover:bg-white/[0.08] transition-all"
              >
                <div className={`shrink-0 w-10 h-10 rounded-xl ${col.bg} text-white flex items-center justify-center text-sm font-bold`}>
                  {scholar.name.split(" ").at(-1)?.[0] ?? "ش"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-800 dark:text-white/80 text-sm">الشيخ {scholar.name}</p>
                  <p className="text-xs text-stone-400 dark:text-white/35 mt-0.5">
                    {scholar.courses.length} مقرر · {scholar.totalLessons} درس
                  </p>
                </div>
                <div className="shrink-0 text-stone-200 dark:text-white/20 group-hover:text-stone-400 dark:group-hover:text-white/40 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M10.5 8L6 4l-1 1L8.5 8 5 11l1 1 4.5-4z" transform="scale(-1,1) translate(-16,0)" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
