"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { university, countLevelLessons } from "@/lib/data";
import type { Level } from "@/lib/data";

const DIG = ["١", "٢", "٣", "٤", "٥", "٦", "٧", "٨"];

const HADITHS = [
  {
    text: "«مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ»",
    source: "رواه مسلم",
  },
  {
    text: "«من يرد اللَّه به خيراً يفقهه في الدين»",
    source: "مُتَّفَقٌ عَلَيهِ",
  },
  {
    text: "« إنَّ اللهَ لا يقبضُ العلمَ انتزاعًا ينتزعُهُ منَ النَّاسِ ، ولَكن يقبضُ العلمَ بقبضِ العُلماءِ ، حتَّى إذا لم يترُك عالمًا اتَّخذَ النَّاسُ رؤوسًا جُهَّالًا ، فسُئلوا فأفتوا بغيرِ عِلمٍ فضلُّوا وأضلُّوا»",
    source: "صحيح الترمذي ",
  },
  {
    text: "«من خرج في طلب العلم فهو في سبيل اللَّه حتى يرجع»",
    source: "رَوَاهُ التِّرمِذِيُّ وَقَالَ حَدِيثٌ حَسَنٌ.",
  },
  {
    text: "«وقل رب زدني علماً»",
    source: "طه: 114",
  },
  {
    text: "«يرفع اللَّه الذين آمنوا منكم والذين أوتوا العلم درجات»",
    source: "المجادلة: 11",
  },
  {
    text: "«قل هل يستوي الذين يعلمون والذين لا يعلمون»",
    source: "الزمر: 9",
  },
];

const STAGE_BG = [
  "linear-gradient(to top,#082e27,#0d3a30)",
  "linear-gradient(to top,#0d3a30,#133e33)",
  "linear-gradient(to top,#133e33,#1a4a3c)",
  "linear-gradient(to top,#1a4a3c,#245a48)",
  "linear-gradient(to top,#245a48,#326b55)",
  "linear-gradient(to top,#326b55,#7A8B30)",
  "linear-gradient(to top,#7A8B30,#B8962A)",
  "linear-gradient(to top,#B8962A,#F0BC53)",
];

const SCHOLARS = [
  { name: "عبد العزيز بن باز",            url: "http://bit.ly/2ZK3dXN" },
  { name: "محمد بن صالح العثيمين",        url: "http://bit.ly/31SVgRQ" },
  { name: "محمد ناصر الدين الألباني",     url: "http://bit.ly/2JcfmxU" },
  { name: "صالح الفوزان",                 url: "http://bit.ly/2X22e3B" },
  { name: "عبد الرحمن السعدي",            url: "http://bit.ly/2X8Itfq" },
  { name: "عبد الله بن حميد",             url: "http://bit.ly/2ZSeoxL" },
  { name: "عبد الله الغديان",             url: "http://bit.ly/2XCES8K" },
  { name: "عبد المحسن العباد",            url: "http://bit.ly/2LhD7aD" },
  { name: "صالح محمد اللحيدان",           url: "http://bit.ly/2X725R1" },
  { name: "صالح آل الشيخ",               url: "http://bit.ly/2X5A90b" },
  { name: "عبد الكريم الخضير",            url: "http://bit.ly/30qyVJU" },
  { name: "عبد العزيز الراجحي",           url: "http://bit.ly/2T94RBN" },
  { name: "محمد أمين الشنقيطي",           url: "https://bit.ly/3vURMQc" },
  { name: "عبد العزيز آل الشيخ (المفتي)", url: "https://bit.ly/39dCcWG" },
];

function LevelDetail({ level, idx, onBack }: { level: Level; idx: number; onBack: () => void }) {
  return (
    <div style={{ animation: "ab-levelin .3s ease" }}>
      <div className="flex items-baseline gap-3 mb-5">
        <span
          className="text-[64px] text-gold/35 leading-none"
          style={{ fontFamily: "var(--font-amiri)" }}
        >
          {DIG[idx]}
        </span>
        <h3
          className="text-2xl text-cream font-bold"
          style={{ fontFamily: "var(--font-amiri)" }}
        >
          {level.title}
        </h3>
        <button
          onClick={onBack}
          className="mr-auto border border-gold/20 text-gold/50 hover:border-gold/50 hover:text-gold text-[11px] font-bold tracking-[.1em] px-3.5 py-1.5 transition-all duration-200 md:hidden"
          type="button"
        >
          ← رجوع
        </button>
      </div>

      <div
        className="grid grid-cols-2 gap-px mb-6"
        style={{ background: "rgba(240,188,83,.12)" }}
      >
        {level.subjects.map((subject, si) => {
          const lessonCount = subject.courses.reduce((s, c) => s + c.files.length, 0);
          return (
            <Link
              key={si}
              href={`/level/${idx}/${si}`}
              className="block bg-primary px-3.5 py-3 hover:bg-[#1e4840] hover:shadow-[inset_0_-2px_0_#F0BC53] transition-all duration-150"
            >
              <div className="text-[9px] text-gold/28 font-bold tracking-[.08em] mb-1">
                {String(si + 1).padStart(2, "0")}
              </div>
              <div
                className="text-[13px] text-cream/70 font-bold leading-snug mb-1"
                style={{ fontFamily: "var(--font-amiri)" }}
              >
                {subject.title}
              </div>
              <div className="text-[10px] text-cream/22">
                {subject.courses.length} مقرر · {lessonCount} درس
              </div>
            </Link>
          );
        })}
      </div>

      <Link
        href={`/level/${idx}`}
        className="inline-flex items-center gap-2 bg-gold text-primary px-8 py-3 text-xs font-bold tracking-[.08em] hover:bg-cream transition-all duration-200"
      >
        ابدأ المستوى {DIG[idx]}
        <span>←</span>
      </Link>
    </div>
  );
}

export default function AboutPage() {
  const [hadithIdx, setHadithIdx] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [muted, setMuted] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);

  // YouTube IFrame API
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).onYouTubeIframeAPIReady = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      playerRef.current = new (window as any).YT.Player("ab-hero-video", {
        events: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onReady: (e: any) => {
            e.target.unMute();
            e.target.setVolume(70);
          },
        },
      });
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    return () => { tag.remove(); };
  }, []);

  // Typing animation
  useEffect(() => {
    const chars = Array.from(HADITHS[hadithIdx].text);
    setDisplayedText("");
    setIsTyping(true);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayedText(chars.slice(0, i).join(""));
      if (i >= chars.length) { clearInterval(id); setIsTyping(false); }
    }, 36);
    return () => clearInterval(id);
  }, [hadithIdx]);

  // Auto-advance hadith
  useEffect(() => {
    const duration = Array.from(HADITHS[hadithIdx].text).length * 36 + 3500;
    const id = setTimeout(() => setHadithIdx(i => (i + 1) % HADITHS.length), duration);
    return () => clearTimeout(id);
  }, [hadithIdx]);

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (muted) { playerRef.current.unMute(); } else { playerRef.current.mute(); }
    setMuted(m => !m);
  };

  const toAr = (n: number) => n.toString().replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[+d]);
  const totalSubjects = university.reduce((s, l) => s + l.subjects.length, 0);
  const totalLessons = university.reduce((s, l) => s + countLevelLessons(l), 0);
  const h = HADITHS[hadithIdx];
  const sourceVisible = !isTyping && displayedText.length > 0;

  return (
    <>
      <style>{`
        @keyframes ab-blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes ab-glow   { 0%,100%{opacity:.5} 50%{opacity:.9} }
        @keyframes ab-levelin{ from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ab-fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .ab-cursor {
          display:inline-block;width:2px;height:.75em;
          background:#C9973A;vertical-align:text-bottom;margin-right:3px;
          animation:ab-blink .65s step-end infinite;
        }
        .ab-glow-ring {
          position:absolute;inset:0;pointer-events:none;z-index:2;
          background:radial-gradient(ellipse 70% 55% at 50% 62%,rgba(240,188,83,.07) 0%,transparent 68%);
          animation:ab-glow 5s ease-in-out infinite;
        }
        .ab-stage {
          flex:1;display:flex;flex-direction:column;justify-content:flex-end;
          padding:24px 20px;position:relative;overflow:hidden;
          text-decoration:none;border-right:1px solid rgba(240,188,83,.1);
          transition:flex .38s cubic-bezier(.4,0,.2,1),box-shadow .3s;cursor:pointer;
        }
        .ab-stage:first-child { border-right:none; }
        .ab-stage:hover { flex:2.2;box-shadow:inset 0 0 60px rgba(240,188,83,.13),0 0 0 1px rgba(240,188,83,.2); }
        .ab-stage-meta {
          font-size:9px;color:rgba(255,255,255,.32);letter-spacing:.1em;
          max-height:0;overflow:hidden;opacity:0;white-space:nowrap;
          transition:max-height .38s ease,opacity .3s ease;margin-top:0;
        }
        .ab-stage:hover .ab-stage-meta { max-height:18px;opacity:1;margin-top:7px; }
        .ab-lp-item {
          display:flex;align-items:center;gap:14px;padding:12px 0;
          border-bottom:1px solid rgba(240,188,83,.08);
          text-decoration:none;cursor:pointer;transition:padding-right .2s;
          background:none;border-top:none;border-left:none;border-right:none;
          width:100%;text-align:right;font-family:inherit;color:inherit;
        }
        .ab-lp-item:first-child { border-top:1px solid rgba(240,188,83,.08); }
        .ab-lp-item:hover,.ab-lp-item.active { padding-right:8px; }
        .ab-lp-item:hover .ab-lp-n,.ab-lp-item.active .ab-lp-n { color:#F0BC53;text-shadow:0 0 12px rgba(240,188,83,.4); }
        .ab-lp-item:hover .ab-lp-title,.ab-lp-item.active .ab-lp-title { color:rgba(246,245,241,.88); }
        .ab-lp-item:hover .ab-lp-count,.ab-lp-item.active .ab-lp-count { color:rgba(240,188,83,.4); }
        .ab-lp-item:hover .ab-lp-arrow,.ab-lp-item.active .ab-lp-arrow { color:#F0BC53;transform:translateX(-3px); }
        @media (max-width:768px) {
          .ab-stage { min-width:110px; flex:none !important; }
          .ab-stage:hover { flex:none !important;box-shadow:none; }
        }
      `}</style>

      <div className="bg-primary text-cream" style={{ fontFamily: "var(--font-cairo)", direction: "rtl" }}>

        {/* ── HERO ──────────────────────────────────────────────── */}
        <header className="grid md:grid-cols-2 min-h-[calc(100dvh-3rem)]">

          {/* Dark panel — right in RTL (first child) */}
          <div className="relative bg-[#082e27] flex flex-col items-center justify-between py-16 md:py-20 px-8 md:px-14 overflow-hidden text-center border-l border-gold/10 min-h-[220px] md:min-h-0">
            {/* Video background */}
            <div className="absolute inset-0 overflow-hidden">
              <iframe
                id="ab-hero-video"
                src="https://www.youtube.com/embed/FSxwG1aceuw?start=2869&autoplay=1&mute=1&loop=1&controls=0&playlist=FSxwG1aceuw&disablekb=1&modestbranding=1&enablejsapi=1"
                allow="autoplay; encrypted-media"
                title="خلفية"
                className="absolute border-0 pointer-events-none"
                style={{
                  top: "50%", left: "50%",
                  width: "178vh", height: "100vh", minWidth: "100%",
                  transform: "translate(-50%,-50%)",
                }}
              />
              <div className="absolute inset-0 bg-[rgba(8,46,39,0.72)]" />
            </div>

            {/* Diagonal grid overlay */}
            <div
              className="absolute inset-0 z-[2] pointer-events-none opacity-[.02]"
              style={{ background: "repeating-linear-gradient(-45deg,#F0BC53 0,#F0BC53 1px,transparent 1px,transparent 28px)" }}
            />
            <div className="ab-glow-ring" />

            {/* Content */}
            <div className="relative z-[3] flex flex-col items-center">
              <p className="text-[10px] text-gold/38 tracking-[.22em] font-bold mb-8 hidden md:flex items-center gap-3">
                <span className="flex-1 h-px bg-gold/16" />
                مشروع الدعوة الإلكترونية
                <span className="flex-1 h-px bg-gold/16" />
              </p>
              <Image
                src="/logo.png"
                alt="جامعة كبار العلماء"
                width={380}
                height={165}
                className="object-contain w-[180px] md:w-[360px] h-auto"
                priority
              />
            </div>

            {/* Video controls */}
            <div className="relative z-[4] flex justify-center">
              <div
                className="inline-flex items-center overflow-hidden backdrop-blur-sm"
                style={{ border: "1px solid rgba(240,188,83,.22)", background: "rgba(8,46,39,.75)" }}
              >
                <button
                  onClick={toggleMute}
                  type="button"
                  className="flex items-center gap-1.5 px-4 py-2.5 text-gold/70 hover:text-gold hover:bg-gold/[.12] text-xs font-bold tracking-[.06em] transition-all duration-200"
                  style={{ fontFamily: "var(--font-cairo)" }}
                >
                  {muted ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                      <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    </svg>
                  )}
                  {muted ? "تشغيل" : "كتم"}
                </button>
                <div className="w-px h-6" style={{ background: "rgba(240,188,83,.18)" }} />
                <a
                  href="https://www.youtube.com/watch?v=FSxwG1aceuw&t=2869s"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 text-gold/50 hover:text-gold hover:bg-gold/[.12] text-[11px] font-semibold tracking-[.08em] transition-all duration-200"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  مشاهدة الفلم كاملاً
                </a>
              </div>
            </div>
          </div>

          {/* Cream panel — left in RTL (second child) */}
          <div
            className="flex flex-col justify-between py-12 md:py-20 px-6 md:px-16"
            style={{ background: "#F6F5F1" }}
          >
            <div>
              <h1
                className="text-[52px] md:text-[82px] font-normal text-[#0F2822] leading-[1.1] mb-8 md:mb-9"
                style={{ fontFamily: "var(--font-aref-ruqaa)" }}
              >
                رحلة طلب العلم <br /> مع كبار العلماء
              </h1>

              {/* Typing hadith */}
              <div
                className="flex flex-col justify-center border-r-[3px] border-gold pr-6 mb-7 min-h-[72px] md:min-h-[110px]"
              >
                <p
                  className="text-lg md:text-2xl text-[#2A2014] leading-[1.95] mb-1.5 break-words text-right w-full"
                  style={{ fontFamily: "var(--font-amiri)" }}
                >
                  {displayedText}
                  {isTyping && <span className="ab-cursor" />}
                </p>
                <cite
                  className="not-italic text-md text-[#C9973A] tracking-[.12em] block text-right w-full transition-opacity duration-[400ms]"
                  style={{ opacity: sourceVisible ? 1 : 0 }}
                >
                  {h.source}
                </cite>
              </div>

              <p className="text-sm text-[#4A3E22] leading-[2] max-w-md mb-10">
                ثمانية مستويات دراسية مرتّبة — بصوتيات كبار العلماء وفق منهج كلية الشريعة.
                منصة شاملة لتلقي العلم الشرعي من الصفر حتى التمكن.
              </p>
            </div>

            <div className="flex gap-3 items-center">
              <Link
                href="/"
                className="bg-primary text-cream px-10 py-3.5 text-[13px] font-bold tracking-[.08em] hover:bg-gold hover:text-primary transition-all duration-200 shadow-[0_4px_18px_rgba(25,56,51,.18)]"
              >
                ابدأ التعلم
              </Link>
              <Link
                href="/scholars"
                className="text-[#3A3020] border border-[#C8C2B0] px-7 py-3.5 text-[13px] font-semibold hover:border-primary hover:text-primary transition-all duration-200"
              >
                المشايخ
              </Link>
            </div>
          </div>
        </header>

        {/* ── JOURNEY ──────────────────────────────────────────── */}
        <div
          className="flex h-72 overflow-x-auto md:overflow-x-hidden"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {university.map((level, idx) => (
            <Link
              key={idx}
              href={`/level/${idx}`}
              className="ab-stage"
              style={{ background: STAGE_BG[idx] }}
            >
              <span
                className="absolute top-5 left-4 text-base transition-all duration-200 text-white/15 group-hover:text-gold"
                style={{ fontSize: "16px", color: "rgba(255,255,255,.15)" }}
              >
                ↗
              </span>
              <span
                className="text-[52px] font-bold text-white/10 leading-none mb-2 transition-colors duration-200 block"
                style={{ fontFamily: "var(--font-amiri)" }}
              >
                {DIG[idx]}
              </span>
              <span
                className="text-[13px] font-bold text-white/35 transition-colors duration-200 block truncate"
                style={{ fontFamily: "var(--font-amiri)" }}
              >
                {level.title}
              </span>
              <div className="ab-stage-meta">
                {level.subjects.length} مادة · {countLevelLessons(level)} درس
              </div>
            </Link>
          ))}
        </div>

        {/* ── STATS ─────────────────────────────────────────────── */}
        <div
          className="border-y relative overflow-hidden"
          style={{ background: "#082e27", borderColor: "rgba(240,188,83,.08)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "repeating-linear-gradient(-60deg,transparent 0,transparent 40px,rgba(240,188,83,.018) 40px,rgba(240,188,83,.018) 41px)" }}
          />
          <div
            className="h-px border-none"
            style={{ background: "linear-gradient(to left,transparent,rgba(240,188,83,.35) 20%,#F0BC53 50%,rgba(240,188,83,.35) 80%,transparent)" }}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 relative z-[1]">
            {[
              { v: "٨",                 l: "مستوى دراسي",  d: "من المبتدئ إلى المتقدم" },
              { v: toAr(totalSubjects), l: "مادة علمية",   d: "عقيدة وفقه وحديث وتفسير وأصول ولغة" },
              { v: toAr(totalLessons),  l: "درس شرعي",     d: "تسجيلات أصيلة بجودة عالية" },
              { v: "١٨",               l: "شيخاً وعالماً", d: "من كبار العلماء الثقات المعتمدين" },
            ].map((s, i) => (
              <div
                key={i}
                className="py-12 px-6 text-center relative border-l border-gold/10 last:border-l-0"
              >
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-0.5 bg-gold opacity-50"
                />
                <div
                  className="text-[56px] font-bold text-gold leading-none mb-2.5"
                  style={{ fontFamily: "var(--font-amiri)" }}
                >
                  {s.v}
                </div>
                <div className="text-xs text-cream/55 tracking-[.14em] font-bold mb-2">{s.l}</div>
                <div className="text-[11px] text-cream/22 leading-[1.7] max-w-[140px] mx-auto hidden md:block">{s.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── LEVEL EXPLORER ────────────────────────────────────── */}
        <section className="bg-primary py-16 md:py-24 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 80% 60% at 20% 50%,rgba(240,188,83,.04) 0%,transparent 65%)" }}
          />
          <div className="max-w-[1200px] mx-auto px-6 md:px-12 relative z-[1]">
            <div className="grid md:grid-cols-2 gap-0 md:gap-20 items-start">

              {/* RIGHT column (first in DOM) — levels list */}
              <div className={selectedLevel !== null ? "hidden md:block" : "block"}>
                <p className="text-[10px] text-gold/40 tracking-[.22em] font-bold mb-3.5">المنهج الدراسي</p>
                <h2
                  className="text-[28px] md:text-[32px] font-bold text-cream mb-5 leading-[1.4]"
                  style={{ fontFamily: "var(--font-amiri)" }}
                >
                  منهج علمي موثّق ومنظّم
                </h2>
                <p className="text-[13.5px] text-cream/38 leading-[2.1] mb-6">
                  ثمانية مستويات دراسية متدرّجة — من مرحلة الأساس إلى مرحلة التمكن.
                  اخترنا لكل مادة أفضل من تكلّم فيها من كبار العلماء.
                </p>
                {/* <ul className="flex flex-col gap-3 mb-8 list-none p-0">
                  {["منهج كلية الشريعة في جامعة الإمام محمد بن سعود الإسلامية",
                    "صوتيات مشايخ كبار العلماء المعتمدين",
                    "من الآجرومية إلى الألفية — مبتدئ أو متقدم"].map((item, i) => (
                    <li key={i} className="flex gap-3 text-[13.5px] text-cream/40 leading-[1.85]">
                      <span className="text-gold shrink-0">—</span>
                      {item}
                    </li>
                  ))}
                </ul> */}

                {/* Level list */}
                <div className="flex flex-col">
                  {university.map((level, idx) => {
                    const lessonCount = countLevelLessons(level);
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedLevel(idx)}
                        className={`ab-lp-item${selectedLevel === idx ? " active" : ""}`}
                        type="button"
                      >
                        <span
                          className="ab-lp-n text-xl font-bold text-gold/22 w-7 shrink-0 text-center transition-all duration-200"
                          style={{ fontFamily: "var(--font-amiri)" }}
                        >
                          {DIG[idx]}
                        </span>
                        <span
                          className="ab-lp-title flex-1 text-[14px] font-bold text-cream/38 text-right transition-colors duration-200"
                          style={{ fontFamily: "var(--font-amiri)" }}
                        >
                          {level.title}
                        </span>
                        <span className="ab-lp-count text-[11px] text-cream/18 transition-colors duration-200">
                          {lessonCount} درس
                        </span>
                        <span className="ab-lp-arrow text-xs text-gold/0 transition-all duration-200">←</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LEFT column (second in DOM) — detail panel */}
              <div
                className={`${selectedLevel === null ? "hidden md:block" : "block"} md:border-l md:border-gold/[.12] md:pl-12`}
              >
                {selectedLevel !== null ? (
                  <LevelDetail
                    level={university[selectedLevel]}
                    idx={selectedLevel}
                    onBack={() => setSelectedLevel(null)}
                  />
                ) : (
                  <div style={{ animation: "ab-fadein .3s ease" }}>
                    <p className="text-[10px] text-gold/40 tracking-[.22em] font-bold mb-4">نظرة عامة</p>
                    <div className="grid grid-cols-2 gap-px" style={{ background: "rgba(240,188,83,.06)" }}>
                      {[
                        { v: "٨",                 l: "مستويات" },
                        { v: toAr(totalSubjects), l: "مادة" },
                        { v: toAr(totalLessons),  l: "درس" },
                        { v: "مجاني",               l: "بالكامل" },
                      ].map((s, i) => (
                        <div key={i} className="bg-primary/60 px-5 py-6 text-center">
                          <div
                            className="text-[30px] font-bold text-primary-dark leading-none mb-1"
                            style={{ fontFamily: "var(--font-amiri)", color: "#F6F5F1" }}
                          >
                            {s.v}
                          </div>
                          <div className="text-[11px] text-cream/40 tracking-[.1em] font-semibold mt-1">{s.l}</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-cream/25 mt-6 leading-relaxed">
                      اختر مستوىً من القائمة لتصفّح موادّه ومقرّراته
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* ── BAND 2 — pull quote + scholars intro ──────────────── */}
        <section style={{ background: "#F6F5F1", borderTop: "1px solid #DEDAD0" }} className="py-16 md:py-24 px-6 md:px-12">
          <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-16 md:gap-20 items-start">

            {/* LEFT col — pull quote + body */}
            <div>

              {/* Pull quote */}
              <div
                className="relative py-9 px-8 mb-8"
                style={{ border: "1px solid #DEDAD0", background: "#EEEAE0" }}
              >
                <span
                  className="absolute -top-5 right-6 text-[96px] text-gold/60 leading-none"
                  style={{ fontFamily: "var(--font-amiri)" }}
>&ldquo;</span>
                <p
                  className="text-[17px] text-[#0F2822] leading-[1.9] mb-3"
                  style={{ fontFamily: "var(--font-amiri)" }}
                >
                  «إِنَّ الْعُلَمَاءَ وَرَثَةُ الْأَنْبِيَاءِ — إِنَّ الْأَنْبِيَاءَ لَمْ يُوَرِّثُوا دِينَارًا
                  وَلَا دِرْهَمًا، وَإِنَّمَا وَرَّثُوا الْعِلْمَ — فَمَنْ أَخَذَهُ أَخَذَ بِحَظٍّ وَافِرٍ»
                </p>
                <cite className="not-italic text-[11px] text-[#C9973A] tracking-[.1em] font-bold">
                  رواه أبو داود والترمذي
                </cite>
              </div>

              <p className="text-[13.5px] text-[#5A4E2A] leading-[2.1]">
                تأسّس هذا المشروع على يقين راسخ بأن العلم الشرعي حق لكل مسلم، وأن أشرف طريق
                لتلقيه هو ما سلكه السلف: الأخذ عن العلماء الثقات المتصلين بالكتاب والسنة.
                ما تجده هنا ليس محتوى رقمياً فحسب — بل إرث علمي موثّق، أُتيح لكل طالب علم.
              </p>
            </div>

            {/* RIGHT col — scholars heading + bullet list + highlights grid */}
            <div>
              <p className="text-[10px] text-[#C9973A] tracking-[.22em] font-bold mb-3">العلماء والدروس</p>
              <h2
                className="text-[26px] md:text-[30px] font-bold text-[#0F2822] mb-6 leading-[1.4]"
                style={{ fontFamily: "var(--font-amiri)" }}
              >
                نخبة من كبار العلماء الثقات
              </h2>

              <ul className="flex flex-col gap-3 mb-8 list-none p-0">
                {[
                  "يجمع دروس ابن باز وابن عثيمين والألباني والفوزان وعشرين غيرهم",
                  "أكثر من مليار مشاهدة لهذه الدروس عبر المنصات الرقمية",
     
                  "دروس ومحاضرات وشروح متون — تنوع في الأسلوب ووحدة في المنهج",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-[13.5px] text-[#5A4E2A] leading-[1.85]">
                    <span className="text-[#C9973A] shrink-0">—</span>
                    {item}
                  </li>
                ))}
              </ul>

              {/* 2×2 highlights grid */}
              {/* <div
                className="grid grid-cols-2 gap-px"
                style={{ background: "#DEDAD0", border: "1px solid #DEDAD0" }}
              >
                {[
                  { v: "١٨",  l: "شيخاً معتمداً" },
                  { v: "+١٠٠٠", l: "ساعة تسجيل" },
                  { v: "١٤٣٥", l: "سنة التأسيس هـ" },
                  { v: "مجاني", l: "بالكامل" },
                ].map((h, i) => (
                  <div key={i} className="bg-[#F6F5F1] hover:bg-[#EEF5F3] transition-colors duration-200 px-5 py-5">
                    <div
                      className="text-[30px] font-bold text-primary leading-none"
                      style={{ fontFamily: "var(--font-amiri)" }}
                    >
                      {h.v}
                    </div>
                    <div className="text-[11px] text-[#8A7A5A] tracking-[.1em] font-semibold mt-1">{h.l}</div>
                  </div>
                ))}
              </div> */}
            </div>
          </div>
        </section>

        {/* ── SCHOLARS GRID ──────────────────────────────────── */}
        <section style={{ background: "#F6F5F1", borderTop: "1px solid #DEDAD0" }} className="py-16 md:py-20 px-6 md:px-12">
          <div className="max-w-[1160px] mx-auto">
            <h2
              className="text-[28px] md:text-[32px] font-bold text-[#0F2822] mb-10 leading-[1.4]"
              style={{ fontFamily: "var(--font-amiri)" }}
            >
              كبار العلماء
            </h2>

            <div
              className="grid grid-cols-1 sm:grid-cols-2"
              style={{ borderTop: "1px solid #DEDAD0", borderRight: "1px solid #DEDAD0" }}
            >
              {SCHOLARS.map((scholar, i) => (
                <a
                  key={scholar.name}
                  href={scholar.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3.5 px-6 py-[18px] transition-all duration-200 hover:bg-[#EEF5F3] hover:shadow-[inset_3px_0_0_#F0BC53]"
                  style={{
                    borderLeft: "1px solid #DEDAD0",
                    borderBottom: "1px solid #DEDAD0",
                    textDecoration: "none",
                    color: "#0F2822",
                  }}
                >
                  <span className="text-[11px] text-[#C9973A] font-extrabold shrink-0 min-w-[24px]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="text-base font-bold"
                    style={{ fontFamily: "var(--font-amiri)" }}
                  >
                    الشيخ {scholar.name}
                  </span>
                  <svg className="w-3 h-3 text-[#C9973A]/50 shrink-0 mr-auto opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 20 14" fill="currentColor">
                    <path d="M19.6 2.2C19.4 1.4 18.8.8 18 .6 16.4.2 10 .2 10 .2S3.6.2 2 .6C1.2.8.6 1.4.4 2.2 0 3.8 0 7 0 7s0 3.2.4 4.8c.2.8.8 1.4 1.6 1.6C3.6 13.8 10 13.8 10 13.8s6.4 0 8-.4c.8-.2 1.4-.8 1.6-1.6.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM8 10V4l5.3 3L8 10z" />
                  </svg>
                </a>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/scholars"
                className="inline-flex items-center gap-2 border border-[#C8C2B0] text-[#3A3020] px-8 py-3 text-sm font-semibold hover:border-primary hover:text-primary transition-all duration-200"
              >
                صفحات المشايخ
                <span>←</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────── */}
        <footer
          className="grid md:grid-cols-2"
          style={{ background: "#082e27", borderTop: "1px solid rgba(240,188,83,.08)" }}
        >
          <div className="px-10 py-7 text-[12px] text-cream/20 flex items-center">
            مرجعية موثوقة في تلقي العلم الشرعي — منهج وفق كلية الشريعة بصوتيات مشايخ كبار العلماء الثقات.
          </div>
          <div
            className="px-10 py-7 flex items-center justify-start md:justify-end gap-5"
            style={{ background: "#F6F5F1" }}
          >
            <a
              href="https://www.kibbarulmauni.com"
              target="_blank" rel="noopener noreferrer"
              className="text-[#5A4E2A] text-[12px] font-semibold hover:text-primary transition-colors"
            >
              الموقع الرسمي
            </a>
            <a
              href="https://www.youtube.com/@kibbarulmauni"
              target="_blank" rel="noopener noreferrer"
              className="text-[#5A4E2A] text-[12px] font-semibold hover:text-red-600 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 14" fill="currentColor">
                <path d="M19.6 2.2C19.4 1.4 18.8.8 18 .6 16.4.2 10 .2 10 .2S3.6.2 2 .6C1.2.8.6 1.4.4 2.2 0 3.8 0 7 0 7s0 3.2.4 4.8c.2.8.8 1.4 1.6 1.6C3.6 13.8 10 13.8 10 13.8s6.4 0 8-.4c.8-.2 1.4-.8 1.6-1.6.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM8 10V4l5.3 3L8 10z" />
              </svg>
              قناة يوتيوب
            </a>
          </div>
        </footer>

      </div>
    </>
  );
}
