import Link from "next/link";
import { university, countLevelLessons } from "@/lib/data";
import { LEVEL_COLORS, ARABIC_DIGITS } from "@/lib/constants";
import { RecentlyWatched } from "@/components/RecentlyWatched";

export default function HomePage() {
  const totalSubjects = university.reduce((s, l) => s + l.subjects.length, 0);
  const totalLessons  = university.reduce((s, l) => s + countLevelLessons(l), 0);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="relative bg-emerald-950 text-white overflow-hidden">
        {/* Decorative rings */}
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
          <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full border border-white/[0.04]" />
          <div className="absolute -top-20 -right-20 w-[20rem] h-[20rem] rounded-full border border-white/[0.06]" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full border border-white/[0.04] -translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-6 left-20 w-2 h-2 rounded-full bg-emerald-400/30" />
          <div className="absolute bottom-10 right-40 w-1.5 h-1.5 rounded-full bg-emerald-400/20" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-16 text-center">
          <span className="inline-block bg-emerald-800/60 text-emerald-300 text-[11px] font-semibold tracking-[0.25em] uppercase px-3 py-1 rounded-full mb-5 ring-1 ring-emerald-700/50">
            منهج الدراسة الشرعية
          </span>
          <h1 className="text-5xl sm:text-6xl font-bold mb-5 leading-tight tracking-tight">
            جامعة كبار العلماء
          </h1>
          <p className="text-emerald-200/60 text-sm max-w-md mx-auto leading-relaxed mb-10">
            منهج وفقاً لكلية الشريعة في جامعة محمد بن سعود الإسلامية،
            بصوتيات مشايخ كبار العلماء.
          </p>

          {/* Stats pill */}
          <div className="inline-flex items-center bg-white/[0.06] rounded-2xl overflow-hidden ring-1 ring-white/10">
            {[
              { value: "٨",          label: "مستويات" },
              { value: totalSubjects, label: "مادة"     },
              { value: totalLessons,  label: "درس"      },
            ].map((s, i) => (
              <div key={i} className="px-7 py-4 text-center first:border-l border-white/10">
                <div className="text-2xl font-bold tabular-nums">{s.value}</div>
                <div className="text-emerald-400 text-[11px] mt-0.5 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <RecentlyWatched />

      {/* Levels */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-xs font-semibold text-stone-400 tracking-widest">اختر المستوى</span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {university.map((level, idx) => {
            const lessons = countLevelLessons(level);
            const c = LEVEL_COLORS[idx];
            return (
              <Link
                key={idx}
                href={`/level/${idx}`}
                className="group bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-lg hover:-translate-y-1.5 hover:border-stone-200 transition-all duration-200"
              >
                <div className={`h-1 w-full bg-gradient-to-l ${c.gradient}`} />
                <div className="p-5">
                  <div className={`w-11 h-11 rounded-xl ${c.bg} text-white flex items-center justify-center text-xl font-bold mb-4 shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                    {ARABIC_DIGITS[idx]}
                  </div>
                  <h3 className="font-bold text-stone-800 text-sm leading-snug mb-3">
                    {level.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`${c.light} ${c.text} text-[11px] font-semibold px-1.5 py-0.5 rounded-full`}>
                      {level.subjects.length} مادة
                    </span>
                    <span className="text-stone-300">·</span>
                    <span className="text-stone-400">{lessons} درس</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-stone-100 py-8 text-center text-xs text-stone-400">
        جامعة كبار العلماء · منهج الدراسة الشرعية
      </footer>
    </div>
  );
}
