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
  const c = LEVEL_COLORS[0];

  return (
    <div className="relative min-h-screen">
      {/* Full-page geometric background */}
      {/* <div
        className="fixed inset-0 -z-10 bg-center bg-cover opacity-[0.20]"
        style={{ backgroundImage: "url('/islamic-geometri-3.jfif')" }}
      /> */}
      {/* Header */}
      <header className="relative text-white px-6 py-10 overflow-hidden">
        <div
          className="absolute inset-0  bg-center"
          style={{ backgroundImage: "url('/islamic-geometric-4.jfif')"}}
        />
        <div className={`absolute inset-0 bg-gradient-to-b ${c.gradient} opacity-70`} />
        <div className="relative max-w-5xl mx-auto">
          <nav className="flex items-center gap-2 text-white/60 text-xs mb-5">
            <Link href="/" className="hover:text-white transition-colors">الرئيسية</Link>
            <span className="text-gold">›</span>
            <span className="text-white font-medium">{level.title}</span>
          </nav>
          <h1 className="text-3xl font-bold">{level.title}</h1>
          <p className="text-white/70 mt-1 text-sm">{level.subjects.length} مادة دراسية</p>
        </div>
      </header>


      {/* Subjects grid */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        <LevelSubjectsGrid levelIdx={idx} subjects={level.subjects} />
      </main>
    </div>
  );
}
