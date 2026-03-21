import { university, countLevelLessons } from "@/lib/data";
import { HomeLevelsGrid } from "@/components/HomeLevelsGrid";
import Image from "next/image";

function subjectWord(n: number) {
  if (n === 2) return "مادتان";
  if (n >= 3 && n <= 10) return "مواد";
  return "مادة";
}

function lessonWord(n: number) {
  if (n === 2) return "درسان";
  if (n >= 3 && n <= 10) return "دروس";
  return "درس";
}

export const metadata = { title: "عن جامعة كبار العلماء" };

export default function AboutPage() {
  const totalSubjects = university.reduce((s, l) => s + l.subjects.length, 0);
  const totalLessons  = university.reduce((s, l) => s + countLevelLessons(l), 0);

  const statsItems = [
    { value: "٨",           label: "مستويات" },
    { value: totalLessons,  label: "درس"     },
    { value: totalSubjects, label: "مادة"    },
    { value: "٢٠+",         label: "شيخ"    },
  ];

  return (
    <div className="min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <header className="relative min-h-[80vh] flex items-center justify-center bg-primary-dark overflow-hidden text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mosque-art-1.jfif"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-25 select-none pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-primary/70 to-primary/95" />

        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          {/* <p className="text-gold/70 text-xs tracking-[0.25em] mb-8 font-medium uppercase">
            مشروع الدعوة الإلكترونية
          </p> */}

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



          <p className="text-[#F6F5F1]/55 text-base max-w-lg mx-auto leading-relaxed mb-10">
          نحن مشروع كبار العلماء للتسهيل على طلبة العلم قمنا بعمل منهج وفقا لكلية الشريعة في جامعة محمد بن سعود الإسلامية وتم اختيار الصوتيات لمشايخ كبار العلماء وعلى منهج الجامعة.

          </p>

<div className="flex flex-col items-center gap-8">
     <div className="inline-flex items-center bg-white/[0.06] rounded-2xl overflow-hidden ring-1 ring-white/10">
            {[
              { value: "٨",          label: "مستويات" },
              { value: totalSubjects, label: subjectWord(totalSubjects) },
              { value: totalLessons,  label: lessonWord(totalLessons)   },
            ].map((s, i) => (
              <div key={i} className="px-7 py-4 text-center first:border-l border-white/10">
                <div className="text-2xl font-bold tabular-nums">{s.value}</div>
                <div className="text-gold/70 text-[11px] mt-0.5 font-medium">{s.label}</div>
              </div>
            ))}
          </div>

          <a
            href="/"
            className="inline-block border border-gold text-gold px-8 py-3 rounded-full text-sm font-medium hover:bg-gold hover:text-primary transition-all duration-300"
          >
            ابدأ التعلم
          </a>

          {/* Minimal stats strip */}
     
          </div>
        </div>
      </header>

      {/* ── FEATURE ROW 1 — light ────────────────────────────── */}
      <section className="bg-[#F6F5F1] py-24">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
          <div className="rounded-2xl overflow-hidden shadow-xl order-2 md:order-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mosque-art-2.jfif" alt="فن إسلامي" className="w-full h-80 object-cover" />
          </div>
          <div className="order-1 md:order-2">
            <p className="text-gold text-xs tracking-[0.2em] mb-3 font-medium">المحتوى الدراسي</p>
            <h2
              className="text-3xl md:text-4xl font-bold text-primary mb-6 leading-snug"
              style={{ fontFamily: "var(--font-amiri)" }}
            >
              منهج علمي موثّق ومنظّم
            </h2>
            <ul className="space-y-4 text-primary/70 text-sm leading-relaxed">
              <li className="flex gap-3 items-start">
                <span className="text-gold mt-0.5 shrink-0">✦</span>
                ثمانية مستويات دراسية متدرّجة وفق كلية الشريعة في جامعة محمد بن سعود الإسلامية
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-gold mt-0.5 shrink-0">✦</span>
                مواد شاملة: العقيدة، الفقه، الحديث، التفسير، أصول الفقه، واللغة العربية
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-gold mt-0.5 shrink-0">✦</span>
                يناسب المبتدئ وطالب العلم المتقدم — من الآجرومية إلى الألفية
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── FEATURE ROW 2 — dark ────────────────────────────── */}
      <section className="relative bg-primary-dark/50 py-24 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* <img src="téléchargement (8).jfif" alt="" aria-hidden className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none" /> */}
              <div className="absolute inset-0 bg-center " style={{ backgroundImage: "url('/téléchargement (8).jfif')" }} />

        <div className="absolute inset-0 bg-primary/75" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-gold/70 text-xs tracking-[0.2em] mb-3 font-medium">العلماء</p>
            <h2
              className="text-3xl md:text-4xl font-bold text-white mb-6 leading-snug"
              style={{ fontFamily: "var(--font-amiri)" }}
            >
              نخبة من كبار العلماء
            </h2>
            <ul className="space-y-4 text-[#CAC9C3] text-sm leading-relaxed">
              <li className="flex gap-3 items-start">
                <span className="text-gold mt-0.5 shrink-0">✦</span>
                يجمع فتاوى ودروس كبار العلماء الثقات — ابن باز، ابن عثيمين، الفوزان وغيرهم
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-gold mt-0.5 shrink-0">✦</span>
                أكثر من مليار مشاهدة لأكثر من عشرين شيخاً عبر المنصات الرقمية
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-gold mt-0.5 shrink-0">✦</span>
                علم يصحّح السلوك ويبني على الكتاب والسنة — نظري وتطبيقي
              </li>
            </ul>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gold/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/téléchargement (5).jfif" alt="مكتبة" className="w-full h-100 object-cover" />
          </div>
        </div>
      </section>

      {/* ── LEVELS GRID ──────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-px flex-1 bg-[#CAC9C3]/40" />
            <span className="text-xs font-semibold text-[#CAC9C3] tracking-widest">المستويات الدراسية</span>
            <div className="h-px flex-1 bg-[#CAC9C3]/40" />
          </div>
          <HomeLevelsGrid levels={university} />
        </div>
      </section>

      {/* ── DOCUMENTARY ──────────────────────────────────────── */}
      <section className="relative bg-primary py-24 px-6 border-t border-gold/10 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
                     <div className="absolute inset-0 bg-center " style={{ backgroundImage: "url('/téléchargement (9).jfif')" }} />

        <div className="absolute inset-0 bg-primary/80" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-gold/70 text-xs tracking-[0.2em] mb-3 font-medium uppercase">توثيق المشروع</p>
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-amiri)" }}
          >
            الفلم الوثائقي لمشروع الدعوة الإلكترونية
          </h2>
          <p className="text-[#CAC9C3] text-sm mb-10 max-w-md mx-auto leading-relaxed">
            أكثر من مليار مشاهدة لأكثر من ٢٠ شيخاً من كبار العلماء —
            يتحدث الفلم عن الجامعة من الدقيقة ٤٨ إلى ٥٢
          </p>
          <div className="p-px rounded-2xl bg-gradient-to-b from-gold/30 to-transparent shadow-2xl">
            <div className="rounded-2xl overflow-hidden bg-black">
              <iframe
                src="https://www.youtube.com/embed/FSxwG1aceuw?start=2869"
                className="w-full aspect-video"
                allowFullScreen
                title="الفلم الوثائقي لمشروع الدعوة الإلكترونية"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── SCHOLARS ─────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4">
          <h2
            className="text-3xl md:text-4xl font-bold text-primary mb-12 text-center leading-snug"
            style={{ fontFamily: "var(--font-amiri)" }}
          >
كبار العلماء          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: "عبد العزيز بن باز",              url: "http://bit.ly/2ZK3dXN" },
              { name: "محمد بن صالح العثيمين",          url: "http://bit.ly/31SVgRQ" },
              { name: "محمد ناصر الدين الألباني",       url: "http://bit.ly/2JcfmxU" },
              { name: "صالح الفوزان",                   url: "http://bit.ly/2X22e3B" },
              { name: "عبد الرحمن السعدي",              url: "http://bit.ly/2X8Itfq" },
              { name: "عبد الله بن حميد",               url: "http://bit.ly/2ZSeoxL" },
              { name: "عبد الله الغديان",               url: "http://bit.ly/2XCES8K" },
              { name: "عبد المحسن العباد",              url: "http://bit.ly/2LhD7aD" },
              { name: "صالح محمد اللحيدان",             url: "http://bit.ly/2X725R1" },
              { name: "صالح آل الشيخ",                  url: "http://bit.ly/2X5A90b" },
              { name: "عبد الكريم الخضير",              url: "http://bit.ly/30qyVJU" },
              { name: "عبد العزيز الراجحي",             url: "http://bit.ly/2T94RBN" },
              { name: "محمد أمين الشنقيطي",             url: "https://bit.ly/3vURMQc" },
              { name: "عبد العزيز آل الشيخ (المفتي)",   url: "https://bit.ly/39dCcWG" },
            ].map(({ name, url }) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-2xl border border-[#CAC9C3]/30 p-4 flex items-center gap-3 hover:border-gold/50 hover:shadow-sm transition-all duration-200"
              >
                <span className="shrink-0 text-gold text-sm leading-none">✦</span>
                <p
                  className="flex-1 text-lg font-semibold text-primary leading-snug truncate"
                  style={{ fontFamily: "var(--font-amiri)" }}
                >
                  الشيخ {name}
                </p>
                <svg className="w-3 h-3 shrink-0 text-[#CAC9C3] group-hover:text-gold transition-colors" viewBox="0 0 20 14" fill="currentColor">
                  <path d="M19.6 2.2C19.4 1.4 18.8.8 18 .6 16.4.2 10 .2 10 .2S3.6.2 2 .6C1.2.8.6 1.4.4 2.2 0 3.8 0 7 0 7s0 3.2.4 4.8c.2.8.8 1.4 1.6 1.6C3.6 13.8 10 13.8 10 13.8s6.4 0 8-.4c.8-.2 1.4-.8 1.6-1.6.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM8 10V4l5.3 3L8 10z" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-[#CAC9C3]/20 py-8 text-center text-xs text-[#CAC9C3]/70 flex flex-col items-center gap-2">
        <span>
مرجعية موثوقة في تلقي العلم الشرعي — منهج وفق كلية الشريعة بصوتيات مشايخ كبار العلماء الثقات.
          </span>

        <div className="flex items-center gap-4">
          <a href="https://www.kibbarulmauni.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">
            الموقع الرسمي
          </a>
          <span className="text-[#CAC9C3]/30">·</span>
          <a href="https://www.youtube.com/@kibbarulmauni" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors flex items-center gap-1">
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
