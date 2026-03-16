import { university, countLevelLessons } from "@/lib/data";
import { RecentlyWatched } from "@/components/RecentlyWatched";
import { HomeLevelsGrid } from "@/components/HomeLevelsGrid";
import { RotatingQuote } from "@/components/RotatingQuote";
import Image from "next/image";

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
          <div className="flex justify-center mb-8">
                     <Image
                       src="/logo.png"
                       alt="جامعة كبار العلماء"
                       width={320}
                       height={140}
                       className="object-contain w-56 sm:w-72 md:w-80 h-auto"
                       priority
                     />
                   </div>

          {/* Stats pill */}
          {/* <div className="inline-flex items-center bg-white/[0.06] rounded-2xl overflow-hidden ring-1 ring-white/10">
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
          </div> */}

          <RotatingQuote />
        </div>
      </header>

      <RecentlyWatched />

      {/* Levels */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-stone-200 dark:bg-white/10" />
          <span className="text-xs font-semibold text-stone-400 dark:text-white/30 tracking-widest">اختر المستوى</span>
          <div className="h-px flex-1 bg-stone-200 dark:bg-white/10" />
        </div>

        <HomeLevelsGrid levels={university} />
      </main>

      <footer className="border-t border-stone-100 dark:border-white/[0.07] py-8 text-center text-xs text-stone-400 dark:text-white/25 flex flex-col items-center gap-2">
        <span>جامعة كبار العلماء · منهج الدراسة الشرعية</span>
        <div className="flex items-center gap-4">
          <a href="https://www.kibbarulmauni.com" target="_blank" rel="noopener noreferrer" className="hover:text-stone-600 dark:hover:text-white/60 transition-colors">
            الموقع الرسمي
          </a>
          <span className="text-stone-200 dark:text-white/10">·</span>
          <a href="https://www.youtube.com/@kibbarulmauni" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors flex items-center gap-1">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 14" fill="currentColor">
              <path d="M19.6 2.2C19.4 1.4 18.8.8 18 .6 16.4.2 10 .2 10 .2S3.6.2 2 .6C1.2.8.6 1.4.4 2.2 0 3.8 0 7 0 7s0 3.2.4 4.8c.2.8.8 1.4 1.6 1.6C3.6 13.8 10 13.8 10 13.8s6.4 0 8-.4c.8-.2 1.4-.8 1.6-1.6.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM8 10V4l5.3 3L8 10z" />
            </svg>
            قناة يوتيوب
          </a>
        </div>
      </footer>
    </div>
  );
}
