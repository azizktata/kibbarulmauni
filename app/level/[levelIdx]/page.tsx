import Link from "next/link";
import { notFound } from "next/navigation";
import { university, getLevel, countLevelLessons } from "@/lib/data";
import { LEVEL_COLORS } from "@/lib/constants";
import { LevelSubjectsGrid } from "@/components/LevelSubjectsGrid";

function subjectWord(n: number) {
  if (n === 2) return "مادتان";
  if (n >= 3 && n <= 10) return "مواد";
  return "مادة";
}

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

  const totalLessons = countLevelLessons(level);
  const col =  LEVEL_COLORS[0];

  return (
    <div className="relative min-h-screen bg-[#F6F5F1] dark:bg-transparent">

      {/* Header — identical structure to subject page banner */}
      <header className="relative text-white overflow-hidden">
        <div className="absolute inset-0 bg-center" style={{ backgroundImage: "url('/islamic-geometric-4.jfif')" }} />
        <div className={`absolute inset-0 bg-gradient-to-b ${col.gradient} opacity-70`} />

        <div className="relative w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <nav className="flex items-center gap-1.5 text-white/60 text-xs mb-5 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">الرئيسية</Link>
            <span className="text-gold">›</span>
            <span className="text-white font-medium">{level.title}</span>
          </nav>
          <h1 className="text-2xl font-bold">{level.title}</h1>
          <p className="text-white/70 mt-1 text-sm">
            {level.subjects.length} {subjectWord(level.subjects.length)}
            <span className="mx-2 text-white/30">·</span>
            {totalLessons} درس
          </p>
        </div>
      </header>

      {/* Subjects grid */}
      <main className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <LevelSubjectsGrid levelIdx={idx} subjects={level.subjects} />
      </main>

    </div>
  );
}
