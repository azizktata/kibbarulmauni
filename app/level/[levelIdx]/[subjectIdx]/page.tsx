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
  const c = LEVEL_COLORS[0];

  return (
    <div className="relative min-h-screen">
      {/* <div
        className="fixed inset-0 -z-10 bg-center bg-cover opacity-[0.20]"
        style={{ backgroundImage: "url('/islamic-geometri-3.jfif')" }}
      /> */}
      {/* Header */}
      <header className="relative text-white overflow-hidden">
        <div className="absolute inset-0 bg-center" style={{ backgroundImage: "url('/islamic-geometric-4.jfif')" }} />
        <div className={`absolute inset-0 bg-gradient-to-b ${c.gradient} opacity-70`} />
        <div className="relative max-w-7xl mx-auto px-4 py-10">
          <nav className="flex items-center gap-1.5 text-white/60 text-xs mb-5 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">الرئيسية</Link>
            <span className="text-gold">›</span>
            <Link href={`/level/${lIdx}`} className="hover:text-white transition-colors">{level.title}</Link>
            <span className="text-gold">›</span>
            <span className="text-white font-medium">{subject.title}</span>
          </nav>
          <h1 className="text-2xl font-bold ">{subject.title}</h1>
          {/* <p className="text-white/70 mt-1 text-sm">{subject.courses.length} مقرر</p> */}
        </div>
      </header>

      {/* Courses */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <SubjectCoursesListClient
          lIdx={lIdx}
          sIdx={sIdx}
          courses={subject.courses}
        />
      </main>
    </div>
  );
}
