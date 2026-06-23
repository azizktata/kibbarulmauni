import type { Metadata } from "next";
import { university } from "@/lib/data";
import { RecentlyWatched } from "@/components/RecentlyWatched";
import { HomeLevelsGrid } from "@/components/HomeLevelsGrid";
import { RotatingQuote } from "@/components/RotatingQuote";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "كلية شريعة عن بعد لطلب العلم الشرعي",
  description:
    "ابدأ رحلتك في طلب العلم الشرعي عن بعد مع جامعة كبار العلماء — منهج متكامل لكلية الشريعة، دروس صوتية بأصوات كبار العلماء كالشيخ محمد بن صالح العثيمين والشيخ صالح الفوزان، مناسب لطالب العلم المبتدئ والمتقدم.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <div className="relative min-h-screen ">
      <link rel="preload" as="image" href="/islamic-geometric-4.jfif" fetchPriority="high" />
      {/* Hero */}
      <header className="relative bg-emerald-950 text-white overflow-hidden">
           <div className="absolute inset-0 bg-center" style={{ backgroundImage: "url('/islamic-geometric-4.jfif')" }} />
        <div className={`absolute inset-0 bg-gradient-to-b from-emerald-900 to-emerald-900 opacity-30`} />

        <div className="relative w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 text-center">
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
              className="object-contain w-64 sm:w-84 md:w-[350px] lg:w-[400px] h-auto"
              priority
            />
          </div>

          {/* <h1 className="text-xs text-gold/40 tracking-[.18em] font-bold mb-6">
            كلية شريعة عن بعد — طلب علم شرعي مع كبار العلماء
          </h1> */}

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

        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
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

      {/* SEO text section — server-rendered, crawlable by Google */}
      <section className="bg-[#F6F5F1] dark:bg-[#111111] border-t border-[#DEDAD0] dark:border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <h2 className="text-xl font-bold text-[#0F2822] dark:text-cream mb-4" style={{ fontFamily: "var(--font-amiri)" }}>
            عن جامعة كبار العلماء 
          </h2>
          <div className="grid sm:grid-cols-2 gap-8 text-sm text-[#4A3E22] dark:text-stone-400 leading-[2]">
            <div>
              <p className="mb-4">
                نحن مشروع كبار العلماء للتسهيل على طلبة العلم، قمنا بعمل منهج وفقاً لكلية الشريعة
                في جامعة الإمام محمد بن سعود الإسلامية، وتم اختيار الصوتيات لمشايخ كبار العلماء
                وعلى منهج الجامعة.
              </p>
              <p>
                المنصة مخصصة لكل من يريد <strong className="font-semibold text-[#0F2822] dark:text-cream">طلب علم عن بعد</strong> بمنهج
                منظّم ومتكامل — من مرحلة الأساس حتى التمكن، مجاناً بالكامل.
              </p>
            </div>
            <div>
              <p className="mb-4">
                تضم الجامعة ثمانية مستويات دراسية تغطي مواد{" "}
                العقيدة والتوحيد، الفقه، الحديث وعلومه، التفسير، أصول الفقه، النحو والصرف،
                والسيرة النبوية.
              </p>
              <p>
                الدروس بأصوات كبار العلماء الثقات: الشيخ محمد بن صالح العثيمين، الشيخ صالح
                الفوزان، الشيخ عبد العزيز بن باز، وعشرة من العلماء الربانيين.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Option C: split footer */}
      <footer style={{ borderTop: "1px solid rgba(240,188,83,.12)" }}>
        <div
          className="h-px w-full"
          style={{ background: "linear-gradient(to left,transparent,rgba(240,188,83,.15) 20%,rgba(240,188,83,.35) 50%,rgba(240,188,83,.15) 80%,transparent)" }}
        />
        <div className="max-w-7xl mx-auto px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#F6F5F1] dark:bg-transparent">
          <p className="text-sm font-semibold text-[#5A4E2A] dark:text-white/25">
            
          أكاديمية كبار العلماء — منهج وفق كلية الشريعة في جامعة الإمام محمد بن سعود الإسلامية، بصوتيات مشايخ كبار العلماء الثقات.
          </p>
          <div className="flex items-center gap-5 shrink-0">
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
