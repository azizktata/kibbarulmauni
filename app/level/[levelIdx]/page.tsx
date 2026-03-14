import Link from "next/link";
import { notFound } from "next/navigation";
import { university, getLevel, countSubjectLessons } from "@/lib/data";
import { LEVEL_COLORS, ARABIC_DIGITS } from "@/lib/constants";

export function generateStaticParams() {
  return university.map((_, idx) => ({ levelIdx: String(idx) }));
}

export default async function LevelPage({
  params,
}: {
  params: Promise<{ levelIdx: string }>;
}) {
  const { levelIdx } = await params;
  const idx = Number(levelIdx);
  const level = getLevel(idx);
  if (!level) notFound();
  const c = LEVEL_COLORS[idx];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className={`bg-gradient-to-b ${c.gradient} text-white px-6 py-10`}>
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center gap-2 text-white/60 text-xs mb-5">
            <Link href="/" className="hover:text-white transition-colors">الرئيسية</Link>
            <span>›</span>
            <span className="text-white font-medium">{level.title}</span>
          </nav>
          <h1 className="text-3xl font-bold">{level.title}</h1>
          <p className="text-white/70 mt-1 text-sm">{level.subjects.length} مادة دراسية</p>
        </div>
      </header>

      {/* Subjects grid */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {level.subjects.map((subject, sIdx) => {
            const lessons = countSubjectLessons(subject);
            return (
              <Link
                key={sIdx}
                href={`/level/${idx}/${sIdx}`}
                className="group bg-white rounded-2xl border border-stone-100 shadow-sm p-5 hover:shadow-md hover:border-stone-200 transition-all duration-200 flex items-start gap-4"
              >
                {/* Number badge */}
                <div
                  className={`shrink-0 w-9 h-9 rounded-xl ${c.bg} text-white text-sm font-bold flex items-center justify-center shadow-sm mt-0.5`}
                >
                  {ARABIC_DIGITS[sIdx]}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-800 text-sm leading-snug group-hover:text-stone-900">
                    {subject.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-stone-400">
                    <span>{subject.courses.length} مقرر</span>
                    {lessons > 0 && (
                      <>
                        <span className="text-stone-200">·</span>
                        <span>{lessons} درس</span>
                      </>
                    )}
                  </div>
                </div>

                {/* RTL: arrow pointing left = go forward */}
                <div className="shrink-0 text-stone-200 group-hover:text-stone-400 transition-colors mt-1">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M10 8L6 4.5l.9-.9L11.8 8 6.9 12.4 6 11.5 10 8z" transform="scale(-1,1) translate(-16,0)"/>
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
