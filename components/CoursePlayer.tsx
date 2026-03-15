"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import type { Lesson, TranscriptSegment } from "@/lib/data";
import type { LevelColor } from "@/lib/constants";
import { saveWatched } from "@/lib/useRecentlyWatched";
import { useWatched } from "@/lib/watchedContext";
import { WatchButton } from "./WatchButton";
import { SignInDialog } from "./SignInDialog";
import { TranscriptPanel } from "./TranscriptPanel";
import { TranscriptUploadButton } from "./TranscriptUploadButton";

// ── YouTube IFrame API types ───────────────────────────────────────────────────
declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement, opts: YTOpts) => YTPlayer;
      PlayerState: { PLAYING: 1; PAUSED: 2; ENDED: 0 };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
interface YTOpts {
  videoId: string;
  playerVars?: Record<string, string | number>;
  events?: { onStateChange?: (e: { data: number }) => void };
}
interface YTPlayer {
  seekTo(s: number, allow: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  pauseVideo(): void;
  destroy(): void;
}

function loadYTApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toAr(n: number): string {
  return (n + 1).toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
function lessonWord(n: number) {
  return n === 1 ? "درس" : "دروس";
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  lessons: Lesson[];
  col: LevelColor;
  levelIdx: number;
  subjectIdx: number;
  courseIdx: number;
  courseTitle: string;
  levelTitle: string;
}

export function CoursePlayer({ lessons, col, levelIdx, subjectIdx, courseIdx, courseTitle, levelTitle }: Props) {
  const searchParams = useSearchParams();
  const initialLesson = Math.min(Number(searchParams.get("lesson") ?? 0) || 0, lessons.length - 1);

  const [selected, setSelected] = useState(initialLesson);
  const [currentTime, setCurrentTime] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [transcriptOpen, setTranscriptOpen] = useState(true);
  const [transcriptVersion, setTranscriptVersion] = useState(0);
  const [ambientMode, setAmbientMode] = useState(false);
  const [ambientTranscriptOpen, setAmbientTranscriptOpen] = useState(true);
  const [transcriptWidth, setTranscriptWidth] = useState(360);
  const [mounted, setMounted] = useState(false);
  const isResizing = useRef(false);
  const ambientStartAtRef = useRef(0);

  // YT player refs
  const mainDivRef = useRef<HTMLDivElement>(null);
  const ambientDivRef = useRef<HTMLDivElement>(null);
  const mainPlayerRef = useRef<YTPlayer | null>(null);
  const ambientPlayerRef = useRef<YTPlayer | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep mutable copies to avoid stale closures inside YT callbacks
  const isLoggedInRef = useRef(false);
  const selectedRef = useRef(selected);
  const { isWatched, toggleWatched, isLoggedIn, isLoaded, watchedKeys } = useWatched();
  const isWatchedRef = useRef(isWatched);
  const toggleWatchedRef = useRef(toggleWatched);
  useEffect(() => { isLoggedInRef.current = isLoggedIn; }, [isLoggedIn]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { isWatchedRef.current = isWatched; }, [isWatched]);
  useEffect(() => { toggleWatchedRef.current = toggleWatched; }, [toggleWatched]);

  useEffect(() => { setMounted(true); }, []);

  function onResizeStart(e: React.MouseEvent) {
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = transcriptWidth;
    const onMove = (mv: MouseEvent) => {
      if (!isResizing.current) return;
      // transcript is on the left; dragging handle left = wider
      const delta = mv.clientX - startX;
      setTranscriptWidth(Math.max(240, Math.min(640, startWidth + delta)));
    };
    const onUp = () => {
      isResizing.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const lesson = lessons[selected];
  const ytId = lesson.youtube?.match(/[?&]v=([^&]+)/)?.[1] ?? null;

  // ── Poll helpers ─────────────────────────────────────────────────────────────
  function stopPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  function startPoll(getPlayer: () => YTPlayer | null) {
    stopPoll();
    pollRef.current = setInterval(() => {
      const p = getPlayer();
      if (!p) return;
      const t = p.getCurrentTime();
      setCurrentTime(t);
      // mark watched at 80 %
      const dur = p.getDuration();
      if (dur > 0 && t / dur >= 0.8 && isLoggedInRef.current) {
        const key = `${levelIdx}:${subjectIdx}:${courseIdx}:${selectedRef.current}`;
        if (!isWatchedRef.current(key)) toggleWatchedRef.current(key);
      }
    }, 500);
  }

  function makeStateHandler(getPlayer: () => YTPlayer | null) {
    return (e: { data: number }) => {
      if (e.data === 1) {           // playing
        startPoll(getPlayer);
      } else {
        stopPoll();
        if (e.data === 0) {         // ended
          if (!isLoggedInRef.current) return;
          const key = `${levelIdx}:${subjectIdx}:${courseIdx}:${selectedRef.current}`;
          if (!isWatchedRef.current(key)) toggleWatchedRef.current(key);
        }
      }
    };
  }

  // ── Create / destroy main player ──────────────────────────────────────────────
  useEffect(() => {
    if (!ytId || !mainDivRef.current) return;
    let destroyed = false;

    loadYTApi().then(() => {
      if (destroyed || !mainDivRef.current) return;
      mainPlayerRef.current = new window.YT.Player(mainDivRef.current, {
        videoId: ytId,
        playerVars: { enablejsapi: 1, rel: 0 },
        events: { onStateChange: makeStateHandler(() => mainPlayerRef.current) },
      });
    });

    return () => {
      destroyed = true;
      stopPoll();
      mainPlayerRef.current?.destroy();
      mainPlayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytId]);

  // ── Pause main player when entering ambient ───────────────────────────────────
  useEffect(() => {
    if (ambientMode) mainPlayerRef.current?.pauseVideo();
  }, [ambientMode]);

  // ── Create / destroy ambient player ──────────────────────────────────────────
  useEffect(() => {
    if (!ambientMode || !ytId || !ambientDivRef.current) return;
    let destroyed = false;
    const startAt = ambientStartAtRef.current;
    ambientStartAtRef.current = 0; // subsequent lesson changes start from beginning

    loadYTApi().then(() => {
      if (destroyed || !ambientDivRef.current) return;
      ambientPlayerRef.current = new window.YT.Player(ambientDivRef.current, {
        videoId: ytId,
        playerVars: { enablejsapi: 1, rel: 0, autoplay: 1, start: startAt },
        events: { onStateChange: makeStateHandler(() => ambientPlayerRef.current) },
      });
    });

    return () => {
      destroyed = true;
      stopPoll();
      ambientPlayerRef.current?.destroy();
      ambientPlayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambientMode, ytId]);

  // ── Track recently watched ────────────────────────────────────────────────────
  useEffect(() => {
    saveWatched({ levelIdx, subjectIdx, courseIdx, lessonIdx: selected, courseTitle, lessonTitle: lessons[selected].title, levelTitle });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseIdx]);

  // ── Fetch transcript ─────────────────────────────────────────────────────────
  const transcriptFilename = `${levelIdx}-${subjectIdx}-${courseIdx}-${selected}.txt`;

  useEffect(() => {
    setCurrentTime(0);
    setTranscript([]);

    const loadFile = () => {
      fetch(`/api/transcript?file=${transcriptFilename}`)
        .then((r) => r.json())
        .then(({ segments }: { segments: TranscriptSegment[] }) => {
          if (segments.length > 0) setTranscript(segments);
        })
        .catch(() => {});
    };

    if (!ytId) { loadFile(); return; }

    fetch(`/api/transcript?v=${ytId}`)
      .then((r) => r.json())
      .then(({ segments }: { segments: TranscriptSegment[] }) => {
        if (segments.length > 0) setTranscript(segments);
        else loadFile();
      })
      .catch(loadFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, transcriptVersion]);

  // ── Course progress ───────────────────────────────────────────────────────────
  const watchedCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < lessons.length; i++) {
      if (watchedKeys.has(`${levelIdx}:${subjectIdx}:${courseIdx}:${i}`)) count++;
    }
    return count;
  }, [watchedKeys, lessons.length, levelIdx, subjectIdx, courseIdx]);

  const progressPct = lessons.length > 0 ? Math.round((watchedCount / lessons.length) * 100) : 0;

  // ── Actions ──────────────────────────────────────────────────────────────────
  function goNext() {
    if (isLoggedIn) {
      const key = `${levelIdx}:${subjectIdx}:${courseIdx}:${selected}`;
      if (!isWatched(key)) toggleWatched(key);
    }
    setSelected((s) => Math.min(s + 1, lessons.length - 1));
  }

  const seekTo = useCallback((t: number) => {
    mainPlayerRef.current?.seekTo(t, true);
    ambientPlayerRef.current?.seekTo(t, true);
    setCurrentTime(t);
  }, []);

  // ── No-video placeholder ──────────────────────────────────────────────────────
  const noVideo = (
    <div className="w-full h-full flex flex-col items-center justify-center text-stone-500 gap-3">
      <svg className="w-10 h-10 opacity-40" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
      </svg>
      <p className="text-sm">الفيديو غير متاح</p>
    </div>
  );

  // ── Ambient overlay ───────────────────────────────────────────────────────────
  const ambientOverlay = (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950" dir="rtl">
      {/* Top bar */}
      <div className="shrink-0 flex items-center gap-2 px-5 py-3 border-b border-neutral-800">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{lesson.title}</p>
          <p className={`text-xs mt-0.5 ${col.text}`}>الدرس {toAr(selected)} من {toAr(lessons.length - 1)}</p>
        </div>
        <button onClick={() => setSelected((s) => Math.max(s - 1, 0))} disabled={selected === 0}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white disabled:opacity-25 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-neutral-800">
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 8L6 4l-1 1L8.5 8 5 11l1 1 4.5-4z" /></svg>
          السابق
        </button>
        <button onClick={goNext} disabled={selected === lessons.length - 1}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white disabled:opacity-25 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-neutral-800">
          التالي
          <svg className="w-3.5 h-3.5 rotate-180" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 8L6 4l-1 1L8.5 8 5 11l1 1 4.5-4z" /></svg>
        </button>
        {transcript.length > 0 && (
          <button onClick={() => setAmbientTranscriptOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-neutral-800">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {ambientTranscriptOpen ? "إخفاء النص" : "إظهار النص"}
          </button>
        )}
        <button onClick={() => setAmbientMode(false)}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black" style={{ maxHeight: "calc(100vh - 110px)" }}>
            {ytId ? <div ref={ambientDivRef} className="w-full h-full" /> : noVideo}
          </div>
        </div>
        {ambientTranscriptOpen && transcript.length > 0 && (
          <div className="flex flex-col overflow-hidden shrink-0 relative border-r border-neutral-800" style={{ width: transcriptWidth }}>
            {/* Drag handle */}
            <div
              onMouseDown={onResizeStart}
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-neutral-600 transition-colors z-10"
            />
            <TranscriptPanel segments={transcript} currentTime={currentTime} col={col} onSeek={seekTo} variant="dark" />
          </div>
        )}
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Video panel ── */}
        <div className="lg:col-span-2 flex flex-col gap-3">

          {/* 1. Lesson title */}
          <div className="bg-white rounded-xl border border-stone-100 shadow-sm px-4 py-3.5 flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-stone-800 text-sm leading-snug">{lesson.title}</p>
              <p className={`text-xs mt-1 ${col.text}`}>الدرس {toAr(selected)} من {toAr(lessons.length - 1)}</p>
            </div>
            {lesson.youtube && (
              <a href={lesson.youtube} target="_blank" rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 text-xs text-stone-400 hover:text-red-500 transition-colors py-1">
                <svg className="w-4 h-4" viewBox="0 0 20 14" fill="currentColor">
                  <path d="M19.6 2.2C19.4 1.4 18.8.8 18 .6 16.4.2 10 .2 10 .2S3.6.2 2 .6C1.2.8.6 1.4.4 2.2 0 3.8 0 7 0 7s0 3.2.4 4.8c.2.8.8 1.4 1.6 1.6C3.6 13.8 10 13.8 10 13.8s6.4 0 8-.4c.8-.2 1.4-.8 1.6-1.6.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM8 10V4l5.3 3L8 10z" />
                </svg>
                يوتيوب
              </a>
            )}
          </div>

          {/* 2. Video */}
          <div className="group relative aspect-video bg-stone-900 rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5">
            {ytId ? <div ref={mainDivRef} className="w-full h-full" /> : noVideo}
            {ytId && (
              <button onClick={() => { ambientStartAtRef.current = Math.floor(currentTime); setAmbientMode(true); }}
                className="absolute top-13 left-2.5 flex items-center gap-1.5 text-[11px] font-medium text-white bg-black/50 hover:bg-black/70 rounded-lg px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
                وضع الانغماس
              </button>
            )}
          </div>

          {/* 3. Transcript (collapsible) */}
          {transcript.length > 0 && (
            <div>
              <button onClick={() => setTranscriptOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 bg-white border border-stone-100 rounded-xl px-4 py-2.5 shadow-sm hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="text-xs font-semibold text-stone-500">النص</span>
                </div>
                <svg className={`w-3.5 h-3.5 text-stone-400 transition-transform ${transcriptOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {transcriptOpen && (
                <div className="mt-1.5" style={{ height: "260px" }}>
                  <TranscriptPanel segments={transcript} currentTime={currentTime} col={col} onSeek={seekTo} />
                </div>
              )}
            </div>
          )}

          {/* 4. Prev / Next */}
          <div className="flex justify-between gap-3">
            <button onClick={goNext} disabled={selected === lessons.length - 1}
              className="flex-1 flex items-center justify-center gap-2 bg-white border border-stone-100 rounded-xl py-2.5 text-xs font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm">
              <svg className="w-4 h-4 rotate-180" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 8L6 4l-1 1L8.5 8 5 11l1 1 4.5-4z" /></svg>
              الدرس التالي
            </button>
            <button onClick={() => setSelected((s) => Math.max(s - 1, 0))} disabled={selected === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-white border border-stone-100 rounded-xl py-2.5 text-xs font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm">
              الدرس السابق
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 8L6 4l-1 1L8.5 8 5 11l1 1 4.5-4z" /></svg>
            </button>
          </div>
        </div>

        {/* ── Playlist ── */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden flex flex-col self-start">
          <div className={`px-4 py-3 ${col.bg} text-white shrink-0`}>
            <p className="text-sm font-semibold">قائمة الدروس</p>
            <p className="text-white/70 text-xs mt-0.5">{lessons.length} {lessonWord(lessons.length)}</p>
          </div>
          {isLoaded && isLoggedIn && (
            <div className="px-4 py-2 border-b border-stone-100 flex items-center gap-2.5">
              <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div className={`h-full ${col.bg} rounded-full transition-all duration-500`} style={{ width: `${progressPct}%` }} />
              </div>
              <span className={`text-[11px] font-semibold ${col.text} shrink-0`}>{watchedCount}/{lessons.length}</span>
            </div>
          )}
          {isLoaded && !isLoggedIn && (
            <div className="px-4 py-2 border-b border-stone-100">
              <SignInDialog trigger={
                <button className="text-[11px] text-stone-400 hover:text-emerald-600 transition-colors underline underline-offset-2">
                  سجّل دخولك لتتبع تقدمك
                </button>
              } />
            </div>
          )}
          <div className="divide-y divide-stone-50 overflow-y-auto" style={{ maxHeight: "min(60vh, 520px)" }}>
            {lessons.map((l, idx) => {
              const isActive = idx === selected;
              const lessonKey = `${levelIdx}:${subjectIdx}:${courseIdx}:${idx}`;
              return (
                <button key={idx} onClick={() => setSelected(idx)}
                  className={`w-full text-right px-3.5 py-3 flex items-start gap-2.5 border-r-2 transition-colors ${isActive ? `${col.light} ${col.activeBorder}` : "border-r-transparent hover:bg-stone-50"}`}>
                  <div className={`shrink-0 w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center mt-0.5 ${isActive ? `${col.bg} text-white` : "bg-stone-100 text-stone-400"}`}>
                    {toAr(idx)}
                  </div>
                  <p className={`flex-1 text-xs leading-relaxed text-right ${isActive ? `${col.text} font-semibold` : "text-stone-600"}`}>
                    {l.title}
                  </p>
                  <WatchButton lessonKey={lessonKey} col={col} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {mounted && ambientMode && createPortal(ambientOverlay, document.body)}
      <TranscriptUploadButton
        filename={transcriptFilename}
        onSaved={() => setTranscriptVersion((v) => v + 1)}
      />
    </>
  );
}
