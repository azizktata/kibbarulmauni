import Link from "next/link";
import { notFound } from "next/navigation";
import { university, getLevel } from "@/lib/data";
import { LEVEL_COLORS } from "@/lib/constants";
import { LevelSubjectsGrid } from "@/components/LevelSubjectsGrid";

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
        <LevelSubjectsGrid levelIdx={idx} subjects={level.subjects} col={c} />
      </main>
    </div>
  );
}
