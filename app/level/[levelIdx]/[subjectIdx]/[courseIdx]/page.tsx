import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { university, getLevel, getSubject, getCourse } from "@/lib/data";
import { LEVEL_COLORS } from "@/lib/constants";
import { CoursePlayer } from "@/components/CoursePlayer";

export function generateStaticParams() {
  const params = [];
  for (let l = 0; l < university.length; l++)
    for (let s = 0; s < university[l].subjects.length; s++)
      for (let c = 0; c < university[l].subjects[s].courses.length; c++)
        params.push({ levelIdx: String(l), subjectIdx: String(s), courseIdx: String(c) });
  return params;
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ levelIdx: string; subjectIdx: string; courseIdx: string }>;
}) {
  const { levelIdx, subjectIdx, courseIdx } = await params;
  const lIdx = Number(levelIdx);
  const sIdx = Number(subjectIdx);
  const cIdx = Number(courseIdx);
  const level   = getLevel(lIdx);
  const subject = getSubject(lIdx, sIdx);
  const course  = getCourse(lIdx, sIdx, cIdx);
  if (!level || !subject || !course) notFound();
  const col = LEVEL_COLORS[0];
  const siblings = subject.courses;

  return (
    <div className="relative min-h-screen">
      {/* Mobile decorative header */}
      <header className="relative text-white overflow-hidden lg:hidden">
        <div className="absolute inset-0 bg-center" style={{ backgroundImage: "url('/islamic-geometric-4.jfif')" }} />
        <div className={`absolute inset-0 bg-gradient-to-b ${col.gradient} opacity-70`} />
        <div className="relative max-w-7xl mx-auto px-4 py-8">
          <nav className="flex items-center gap-1.5 text-white/60 text-xs mb-4 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">الرئيسية</Link>
            <span className="text-gold">›</span>
            <Link href={`/level/${lIdx}`} className="hover:text-white transition-colors">{level.title}</Link>
            <span className="text-gold">›</span>
            <Link href={`/level/${lIdx}/${sIdx}`} className="hover:text-white transition-colors">{subject.title}</Link>
            <span className="text-gold">›</span>
            <span className="text-white font-medium">{course.title}</span>
          </nav>
          <h1 className="text-xl font-bold">{course.title}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-8 lg:py-6 flex flex-col gap-4">
        {/* Desktop breadcrumb */}
        <nav className="hidden lg:flex items-center gap-1.5 pr-1 text-stone-400 dark:text-white/40 text-xs flex-wrap">
          <Link href="/" className="hover:text-stone-700 dark:hover:text-white/70 transition-colors">الرئيسية</Link>
          <span className="text-gold">›</span>
          <Link href={`/level/${lIdx}`} className="hover:text-stone-700 dark:hover:text-white/70 transition-colors">{level.title}</Link>
          <span className="text-gold">›</span>
          <Link href={`/level/${lIdx}/${sIdx}`} className="hover:text-stone-700 dark:hover:text-white/70 transition-colors">{subject.title}</Link>
          <span className="text-gold">›</span>
          <span className="text-stone-600 dark:text-white/60 font-medium">{course.title}</span>
        </nav>

        {course.files.length === 0 ? (
          <div className="text-center py-24 text-stone-400">
            <div className="text-5xl mb-4">🎧</div>
            <p className="text-sm">لا توجد دروس متاحة حالياً</p>
          </div>
        ) : (
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-stone-400 text-sm">جارٍ التحميل…</div>}>
            <CoursePlayer
              lessons={course.files}
              col={col}
              levelIdx={lIdx}
              subjectIdx={sIdx}
              courseIdx={cIdx}
              courseTitle={course.title}
              levelTitle={level.title}
              siblings={siblings}
              subjectTitle={subject.title}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
}
