"use client";

import { university, countLevelLessons } from "@/lib/data";
import type { Level } from "@/lib/data";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const SCHOLARS = [
  "عبد العزيز بن باز", "محمد بن صالح العثيمين", "محمد ناصر الدين الألباني",
  "صالح الفوزان", "عبد الرحمن السعدي", "عبد الله بن حميد",
  "عبد الله الغديان", "عبد المحسن العباد", "صالح محمد اللحيدان",
  "صالح آل الشيخ", "عبد الكريم الخضير", "عبد العزيز الراجحي",
  "محمد أمين الشنقيطي", "عبد العزيز آل الشيخ (المفتي)",
];

const DIG = ["١","٢","٣","٤","٥","٦","٧","٨"];

const HADITHS = [
  {
    text: "«مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ»",
    source: "رواه مسلم",
  },
  {
    text: "«طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ»",
    source: "رواه ابن ماجه",
  },
  {
    text: "«إِنَّ الْعُلَمَاءَ وَرَثَةُ الْأَنْبِيَاءِ — وَإِنَّمَا وَرَّثُوا الْعِلْمَ — فَمَنْ أَخَذَهُ أَخَذَ بِحَظٍّ وَافِرٍ»",
    source: "رواه أبو داود والترمذي",
  },
  {
    text: "«خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»",
    source: "رواه البخاري",
  },
];

const CSS = `
  @keyframes sf-glow   { 0%,100%{opacity:.5} 50%{opacity:.9} }
  @keyframes sf-fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sf-levelin { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }

  .sf-root {
    position:fixed;inset:0;z-index:9999;overflow-y:auto;
    background:#193833;color:#F6F5F1;
    font-family:var(--font-cairo);direction:rtl;
  }

  /* ─── Nav ─────── */
  .sf-nav { position:sticky;top:0;z-index:100;display:grid;grid-template-columns:1fr 1fr; }
  .sf-nav-dark {
    background:#193833;border-bottom:1px solid rgba(240,188,83,.12);
    padding:14px 40px;display:flex;align-items:center;
  }
  .sf-nav-light {
    background:#F6F5F1;border-bottom:1px solid #DEDAD0;
    padding:14px 40px;display:flex;align-items:center;justify-content:flex-end;gap:28px;
  }
  .sf-brand { font-family:var(--font-amiri);font-size:18px;color:#F0BC53;font-weight:700; }
  .sf-nav-a { color:#4A3E22;text-decoration:none;font-size:13px;font-weight:600;transition:color .2s; }
  .sf-nav-a:hover { color:#193833; }
  .sf-nav-cta {
    background:#193833;color:#F6F5F1;padding:9px 20px;text-decoration:none;
    font-size:12px;font-weight:700;letter-spacing:.08em;transition:all .25s;
  }
  .sf-nav-cta:hover { background:#F0BC53;color:#193833; }

  /* ─── Hero ─────── */
  .sf-hero { display:grid;grid-template-columns:1fr 1fr;min-height:100dvh; }

  .sf-hero-dark {
    background:#082e27;display:flex;flex-direction:column;align-items:center;
    justify-content:center;padding:80px 56px;
    border-left:1px solid rgba(240,188,83,.1);
    position:relative;overflow:hidden;text-align:center;
  }
  .sf-vbg { position:absolute;inset:0;overflow:hidden; }
  .sf-vbg iframe {
    position:absolute;top:50%;left:50%;
    width:178vh;height:100vh;min-width:100%;
    transform:translate(-50%,-50%);
    border:0;pointer-events:none;
  }
  .sf-vbg-overlay { position:absolute;inset:0;background:rgba(8,46,39,.72); }
  .sf-hero-dark::before {
    content:'';position:absolute;inset:0;z-index:2;pointer-events:none;opacity:.02;
    background:repeating-linear-gradient(-45deg,#F0BC53 0,#F0BC53 1px,transparent 1px,transparent 28px);
  }
  .sf-hero-dark::after {
    content:'';position:absolute;inset:0;z-index:2;pointer-events:none;
    background:radial-gradient(ellipse 70% 55% at 50% 62%,rgba(240,188,83,.07) 0%,transparent 68%);
    animation:sf-glow 5s ease-in-out infinite;
  }
  .sf-hero-dark-content { position:relative;z-index:3;display:flex;flex-direction:column;align-items:center; }
  .sf-hero-dark-top {
    font-size:10px;color:rgba(240,188,83,.38);letter-spacing:.22em;font-weight:700;
    margin-bottom:32px;display:flex;align-items:center;gap:12px;
  }
  .sf-hero-dark-top::before,.sf-hero-dark-top::after { content:'';flex:1;height:1px;background:rgba(240,188,83,.16); }
  .sf-logo { width:300px;height:auto; }
  .sf-hero-dark-bottom { margin-top:40px;font-size:10px;color:rgba(240,188,83,.2);letter-spacing:.22em; }

  /* Video controls */
  .sf-vc { position:absolute;bottom:28px;left:0;right:0;z-index:4;display:flex;justify-content:center; }
  .sf-vc-inner {
    display:inline-flex;align-items:center;
    border:1px solid rgba(240,188,83,.22);background:rgba(8,46,39,.75);
    backdrop-filter:blur(8px);overflow:hidden;
  }
  .sf-vc-btn {
    background:none;border:none;cursor:pointer;
    padding:9px 16px;color:rgba(240,188,83,.7);
    font-size:12px;font-weight:700;letter-spacing:.06em;
    transition:background .2s,color .2s;display:flex;align-items:center;gap:6px;
    font-family:var(--font-cairo);
  }
  .sf-vc-btn:hover { background:rgba(240,188,83,.12);color:#F0BC53; }
  .sf-vc-sep { width:1px;height:28px;background:rgba(240,188,83,.18);flex-shrink:0; }
  .sf-vc-link {
    display:flex;align-items:center;gap:6px;padding:9px 16px;
    color:rgba(240,188,83,.5);text-decoration:none;
    font-size:11px;font-weight:600;letter-spacing:.08em;
    transition:background .2s,color .2s;
  }
  .sf-vc-link:hover { background:rgba(240,188,83,.12);color:#F0BC53; }

  /* Hero right */
  .sf-hero-light {
    background:#F6F5F1;display:flex;flex-direction:column;
    justify-content:center;padding:80px 64px;
  }
  .sf-hero-title {
    font-family:var(--font-aref-ruqaa);font-size:82px;font-weight:400;
    color:#0F2822;line-height:1.1;margin-bottom:36px;
  }
  @keyframes sf-blink { 0%,100%{opacity:1} 50%{opacity:0} }
  /* Animated hadith */
  .sf-hadith {
    display:flex;flex-direction:column;justify-content:center;
    border-right:3px solid #F0BC53;
    padding-right:24px;margin-bottom:28px;min-height:110px;
  }
  .sf-hadith p {
    font-family:var(--font-amiri);font-size:20px;color:#2A2014;
    line-height:1.95;margin-bottom:6px;word-break:break-word;
    text-align:right;width:100%;
  }
  .sf-hadith cite { font-style:normal;font-size:11px;color:#C9973A;letter-spacing:.12em;display:block;transition:opacity .4s ease;text-align:right;width:100%; }
  .sf-cursor {
    display:inline-block;width:2px;height:.75em;
    background:#C9973A;vertical-align:text-bottom;margin-right:3px;
    animation:sf-blink .65s step-end infinite;
  }
  /* Hadith dots */
  .sf-hdots { display:flex;gap:5px;margin-bottom:24px; }
  .sf-hdot { width:5px;height:5px;border-radius:50%;background:rgba(201,151,58,.25);transition:background .3s; }
  .sf-hdot.active { background:#C9973A; }

  .sf-hero-desc { font-size:14px;color:#4A3E22;line-height:2;max-width:420px;margin-bottom:40px; }
  .sf-actions { display:flex;gap:12px;align-items:center; }
  .sf-btn {
    background:#193833;color:#F6F5F1;padding:14px 40px;text-decoration:none;display:inline-block;
    font-size:13px;font-weight:700;letter-spacing:.08em;transition:all .25s;
    box-shadow:0 4px 18px rgba(25,56,51,.18);
  }
  .sf-btn:hover { background:#F0BC53;color:#193833;box-shadow:0 4px 24px rgba(240,188,83,.35); }
  .sf-btn-ghost {
    color:#3A3020;border:1px solid #C8C2B0;padding:14px 28px;text-decoration:none;
    font-size:13px;font-weight:600;transition:all .25s;
  }
  .sf-btn-ghost:hover { border-color:#193833;color:#193833; }

  /* ─── Journey ─────── */
  .sf-journey { display:flex;height:280px; }
  .sf-stage {
    flex:1;display:flex;flex-direction:column;justify-content:flex-end;
    padding:24px 20px;position:relative;overflow:hidden;
    text-decoration:none;border-left:1px solid rgba(240,188,83,.1);
    transition:flex .38s cubic-bezier(.4,0,.2,1),box-shadow .3s;cursor:pointer;
  }
  .sf-stage:last-child { border-left:none; }
  .sf-stage:nth-child(1) { background:linear-gradient(to top,#082e27,#0d3a30); }
  .sf-stage:nth-child(2) { background:linear-gradient(to top,#0d3a30,#133e33); }
  .sf-stage:nth-child(3) { background:linear-gradient(to top,#133e33,#1a4a3c); }
  .sf-stage:nth-child(4) { background:linear-gradient(to top,#1a4a3c,#245a48); }
  .sf-stage:nth-child(5) { background:linear-gradient(to top,#245a48,#326b55); }
  .sf-stage:nth-child(6) { background:linear-gradient(to top,#326b55,#7A8B30); }
  .sf-stage:nth-child(7) { background:linear-gradient(to top,#7A8B30,#B8962A); }
  .sf-stage:nth-child(8) { background:linear-gradient(to top,#B8962A,#F0BC53); }
  .sf-stage:hover { flex:2.2;box-shadow:inset 0 0 60px rgba(240,188,83,.13),0 0 0 1px rgba(240,188,83,.2); }
  .sf-stage-num {
    font-family:var(--font-amiri);font-size:52px;font-weight:700;
    color:rgba(255,255,255,.1);line-height:1;margin-bottom:8px;
    transition:color .25s,text-shadow .25s;
  }
  .sf-stage:hover .sf-stage-num { color:rgba(255,255,255,.65);text-shadow:0 0 24px rgba(240,188,83,.5); }
  .sf-stage-name {
    font-family:var(--font-amiri);font-size:13px;color:rgba(255,255,255,.35);font-weight:700;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .25s;
  }
  .sf-stage:hover .sf-stage-name { color:rgba(255,255,255,.9); }
  .sf-stage-arrow {
    position:absolute;top:20px;left:16px;font-size:16px;
    color:rgba(255,255,255,.15);transition:color .25s,transform .25s,text-shadow .25s;
  }
  .sf-stage:hover .sf-stage-arrow { color:#F0BC53;transform:rotate(-45deg);text-shadow:0 0 10px rgba(240,188,83,.6); }
  /* Subtle stats line on hover */
  .sf-stage-meta {
    font-size:9px;color:rgba(255,255,255,.32);letter-spacing:.1em;
    max-height:0;overflow:hidden;opacity:0;white-space:nowrap;
    transition:max-height .38s ease,opacity .3s ease;margin-top:0;
  }
  .sf-stage:hover .sf-stage-meta { max-height:18px;opacity:1;margin-top:7px; }

  /* ─── Stats ─────── */
  .sf-stats-wrap {
    background:#082e27;border-top:1px solid rgba(240,188,83,.08);border-bottom:1px solid rgba(240,188,83,.08);
    position:relative;overflow:hidden;
  }
  .sf-stats-wrap::before {
    content:'';position:absolute;inset:0;pointer-events:none;
    background:repeating-linear-gradient(-60deg,transparent 0,transparent 40px,rgba(240,188,83,.018) 40px,rgba(240,188,83,.018) 41px);
  }
  .sf-stats-rule {
    height:1px;border:none;margin:0;
    background:linear-gradient(to left,transparent,rgba(240,188,83,.35) 20%,#F0BC53 50%,rgba(240,188,83,.35) 80%,transparent);
  }
  .sf-stats { display:grid;grid-template-columns:repeat(4,1fr);position:relative;z-index:1; }
  .sf-stat { padding:48px 24px 44px;text-align:center;border-left:1px solid rgba(240,188,83,.1);position:relative; }
  .sf-stat:last-child { border-left:none; }
  .sf-stat::before {
    content:'';position:absolute;top:0;left:50%;
    width:28px;height:2px;background:#F0BC53;opacity:.5;transform:translateX(-50%);
  }
  .sf-stat-v { font-family:var(--font-amiri);font-size:56px;font-weight:700;color:#F0BC53;line-height:1;margin-bottom:10px;text-shadow:0 0 32px rgba(240,188,83,.2); }
  .sf-stat-l { font-size:12px;color:rgba(246,245,241,.55);letter-spacing:.14em;font-weight:700;margin-bottom:8px; }
  .sf-stat-desc { font-size:11px;color:rgba(246,245,241,.22);line-height:1.7;max-width:140px;margin:0 auto; }

  /* ─── Band 1 (dark) ─────── */
  .sf-band1 { background:#193833;padding:96px 0;position:relative;overflow:hidden; }
  .sf-band1::before {
    content:'';position:absolute;inset:0;pointer-events:none;
    background:radial-gradient(ellipse 80% 60% at 20% 50%,rgba(240,188,83,.04) 0%,transparent 65%);
  }
  .sf-band1-inner {
    max-width:1200px;margin:0 auto;padding:0 48px;
    display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:start;position:relative;z-index:1;
  }
  .sf-band1-left { border-left:1px solid rgba(240,188,83,.12);padding-left:48px; }
  .sf-label { font-size:10px;letter-spacing:.22em;font-weight:700;margin-bottom:14px; }
  .sf-band1 .sf-label { color:rgba(240,188,83,.4); }
  .sf-h2 { font-family:var(--font-amiri);font-size:32px;font-weight:700;margin-bottom:20px;line-height:1.4; }
  .sf-band1 .sf-h2 { color:#F6F5F1; }
  .sf-body { font-size:13.5px;line-height:2.1;margin-bottom:24px; }
  .sf-band1 .sf-body { color:rgba(246,245,241,.38); }
  .sf-list { list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:12px; }
  .sf-list li { display:flex;gap:12px;font-size:13.5px;line-height:1.85; }
  .sf-list li::before { content:'—';color:#F0BC53;flex-shrink:0; }
  .sf-band1 .sf-list li { color:rgba(246,245,241,.4); }

  /* Level path list */
  .sf-levels-path { display:flex;flex-direction:column;gap:0;margin-top:4px; }
  .sf-lp-item {
    display:flex;align-items:center;gap:14px;padding:12px 0;
    border-bottom:1px solid rgba(240,188,83,.08);
    text-decoration:none;cursor:pointer;
    transition:padding-right .2s;background:none;border-right:none;border-top:none;border-left:none;
    width:100%;text-align:right;font-family:inherit;color:inherit;
  }
  .sf-lp-item:first-child { border-top:1px solid rgba(240,188,83,.08); }
  .sf-lp-item:hover,.sf-lp-item.active { padding-right:8px; }
  .sf-lp-n {
    font-family:var(--font-amiri);font-size:20px;font-weight:700;
    color:rgba(240,188,83,.22);width:28px;flex-shrink:0;text-align:center;
    transition:color .2s,text-shadow .2s;
  }
  .sf-lp-item:hover .sf-lp-n,.sf-lp-item.active .sf-lp-n { color:#F0BC53;text-shadow:0 0 12px rgba(240,188,83,.4); }
  .sf-lp-title {
    font-family:var(--font-amiri);font-size:14px;font-weight:700;
    color:rgba(246,245,241,.38);transition:color .2s;flex:1;text-align:right;
  }
  .sf-lp-item:hover .sf-lp-title,.sf-lp-item.active .sf-lp-title { color:rgba(246,245,241,.88); }
  .sf-lp-count { font-size:11px;color:rgba(246,245,241,.18);transition:color .2s; }
  .sf-lp-item:hover .sf-lp-count,.sf-lp-item.active .sf-lp-count { color:rgba(240,188,83,.4); }
  .sf-lp-arrow {
    font-size:12px;color:rgba(240,188,83,.0);transition:color .2s,transform .2s;
  }
  .sf-lp-item:hover .sf-lp-arrow,.sf-lp-item.active .sf-lp-arrow { color:#F0BC53;transform:translateX(-3px); }

  /* Level detail panel */
  .sf-level-detail { animation:sf-levelin .3s ease; }
  .sf-ld-head { display:flex;align-items:baseline;gap:14px;margin-bottom:20px; }
  .sf-ld-num { font-family:var(--font-amiri);font-size:68px;color:#F0BC53;line-height:1;opacity:.35; }
  .sf-ld-title { font-family:var(--font-amiri);font-size:26px;color:#F6F5F1;font-weight:700; }
  /* Subjects grid */
  .sf-ld-grid {
    display:grid;grid-template-columns:1fr 1fr;gap:1px;
    background:rgba(240,188,83,.12);margin-bottom:24px;
  }
  .sf-ld-cell {
    background:#193833;padding:12px 14px;
    transition:background .18s,box-shadow .18s;
    cursor:pointer;text-decoration:none;display:block;
  }
  .sf-ld-cell:hover { background:#1e4840;box-shadow:inset 0 -2px 0 #F0BC53; }
  .sf-ld-cell-n { font-size:9px;color:rgba(240,188,83,.28);font-weight:700;letter-spacing:.08em;margin-bottom:5px; }
  .sf-ld-cell-title { font-family:var(--font-amiri);font-size:13px;color:rgba(246,245,241,.7);font-weight:700;line-height:1.4;margin-bottom:4px; }
  .sf-ld-cell-meta { font-size:10px;color:rgba(246,245,241,.22); }
  .sf-ld-back {
    background:none;border:1px solid rgba(240,188,83,.2);color:rgba(240,188,83,.5);
    font-family:var(--font-cairo);font-size:11px;font-weight:700;letter-spacing:.1em;
    padding:7px 14px;cursor:pointer;transition:all .2s;margin-bottom:20px;display:inline-block;
  }
  .sf-ld-back:hover { border-color:rgba(240,188,83,.5);color:#F0BC53; }
  .sf-ld-cta {
    display:inline-flex;align-items:center;gap:8px;
    background:#F0BC53;color:#193833;padding:13px 32px;text-decoration:none;
    font-size:12px;font-weight:700;letter-spacing:.08em;transition:all .25s;
  }
  .sf-ld-cta:hover { background:#F6F5F1;box-shadow:0 4px 20px rgba(240,188,83,.3); }

  /* Overview panel (default band1 right) */
  .sf-overview { animation:sf-fadein .3s ease; }

  /* ─── Band 2 (cream) ─────── */
  .sf-band2 { background:#F6F5F1;padding:96px 0; }
  .sf-band2-inner {
    max-width:1200px;margin:0 auto;padding:0 48px;
    display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:start;
  }
  .sf-band2 .sf-label { color:#C9973A; }
  .sf-band2 .sf-h2 { color:#0F2822; }
  .sf-band2 .sf-body { color:#5A4E2A; }
  .sf-band2 .sf-list li { color:#5A4E2A; }
  .sf-pull {
    position:relative;padding:36px 32px 32px;
    border:1px solid #DEDAD0;background:#EEEAE0;margin-bottom:32px;
  }
  .sf-pull::before {
    content:'"';position:absolute;top:-22px;right:24px;
    font-family:var(--font-amiri);font-size:96px;color:#F0BC53;line-height:1;opacity:.6;
  }
  .sf-pull p { font-family:var(--font-amiri);font-size:17px;color:#0F2822;line-height:1.9;margin-bottom:12px; }
  .sf-pull cite { font-style:normal;font-size:11px;color:#C9973A;letter-spacing:.1em;font-weight:700; }
  .sf-scholar-highlights {
    display:grid;grid-template-columns:1fr 1fr;gap:1px;
    background:#DEDAD0;border:1px solid #DEDAD0;margin-top:32px;
  }
  .sf-sh-cell { background:#F6F5F1;padding:20px;transition:background .2s; }
  .sf-sh-cell:hover { background:#EEF5F3; }
  .sf-sh-v { font-family:var(--font-amiri);font-size:30px;font-weight:700;color:#193833;line-height:1; }
  .sf-sh-l { font-size:11px;color:#8A7A5A;letter-spacing:.1em;font-weight:600;margin-top:4px; }

  /* ─── Scholars ─────── */
  .sf-scholars { background:#F6F5F1;padding:88px 48px;border-top:1px solid #DEDAD0; }
  .sf-scholars-inner { max-width:1160px;margin:0 auto; }
  .sf-scholars-grid {
    display:grid;grid-template-columns:repeat(2,1fr);gap:0;margin-top:48px;
    border-top:1px solid #DEDAD0;border-right:1px solid #DEDAD0;
  }
  .sf-scholar {
    display:flex;align-items:center;gap:14px;padding:18px 24px;
    border-left:1px solid #DEDAD0;border-bottom:1px solid #DEDAD0;
    text-decoration:none;color:#0F2822;transition:background .2s,box-shadow .2s;
  }
  .sf-scholar:hover { background:#EEF5F3;box-shadow:inset 3px 0 0 #F0BC53; }
  .sf-scholar-n { font-size:11px;color:#C9973A;font-weight:800;flex-shrink:0;min-width:24px; }
  .sf-scholar span { font-family:var(--font-amiri);font-size:16px;font-weight:700; }

  /* ─── Footer ─────── */
  .sf-footer {
    background:#082e27;border-top:1px solid rgba(240,188,83,.08);
    display:grid;grid-template-columns:1fr 1fr;
  }
  .sf-footer-dark { padding:28px 40px;font-size:12px;color:rgba(246,245,241,.2);display:flex;align-items:center; }
  .sf-footer-light {
    background:#F6F5F1;padding:28px 40px;
    display:flex;align-items:center;justify-content:flex-end;gap:20px;
  }
  .sf-footer-light a { color:#5A4E2A;text-decoration:none;font-size:12px;font-weight:600;transition:color .2s; }
  .sf-footer-light a:hover { color:#193833; }

  /* ─── Mobile ─────── */
  @media (max-width: 768px) {
    /* Nav: collapse to dark bar only */
    .sf-nav { grid-template-columns:1fr; }
    .sf-nav-light { display:none; }
    .sf-nav-dark { padding:14px 20px;justify-content:space-between; }
    .sf-nav-dark::after {
      content:'ابدأ الآن';
      background:#F0BC53;color:#193833;padding:7px 16px;
      font-size:11px;font-weight:700;letter-spacing:.08em;
      font-family:var(--font-cairo);
    }

    /* Hero: stack vertically, content on top */
    .sf-hero { grid-template-columns:1fr;min-height:auto; }
    .sf-hero-light { order:-1;padding:48px 24px 52px; }
    .sf-hero-dark {
      min-height:240px;padding:36px 24px;
      border-left:none;border-top:1px solid rgba(240,188,83,.08);
    }
    .sf-logo { width:180px; }
    .sf-hero-dark-top,.sf-hero-dark-bottom { display:none; }
    .sf-vc { bottom:14px; }
    .sf-vc-link { display:none; }

    /* Hero content */
    .sf-hero-title { font-size:52px;margin-bottom:22px; }
    .sf-hadith { min-height:72px; }
    .sf-hadith p { font-size:16px; }
    .sf-hero-desc { font-size:13px;margin-bottom:24px;max-width:100%; }
    .sf-actions { flex-wrap:wrap; }
    .sf-btn,.sf-btn-ghost { padding:13px 28px;font-size:12px; }

    /* Journey: snap carousel */
    .sf-journey {
      height:190px;overflow-x:auto;overflow-y:hidden;
      scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;
      scrollbar-width:none;
    }
    .sf-journey::-webkit-scrollbar { display:none; }
    .sf-stage { min-width:120px;flex:none;scroll-snap-align:start; }
    .sf-stage:hover { flex:none; }
    .sf-stage-num { font-size:36px; }
    .sf-stage-name { font-size:11px;white-space:normal;overflow:visible;text-overflow:clip; }
    .sf-stage-arrow { font-size:12px; }
    .sf-stage-meta { display:none; }

    /* Stats: 2x2 grid */
    .sf-stats { grid-template-columns:repeat(2,1fr); }
    .sf-stat { padding:32px 16px 28px; }
    .sf-stat-v { font-size:44px; }
    .sf-stat-desc { display:none; }
    .sf-stat:nth-child(2) { border-left:none; }

    /* Band1 — single-view explorer on mobile */
    .sf-band1 { padding:56px 0; }
    .sf-band1-inner { grid-template-columns:1fr;gap:0;padding:0 24px; }
    .sf-h2 { font-size:26px; }
    .sf-ld-grid { grid-template-columns:1fr; }
    /* Default: show levels list, hide detail panel */
    .sf-band1-left { display:none; }
    /* When a level is selected: hide list, show detail full-width */
    .sf-band1-selected > div:first-child { display:none; }
    .sf-band1-selected .sf-band1-left {
      display:block;border-left:none;padding-left:0;
      border-top:1px solid rgba(240,188,83,.1);padding-top:32px;margin-top:0;
    }

    /* Band2 */
    .sf-band2 { padding:56px 0; }
    .sf-band2-inner { grid-template-columns:1fr;gap:40px;padding:0 24px; }
    .sf-pull { padding:28px 20px 24px; }
    .sf-pull p { font-size:15px; }

    /* Scholars */
    .sf-scholars { padding:56px 20px; }
    .sf-scholars-grid { grid-template-columns:1fr; }

    /* Footer */
    .sf-footer { grid-template-columns:1fr; }
    .sf-footer-light { justify-content:flex-start; }
    .sf-footer-dark,.sf-footer-light { padding:20px 24px; }
  }

  @media (max-width: 480px) {
    .sf-hero-title { font-size:44px; }
    .sf-hadith p { font-size:15px; }
    .sf-stat-v { font-size:38px; }
    .sf-logo { width:150px; }
    .sf-hero-dark { min-height:200px; }
  }
`;

function LevelDetail({ level, idx, onBack }: { level: Level; idx: number; onBack: () => void }) {
  return (
    <div className="sf-level-detail" key={idx}>
      <div className="sf-ld-head">
        <span className="sf-ld-num">{DIG[idx]}</span>
        <h3 className="sf-ld-title">{level.title}</h3>
      <button className="sf-ld-back" onClick={onBack}>←</button>
      </div>
      <div className="sf-ld-grid">
        {level.subjects.map((subject, si) => {
          const lessonCount = subject.courses.reduce((s, c) => s + c.files.length, 0);
          return (
            <Link key={si} href={`/level/${idx}/${si}`} className="sf-ld-cell">
              <div className="sf-ld-cell-n">{String(si + 1).padStart(2, "0")}</div>
              <div className="sf-ld-cell-title">{subject.title}</div>
              <div className="sf-ld-cell-meta">{subject.courses.length} مقرر · {lessonCount} درس</div>
            </Link>
          );
        })}
      </div>
      <Link href={`/level/${idx}`} className="sf-ld-cta">
        ابدأ المستوى {DIG[idx]}
        <span>←</span>
      </Link>
    </div>
  );
}

export default function SafarPage() {
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
      playerRef.current = new (window as any).YT.Player("sf-hero-video", {
        events: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onReady: (e: any) => { e.target.unMute(); e.target.setVolume(70); },
        },
      });
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).YT && (window as any).YT.Player) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).onYouTubeIframeAPIReady();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  }, []);

  // Typing effect — runs whenever hadithIdx changes
  useEffect(() => {
    const chars = Array.from(HADITHS[hadithIdx].text);
    setDisplayedText("");
    setIsTyping(true);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayedText(chars.slice(0, i).join(""));
      if (i >= chars.length) {
        clearInterval(id);
        setIsTyping(false);
      }
    }, 36);
    return () => clearInterval(id);
  }, [hadithIdx]);

  // Auto-advance hadith after typing finishes + reading pause
  useEffect(() => {
    const typingDuration = Array.from(HADITHS[hadithIdx].text).length * 36 + 3500;
    const id = setTimeout(() => {
      setHadithIdx(i => (i + 1) % HADITHS.length);
    }, typingDuration);
    return () => clearTimeout(id);
  }, [hadithIdx]);

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (muted) { playerRef.current.unMute(); } else { playerRef.current.mute(); }
    setMuted(m => !m);
  };

  const toAr = (n: number) => n.toString().replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[+d]);
  const totalSubjects = university.reduce((s, l) => s + l.subjects.length, 0);
  const totalLessons  = university.reduce((s, l) => s + countLevelLessons(l), 0);

  const h = HADITHS[hadithIdx];
  const sourceVisible = !isTyping && displayedText.length > 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sf-root">

        {/* NAV */}
        <nav className="sf-nav">
          <div className="sf-nav-dark">
            <span className="sf-brand">جامعة كبار العلماء</span>
          </div>
          <div className="sf-nav-light">
            <Link href="/" className="sf-nav-a">المستويات</Link>
            <Link href="/scholars" className="sf-nav-a">المشايخ</Link>
            <Link href="/search" className="sf-nav-a">البحث</Link>
            <Link href="/about" className="sf-nav-a">الأصلية</Link>
            <Link href="/" className="sf-nav-cta">ابدأ الآن</Link>
          </div>
        </nav>

        {/* HERO */}
        <header className="sf-hero">
          <div className="sf-hero-dark">
            <div className="sf-vbg">
              <iframe
                id="sf-hero-video"
                src="https://www.youtube.com/embed/FSxwG1aceuw?start=2869&autoplay=1&mute=1&loop=1&controls=0&playlist=FSxwG1aceuw&disablekb=1&modestbranding=1&enablejsapi=1"
                allow="autoplay; encrypted-media"
                title="خلفية"
              />
              <div className="sf-vbg-overlay" />
            </div>
            <div className="sf-hero-dark-content">
              <div className="sf-hero-dark-top">مشروع الدعوة الإلكترونية</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="جامعة كبار العلماء" className="sf-logo" />
              {/* <div className="sf-hero-dark-bottom">١٤٣٥ هـ — حتى اليوم</div> */}
            </div>
            <div className="sf-vc">
              <div className="sf-vc-inner">
                <button className="sf-vc-btn" onClick={toggleMute} type="button">
                  {muted ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                      <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    </svg>
                  )}
                  {muted ? "تشغيل الصوت" : "كتم الصوت"}
                </button>
                <div className="sf-vc-sep" />
                <a
                  href="https://www.youtube.com/watch?v=FSxwG1aceuw&t=2869s"
                  target="_blank" rel="noopener noreferrer"
                  className="sf-vc-link"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  مشاهدة الفلم كاملاً
                </a>
              </div>
            </div>
          </div>

          <div className="sf-hero-light">
            <h1 className="sf-hero-title">
              رحلة طلب العلم  <br /> مع كبار العلماء
            </h1>

            {/* Animated hadith */}
            <div className="sf-hadith">
              <p>
                {displayedText}
                {isTyping && <span className="sf-cursor" />}
              </p>
              <cite style={{ opacity: sourceVisible ? 1 : 0 }}>{h.source}</cite>
            </div>

            {/* Dots */}
            {/* <div className="sf-hdots">
              {HADITHS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHadithIdx(i)}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" }}
                  type="button"
                >
                  <span className={`sf-hdot${i === hadithIdx ? " active" : ""}`} />
                </button>
              ))}
            </div> */}

            <p className="sf-hero-desc">
              ثمانية مستويات دراسية مرتّبة — بصوتيات كبار العلماء وفق منهج كلية الشريعة.
              منصة شاملة لتلقي العلم الشرعي من الصفر حتى التمكن.
            </p>
            <div className="sf-actions">
              <Link href="/" className="sf-btn">ابدأ التعلم</Link>
              <Link href="/scholars" className="sf-btn-ghost">المشايخ</Link>
            </div>
          </div>
        </header>

        {/* JOURNEY */}
        <div className="sf-journey">
          {university.map((level, idx) => (
            <Link key={idx} href={`/level/${idx}`} className="sf-stage">
              <span className="sf-stage-arrow">↗</span>
              <span className="sf-stage-num">{DIG[idx]}</span>
              <span className="sf-stage-name">{level.title}</span>
              <div className="sf-stage-meta">
                {level.subjects.length} مادة · {countLevelLessons(level)} درس
              </div>
            </Link>
          ))}
        </div>

        {/* STATS */}
        <div className="sf-stats-wrap">
          <hr className="sf-stats-rule" />
          <div className="sf-stats">
            {[
              { v:"٨",            l:"مستوى دراسي",  d:"من المبتدئ إلى المتقدم" },
              { v: toAr(totalSubjects), l:"مادة علمية",   d:"عقيدة وفقه وحديث وتفسير وأصول ولغة" },
              { v: toAr(totalLessons),  l:"درس شرعي",     d:"تسجيلات أصيلة بجودة عالية" },
              { v:"+٢٠",          l:"شيخاً وعالماً", d:"من كبار العلماء الثقات المعتمدين" },
            ].map((s, i) => (
              <div key={i} className="sf-stat">
                <div className="sf-stat-v">{s.v}</div>
                <div className="sf-stat-l">{s.l}</div>
                <div className="sf-stat-desc">{s.d}</div>
              </div>
            ))}
          </div>
          <hr className="sf-stats-rule" />
        </div>

        {/* BAND 1 — interactive level explorer */}
        <section className="sf-band1">
          <div className={`sf-band1-inner${selectedLevel !== null ? " sf-band1-selected" : ""}`}>
            {/* Right col: level list */}
            <div>
              <p className="sf-label">المستويات الثمانية</p>
              <div className="sf-levels-path">
                {university.map((level, idx) => {
                  const count = countLevelLessons(level);
                  return (
                    <button
                      key={idx}
                      className={`sf-lp-item${selectedLevel === idx ? " active" : ""}`}
                      onClick={() => setSelectedLevel(selectedLevel === idx ? null : idx)}
                      type="button"
                    >
                      <span className="sf-lp-n">{DIG[idx]}</span>
                      <span className="sf-lp-title">{level.title}</span>
                      <span className="sf-lp-count">{count} درس</span>
                      <span className="sf-lp-arrow">←</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Left col: overview OR level detail */}
            <div className="sf-band1-left">
              {selectedLevel !== null ? (
                <LevelDetail
                  key={selectedLevel}
                  level={university[selectedLevel]}
                  idx={selectedLevel}
                  onBack={() => setSelectedLevel(null)}
                />
              ) : (
                <div className="sf-overview">
                  <p className="sf-label">المنهج الدراسي</p>
                  <h2 className="sf-h2">منهج علمي موثّق ومنظّم</h2>
                  <p className="sf-body">
                    يقوم المنهج على ترتيب دقيق ومتدرّج وفق ما أقرّته كلية الشريعة في جامعة الإمام محمد بن سعود
                    الإسلامية — من أسس اللغة العربية والعقيدة، إلى علوم الحديث والتفسير وأصول الفقه.
                    كل مستوى بناء على ما قبله، يضع الطالب على صراط واضح نحو التمكن العلمي الشرعي.
                  </p>
                  <ul className="sf-list">
                    {[
                      "تسجيلات أصيلة بأصوات المشايخ — لا قطع ولا تحرير",
                      "يناسب المبتدئ الذي لم يدرس قط والمتقدم الذي يريد الضبط",
                      "مرتّب بحيث تُغني المراحل السابقة عن كثير من الشروح",
                      "متاح بالكامل — بلا اشتراك ولا رسوم",
                    ].map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                  <p style={{ marginTop: 24, fontSize: 12, color: "rgba(246,245,241,.25)", letterSpacing: ".1em" }}>
                    اختر مستوى للاستعراض ←
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* BAND 2 */}
        <section className="sf-band2">
          <div className="sf-band2-inner">
            <div>
              <p className="sf-label">روح المشروع</p>
              <div className="sf-pull">
                <p>
                  «إِنَّ الْعُلَمَاءَ وَرَثَةُ الْأَنْبِيَاءِ — إِنَّ الْأَنْبِيَاءَ لَمْ يُوَرِّثُوا دِينَارًا
                  وَلَا دِرْهَمًا، وَإِنَّمَا وَرَّثُوا الْعِلْمَ — فَمَنْ أَخَذَهُ أَخَذَ بِحَظٍّ وَافِرٍ»
                </p>
                <cite>رواه أبو داود والترمذي</cite>
              </div>
              <p className="sf-body">
                تأسّس هذا المشروع على يقين راسخ بأن العلم الشرعي حق لكل مسلم، وأن أشرف طريق
                لتلقيه هو ما سلكه السلف: الأخذ عن العلماء الثقات، المتصلين بالكتاب والسنة.
                ما تجده هنا ليس محتوى رقمياً فحسب — بل هو إرث علمي موثّق، أُتيح لكل طالب علم.
              </p>
            </div>
            <div>
              <p className="sf-label">العلماء والدروس</p>
              <h2 className="sf-h2">نخبة من كبار العلماء الثقات</h2>
              <ul className="sf-list" style={{ marginBottom: 32 }}>
                {[
                  "يجمع دروس ابن باز وابن عثيمين والألباني والفوزان وعشرين غيرهم",
                  "أكثر من مليار مشاهدة لهذه الدروس عبر المنصات الرقمية",
                  "علم يبني على الكتاب والسنة — نظري وتطبيقي متوازن",
                  "دروس محاضرات وشروح متون — تنوع في الأسلوب ووحدة في المنهج",
                ].map((t, i) => <li key={i}>{t}</li>)}
              </ul>
              <div className="sf-scholar-highlights">
                {[
                  { v:"+٢٠", l:"شيخاً معتمداً" },
                  { v:"+١٠٠٠", l:"ساعة تسجيل" },
                  { v:"١٤٣٥", l:"سنة التأسيس هـ" },
                  { v:"مجاني", l:"بالكامل" },
                ].map((h, i) => (
                  <div key={i} className="sf-sh-cell">
                    <div className="sf-sh-v">{h.v}</div>
                    <div className="sf-sh-l">{h.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SCHOLARS */}
        <section className="sf-scholars">
          <div className="sf-scholars-inner">
            <p className="sf-label" style={{ color:"#C9973A" }}>علماء الجامعة</p>
            <h2 className="sf-h2" style={{ color:"#0F2822" }}>كبار العلماء</h2>
            <div className="sf-scholars-grid">
              {SCHOLARS.map((name, i) => (
                <Link key={name} href="/scholars" className="sf-scholar">
                  <span className="sf-scholar-n">{String(i + 1).padStart(2, "0")}</span>
                  <span>الشيخ {name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="sf-footer">
          <div className="sf-footer-dark">جامعة كبار العلماء — مرجعية موثوقة في تلقي العلم الشرعي</div>
          <div className="sf-footer-light">
            <a href="https://www.kibbarulmauni.com" target="_blank" rel="noopener noreferrer">الموقع الرسمي</a>
            <a href="https://www.youtube.com/@kibbarulmauni" target="_blank" rel="noopener noreferrer">قناة يوتيوب</a>
          </div>
        </footer>

      </div>
    </>
  );
}
