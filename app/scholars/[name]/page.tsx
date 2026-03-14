import Link from "next/link";
import { notFound } from "next/navigation";
import { scholarsIndex } from "@/lib/scholars";
import { LEVEL_COLORS } from "@/lib/constants";

export function generateStaticParams() {
  return scholarsIndex.map((s) => ({ name: encodeURIComponent(s.name) }));
}

export default async function ScholarPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const scholar = scholarsIndex.find((s) => s.name === decoded);
  if (!scholar) notFound();

  return (
    <div className="min-h-screen">
      <header className="bg-emerald-950 text-white px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-1.5 text-white/60 text-xs mb-4 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">الرئيسية</Link>
            <span>›</span>
            <Link href="/scholars" className="hover:text-white transition-colors">المشايخ</Link>
            <span>›</span>
            <span className="text-white font-medium">الشيخ {scholar.name}</span>
          </nav>
          <h1 className="text-2xl font-bold">الشيخ {scholar.name}</h1>
          <p className="text-white/60 text-sm mt-1">
            {scholar.courses.length} مقرر · {scholar.totalLessons} درس
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-2">
          {scholar.courses.map((course, i) => {
            const col = LEVEL_COLORS[course.levelIdx];
            return (
              <Link
                key={i}
                href={`/level/${course.levelIdx}/${course.subjectIdx}/${course.courseIdx}`}
                className="group bg-white rounded-xl border border-stone-100 shadow-sm px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-stone-200 transition-all"
              >
                <div className={`shrink-0 w-2 h-10 rounded-full ${col.bg}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-800 text-sm leading-snug">{course.courseTitle}</p>
                  <p className="text-xs text-stone-400 mt-1">
                    {course.levelTitle} · {course.subjectTitle}
                  </p>
                </div>
                <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${col.light} ${col.text}`}>
                  {course.lessonCount} درس
                </span>
                <div className="shrink-0 text-stone-200 group-hover:text-stone-400 transition-colors">
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
