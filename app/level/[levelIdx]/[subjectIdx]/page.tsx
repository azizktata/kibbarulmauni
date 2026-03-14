import Link from "next/link";
import { notFound } from "next/navigation";
import { university, getSubject, getLevel } from "@/lib/data";
import { LEVEL_COLORS } from "@/lib/constants";
import { SubjectCoursesListClient } from "@/components/SubjectCoursesListClient";

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
        <SubjectCoursesListClient
          lIdx={lIdx}
          sIdx={sIdx}
          courses={subject.courses}
          col={c}
        />
      </main>
    </div>
  );
}
