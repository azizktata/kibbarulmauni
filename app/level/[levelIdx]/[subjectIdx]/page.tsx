import Link from "next/link";
import { notFound } from "next/navigation";
import { university, getSubject, getLevel, extractScholars } from "@/lib/data";
import { LEVEL_COLORS, ARABIC_DIGITS } from "@/lib/constants";

export function generateStaticParams() {
  const params = [];
  for (let l = 0; l < university.length; l++)
    for (let s = 0; s < university[l].subjects.length; s++)
      params.push({ levelIdx: String(l), subjectIdx: String(s) });
  return params;
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ levelIdx: string; subjectIdx: string }>;
}) {
  const { levelIdx, subjectIdx } = await params;
  const lIdx = Number(levelIdx);
  const sIdx = Number(subjectIdx);
  const level = getLevel(lIdx);
  const subject = getSubject(lIdx, sIdx);
  if (!level || !subject) notFound();
  const c = LEVEL_COLORS[lIdx];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className={`bg-gradient-to-b ${c.gradient} text-white px-6 py-10`}>
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-1.5 text-white/60 text-xs mb-5 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">الرئيسية</Link>
            <span>›</span>
            <Link href={`/level/${lIdx}`} className="hover:text-white transition-colors">{level.title}</Link>
            <span>›</span>
            <span className="text-white font-medium">{subject.title}</span>
          </nav>
          <h1 className="text-2xl font-bold">{subject.title}</h1>
          <p className="text-white/70 mt-1 text-sm">{subject.courses.length} مقرر</p>
        </div>
      </header>

      {/* Courses */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {subject.courses.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-sm">لا توجد مقررات متاحة حالياً</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {subject.courses.map((course, cIdx) => (
              <Link
                key={cIdx}
                href={`/level/${lIdx}/${sIdx}/${cIdx}`}
                className="group bg-white rounded-xl border border-stone-100 shadow-sm px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-stone-200 transition-all duration-200"
              >
                {/* Course number */}
                <div
                  className={`shrink-0 w-8 h-8 rounded-lg ${c.bg} text-white text-xs font-bold flex items-center justify-center`}
                >
                  {ARABIC_DIGITS[cIdx]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-800 text-sm leading-snug">
                    {course.title}
                  </h3>
                  {(() => {
                    const scholars = extractScholars(course);
                    return scholars.length > 0 ? (
                      <p className="text-xs text-stone-400 mt-1 truncate">
                        {scholars.map((s) => `الشيخ ${s}`).join("  ·  ")}
                      </p>
                    ) : null;
                  })()}
                </div>

                {/* Lesson count badge */}
                {course.files.length > 0 && (
                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${c.light} ${c.text}`}>
                    {course.files.length} درس
                  </span>
                )}

                {/* RTL forward arrow (points left) */}
                <div className="shrink-0 text-stone-200 group-hover:text-stone-400 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M10.5 8L6 4l-1 1L8.5 8 5 11l1 1 4.5-4z" transform="scale(-1,1) translate(-16,0)"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
