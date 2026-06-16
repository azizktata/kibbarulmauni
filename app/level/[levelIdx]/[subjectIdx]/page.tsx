import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { university, getSubject, getLevel, countSubjectLessons } from "@/lib/data";
import { LEVEL_COLORS } from "@/lib/constants";
import { SubjectCoursesListClient } from "@/components/SubjectCoursesListClient";
import { absoluteUrl } from "@/lib/seo";

export function generateStaticParams() {
  const params = [];
  for (let l = 0; l < university.length; l++)
    for (let s = 0; s < university[l].subjects.length; s++)
      params.push({ levelIdx: String(l), subjectIdx: String(s) });
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ levelIdx: string; subjectIdx: string }>;
}): Promise<Metadata> {
  const { levelIdx, subjectIdx } = await params;
  const level = getLevel(Number(levelIdx));
  const subject = getSubject(Number(levelIdx), Number(subjectIdx));
  if (!level || !subject) return {};
  const description = `${subject.title} ضمن ${level.title} — ${subject.courses.length} مقرر و${countSubjectLessons(subject)} درس صوتي في العلم الشرعي، جامعة كبار العلماء.`;
  const path = `/level/${levelIdx}/${subjectIdx}`;
  return {
    title: subject.title,
    description,
    alternates: { canonical: path },
    openGraph: { title: subject.title, description, url: absoluteUrl(path) },
  };
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

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: level.title, item: absoluteUrl(`/level/${lIdx}`) },
      { "@type": "ListItem", position: 3, name: subject.title, item: absoluteUrl(`/level/${lIdx}/${sIdx}`) },
    ],
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
    />
    <div className="relative min-h-screen">
      {/* <div
        className="fixed inset-0 -z-10 bg-center bg-cover opacity-[0.20]"
        style={{ backgroundImage: "url('/islamic-geometri-3.jfif')" }}
      /> */}
      {/* Header */}
      <header className="relative text-white overflow-hidden">
        <div className="absolute inset-0 bg-center" style={{ backgroundImage: "url('/islamic-geometric-4.jfif')" }} />
        <div className={`absolute inset-0 bg-gradient-to-b ${c.gradient} opacity-70`} />
        <div className="relative w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
      <main className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <SubjectCoursesListClient
          lIdx={lIdx}
          sIdx={sIdx}
          courses={subject.courses}
        />
      </main>
    </div>
    </>
  );
}
