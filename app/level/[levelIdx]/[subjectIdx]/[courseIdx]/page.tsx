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
  const col = LEVEL_COLORS[lIdx];
  const siblings = subject.courses;

  return (
    <div className="min-h-screen">
      <header className={`bg-gradient-to-b ${col.gradient} text-white px-6 py-9`}>
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center gap-1.5 text-white/60 text-xs mb-4 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">الرئيسية</Link>
            <span>›</span>
            <Link href={`/level/${lIdx}`} className="hover:text-white transition-colors">{level.title}</Link>
            <span>›</span>
            <Link href={`/level/${lIdx}/${sIdx}`} className="hover:text-white transition-colors">{subject.title}</Link>
            <span>›</span>
            <span className="text-white font-medium">{course.title}</span>
          </nav>
          <h1 className="text-xl font-bold leading-snug">{course.title}</h1>
          <p className="text-white/70 mt-1 text-xs">{course.files.length} درس</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
        {course.files.length === 0 ? (
          <div className="text-center py-24 text-stone-400">
            <div className="text-5xl mb-4">🎧</div>
            <p className="text-sm">لا توجد دروس متاحة حالياً</p>
          </div>
        ) : (
          <CoursePlayer
            lessons={course.files}
            col={col}
            levelIdx={lIdx}
            subjectIdx={sIdx}
            courseIdx={cIdx}
            courseTitle={course.title}
            levelTitle={level.title}
          />
        )}

        {siblings.length > 1 && (
          <div>
            <p className="text-xs font-semibold text-stone-400 tracking-widest mb-3">
              مقررات أخرى في {subject.title}
            </p>
            <div className="flex flex-col gap-1.5">
              {siblings.map((sib, idx) => {
                const isActive = idx === cIdx;
                return (
                  <Link
                    key={idx}
                    href={`/level/${lIdx}/${sIdx}/${idx}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      isActive
                        ? `${col.light} ${col.border} ${col.text}`
                        : "bg-white border-stone-100 text-stone-600 hover:border-stone-200 hover:shadow-sm"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0 ${isActive ? `${col.bg} text-white` : "bg-stone-100 text-stone-400"}`}>
                      {idx + 1}
                    </span>
                    <span className="flex-1 truncate">{sib.title}</span>
                    <span className="text-xs opacity-60">{sib.files.length} درس</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
