import { university } from "@/lib/data";
import { RecentlyWatched } from "@/components/RecentlyWatched";
import { HomeLevelsGrid } from "@/components/HomeLevelsGrid";
import { RotatingQuote } from "@/components/RotatingQuote";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      {/* Hero */}
      <header className="relative bg-emerald-950 text-white overflow-hidden">
           <div className="absolute inset-0 bg-center" style={{ backgroundImage: "url('/islamic-geometric-4.jfif')" }} />
        <div className={`absolute inset-0 bg-gradient-to-b from-emerald-900 to-emerald-800 opacity-60`} />

        <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-12 text-center">
          {/* Top label */}
          {/* <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-12 bg-gold/25" />
            <span className="text-[10px] text-gold/40 tracking-[.22em] font-bold">مشروع الدعوة الإلكترونية</span>
            <div className="h-px w-12 bg-gold/25" />
          </div> */}

          <div className="flex justify-center mb-8">
            <Image
              src="/logo.png"
              alt="جامعة كبار العلماء"
              width={340}
              height={148}
              className="object-contain w-48 sm:w-64 md:w-[280px] h-auto"
              priority
            />
          </div>

          <RotatingQuote />

          {/* CTA buttons */}
          {/* <div className="flex items-center justify-center gap-3 mt-8">
            <Link
              href="/about"
              className="border border-gold/40 text-gold/80 px-6 py-2.5 text-xs font-semibold tracking-[.08em] hover:bg-gold hover:text-primary hover:border-gold transition-all duration-200"
            >
              عن الجامعة
            </Link>
            <Link
              href="/scholars"
              className="border border-white/15 text-white/50 px-6 py-2.5 text-xs font-semibold tracking-[.08em] hover:border-white/30 hover:text-white/80 transition-all duration-200"
            >
              المشايخ
            </Link>
          </div> */}
        </div>

        {/* Bottom divider */}
        <div
          className="h-px w-full"
          style={{ background: "linear-gradient(to left,transparent,rgba(240,188,83,.3) 25%,rgba(240,188,83,.6) 50%,rgba(240,188,83,.3) 75%,transparent)" }}
        />
      </header>

      {/* Cream section: recently watched + levels — continuous visual flow */}
      <main className="bg-[#F6F5F1] dark:bg-transparent">
        <div
          className="h-px w-full"
          style={{ background: "linear-gradient(to left,transparent,rgba(240,188,83,.2) 20%,rgba(240,188,83,.55) 50%,rgba(240,188,83,.2) 80%,transparent)" }}
        />

        <RecentlyWatched />

        <div className="max-w-7xl mx-auto px-4 pt-8 pb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-[#DEDAD0] dark:bg-white/10" />
            <span className="text-[10px] font-bold text-[#C9973A]/70 dark:text-gold/40 tracking-[.22em]">
              اختر المستوى
            </span>
            <div className="h-px flex-1 bg-[#DEDAD0] dark:bg-white/10" />
          </div>
          <HomeLevelsGrid levels={university} />
        </div>
      </main>

      {/* Option C: split footer */}
      <footer style={{ borderTop: "1px solid rgba(240,188,83,.12)" }}>
        <div
          className="h-px w-full"
          style={{ background: "linear-gradient(to left,transparent,rgba(240,188,83,.15) 20%,rgba(240,188,83,.35) 50%,rgba(240,188,83,.15) 80%,transparent)" }}
        />
        <div className="grid md:grid-cols-2">
          <div className="px-8 py-6 flex items-center text-xs text-stone-400 dark:text-white/25 bg-stone-50 dark:bg-transparent">
            مرجعية موثوقة في تلقي العلم الشرعي — منهج وفق كلية الشريعة بصوتيات مشايخ كبار العلماء الثقات.
          </div>
          <div className="px-8 py-6 flex items-center gap-5 border-t md:border-t-0 border-stone-100 dark:border-white/[.05] bg-[#F6F5F1] dark:bg-transparent">
            <a
              href="https://www.kibbarulmauni.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#5A4E2A] dark:text-white/30 hover:text-primary dark:hover:text-white/60 transition-colors"
            >
              الموقع الرسمي
            </a>
            <span className="text-[#DEDAD0] dark:text-white/10">·</span>
            <a
              href="https://www.youtube.com/@kibbarulmauni"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#5A4E2A] dark:text-white/30 hover:text-red-500 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 14" fill="currentColor">
                <path d="M19.6 2.2C19.4 1.4 18.8.8 18 .6 16.4.2 10 .2 10 .2S3.6.2 2 .6C1.2.8.6 1.4.4 2.2 0 3.8 0 7 0 7s0 3.2.4 4.8c.2.8.8 1.4 1.6 1.6C3.6 13.8 10 13.8 10 13.8s6.4 0 8-.4c.8-.2 1.4-.8 1.6-1.6.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM8 10V4l5.3 3L8 10z" />
              </svg>
              قناة يوتيوب
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
