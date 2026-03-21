"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Lesson, TranscriptSegment } from "@/lib/data";
import type { LevelColor } from "@/lib/constants";
import { saveWatched } from "@/lib/useRecentlyWatched";
import { useWatched } from "@/lib/watchedContext";
import { NotebookPenIcon, PlusIcon, XIcon } from "lucide-react";
import { WatchButton } from "./WatchButton";
import { SignInDialog } from "./SignInDialog";
import { TranscriptPanel } from "./TranscriptPanel";
import { TranscriptUploadButton } from "./TranscriptUploadButton";
import { AudioUploadButton } from "./AudioUploadButton";
import { AmbientNotePanel } from "./AmbientNotePanel";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useNotes } from "@/lib/notesContext";

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
  events?: { onStateChange?: (e: { data: number }) => void; onReady?: () => void };
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
function stripLeadingNumber(title: string): string {
  return title.replace(/^\d+\s*[-–]\s*/, "");
}
function lessonWord(n: number) {
  if (n === 2) return "درسان";
  if (n >= 3 && n <= 10) return "دروس";
  return "درس";
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
  siblings?: { title: string; files: unknown[] }[];
  subjectTitle?: string;
}

export function CoursePlayer({ lessons, col, levelIdx, subjectIdx, courseIdx, courseTitle, levelTitle, siblings, subjectTitle }: Props) {
  const searchParams = useSearchParams();
  const initialLesson = Math.min(Number(searchParams.get("lesson") ?? 0) || 0, lessons.length - 1);

  const [selected, setSelected] = useState(initialLesson);
  const [currentTime, setCurrentTime] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [transcriptOpen, setTranscriptOpen] = useState(true);
  const [transcriptVersion, setTranscriptVersion] = useState(0);
  const [audioExists, setAudioExists] = useState(false);
  const [audioVersion, setAudioVersion] = useState(0);
  const [ambientMode, setAmbientMode] = useState(false);
  const [ambientTranscriptOpen, setAmbientTranscriptOpen] = useState(true);
  const [ambientNotesOpen, setAmbientNotesOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const autoplayNextRef = useRef(false);
  const ambientStartAtRef = useRef(0);
  const lastSaveRef = useRef(0);
  const lastDbSaveRef = useRef(0);

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

  // Auto-select first unwatched lesson once watched keys are loaded.
  // If the currently selected lesson is already watched, jump to the first unwatched one.
  // If the selected lesson is unwatched (e.g. explicit deep-link), leave it as-is.
  useEffect(() => {
    if (!isLoaded) return;
    const currentKey = `${levelIdx}:${subjectIdx}:${courseIdx}:${selected}`;
    if (!watchedKeys.has(currentKey)) return;
    const firstUnwatched = lessons.findIndex(
      (_, i) => !watchedKeys.has(`${levelIdx}:${subjectIdx}:${courseIdx}:${i}`)
    );
    if (firstUnwatched >= 0) setSelected(firstUnwatched);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const lesson = lessons[selected];
  const ytId = lesson.youtube?.match(/[?&]v=([^&]+)/)?.[1] ?? null;

  // ── Poll helpers ─────────────────────────────────────────────────────────────
  function stopPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  function savePositionToDb(pos: number) {
    if (!isLoggedInRef.current || pos <= 5) return;
    const key = `${levelIdx}:${subjectIdx}:${courseIdx}:${selectedRef.current}`;
    fetch("/api/recently-visited", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonKey: key, position: Math.floor(pos) }),
    }).catch(() => {});
  }

  function startPoll(getPlayer: () => YTPlayer | null) {
    stopPoll();
    pollRef.current = setInterval(() => {
      const p = getPlayer();
      if (!p) return;
      const t = p.getCurrentTime();
      setCurrentTime(t);
      // save position every 5 seconds (localStorage) and every 30s (DB)
      if (t - lastSaveRef.current >= 5) {
        lastSaveRef.current = t;
        localStorage.setItem(`playback_${levelIdx}_${subjectIdx}_${courseIdx}_${selectedRef.current}`, String(Math.floor(t)));
        if (t - lastDbSaveRef.current >= 30) {
          lastDbSaveRef.current = t;
          savePositionToDb(t);
        }
      }
      // mark watched at 90 %
      const dur = p.getDuration();
      if (dur > 0 && t / dur >= 0.9 && isLoggedInRef.current) {
        const key = `${levelIdx}:${subjectIdx}:${courseIdx}:${selectedRef.current}`;
        if (!isWatchedRef.current(key)) {
          toggleWatchedRef.current(key);
          localStorage.removeItem(`playback_${levelIdx}_${subjectIdx}_${courseIdx}_${selectedRef.current}`);
          fetch("/api/recently-visited", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonKey: key, position: 0 }) }).catch(() => {});
        }
      }
    }, 500);
  }

  function makeStateHandler(getPlayer: () => YTPlayer | null) {
    return (e: { data: number }) => {
      if (e.data === 1) {           // playing
        startPoll(getPlayer);
      } else {
        stopPoll();
        if (e.data === 2) {         // paused — save position to DB
          const p = getPlayer();
          if (p) savePositionToDb(p.getCurrentTime());
        }
        if (e.data === 0) {         // ended
          if (isLoggedInRef.current) {
            const key = `${levelIdx}:${subjectIdx}:${courseIdx}:${selectedRef.current}`;
            if (!isWatchedRef.current(key)) toggleWatchedRef.current(key);
          }
          // Start countdown to next lesson
          if (selectedRef.current < lessons.length - 1) {
            setCountdown(5);
          }
        }
      }
    };
  }

  // ── Countdown to next lesson ──────────────────────────────────────────────────
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      autoplayNextRef.current = true;
      setSelected((s) => s + 1);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ── Create / destroy main player ──────────────────────────────────────────────
  useEffect(() => {
    if (!ytId || !mainDivRef.current) return;
    let destroyed = false;
    setCountdown(null); // clear countdown when lesson changes

    const shouldAutoplay = autoplayNextRef.current;
    autoplayNextRef.current = false;
    lastSaveRef.current = 0;
    lastDbSaveRef.current = 0;

    const savedPos = Number(localStorage.getItem(`playback_${levelIdx}_${subjectIdx}_${courseIdx}_${selectedRef.current}`) ?? 0);

    loadYTApi().then(() => {
      if (destroyed || !mainDivRef.current) return;
      mainPlayerRef.current = new window.YT.Player(mainDivRef.current, {
        videoId: ytId,
        playerVars: { enablejsapi: 1, rel: 0, autoplay: shouldAutoplay ? 1 : 0, ...(savedPos > 5 ? { start: Math.floor(savedPos) } : {}) },
        events: {
          onStateChange: makeStateHandler(() => mainPlayerRef.current),
          onReady: () => {
            if (!isLoggedInRef.current) return;
            const lessonKeyAtLoad = `${levelIdx}:${subjectIdx}:${courseIdx}:${selectedRef.current}`;
            fetch("/api/recently-visited")
              .then((r) => r.json())
              .then(({ entries }: { entries: { key: string; position: number }[] }) => {
                const entry = entries?.find((e) => e.key === lessonKeyAtLoad);
                const dbPos = entry?.position ?? 0;
                if (dbPos > savedPos && dbPos > 5) {
                  mainPlayerRef.current?.seekTo(dbPos, true);
                  localStorage.setItem(`playback_${levelIdx}_${subjectIdx}_${courseIdx}_${selectedRef.current}`, String(dbPos));
                }
              })
              .catch(() => {});
          },
        },
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
    saveWatched({ levelIdx, subjectIdx, courseIdx, lessonIdx: selected, courseTitle, lessonTitle: lessons[selected].title, levelTitle }, isLoggedInRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseIdx]);

  // ── Fetch transcript ─────────────────────────────────────────────────────────
  const transcriptFilename = `${levelIdx}-${subjectIdx}-${courseIdx}-${selected}.txt`;
  const audioFilename = `${levelIdx}-${subjectIdx}-${courseIdx}-${selected}.mp3`;

  // ── Check audio existence ─────────────────────────────────────────────────────
  useEffect(() => {
    setAudioExists(false);
    fetch(`/api/audio?file=${audioFilename}&check=1`)
      .then((r) => r.json())
      .then(({ exists }: { exists: boolean }) => setAudioExists(exists))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, audioVersion]);

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

  // ── Notes context (must be before ambientOverlay JSX) ────────────────────────
  const { createNote: createNoteCtx, openNote, isLoggedIn: notesLoggedIn, getNotesByLesson, folders, createFolder, notes: allNotes } = useNotes();
  const currentLessonKey = `${levelIdx}:${subjectIdx}:${courseIdx}:${selected}`;
  const lessonNotes = getNotesByLesson(currentLessonKey);
  const topicFolder = folders.find((f) => f.name === courseTitle && !f.parentId);
  const lessonNoteCount = topicFolder
    ? allNotes.filter((n) => n.lessonKey === currentLessonKey || n.folderId === topicFolder.id).length
    : lessonNotes.length;

  // ── Ambient overlay ───────────────────────────────────────────────────────────
  const ambientOverlay = (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950" dir="rtl">
      {/* Top bar */}
      <div className="shrink-0 flex items-center gap-1.5 px-3 lg:px-5 py-2.5 lg:py-3 border-b border-neutral-800">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{lesson.title}</p>
          <p className={`text-xs mt-0.5 ${col.text} hidden lg:block`}>الدرس {toAr(selected)} من {toAr(lessons.length - 1)}</p>
        </div>
        <button onClick={() => { setCountdown(null); setSelected((s) => Math.max(s - 1, 0)); }} disabled={selected === 0}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white disabled:opacity-25 transition-colors px-2 lg:px-2.5 py-1.5 rounded-lg hover:bg-neutral-800">
                     <svg className="w-3.5 h-3.5 rotate-180" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 8L6 4l-1 1L8.5 8 5 11l1 1 4.5-4z" /></svg>

          <span className="hidden lg:inline">السابق</span>
        </button>
        {countdown !== null ? (
          <div className="flex items-center gap-1.5 px-2 lg:px-2.5 py-1.5">
            <div className="relative w-5 h-5 shrink-0">
              <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="2" />
                <circle cx="10" cy="10" r="8" fill="none" stroke="white" strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 8}`}
                  strokeDashoffset={`${2 * Math.PI * 8 * (1 - countdown / 5)}`}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-white text-[9px] font-bold">{countdown}</span>
            </div>
            <span className="text-xs text-neutral-300 hidden lg:inline">التالي…</span>
            <button onClick={() => setCountdown(null)} className="text-[11px] text-neutral-400 hover:text-white px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors">
              إلغاء
            </button>
          </div>
        ) : (
          <button onClick={goNext} disabled={selected === lessons.length - 1}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white disabled:opacity-25 transition-colors px-2 lg:px-2.5 py-1.5 rounded-lg hover:bg-neutral-800">
            <span className="hidden lg:inline">التالي</span>
             <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 8L6 4l-1 1L8.5 8 5 11l1 1 4.5-4z" /></svg>
          </button>
        )}
        {transcript.length > 0 && (
          <button onClick={() => setAmbientTranscriptOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors px-2 lg:px-2.5 py-1.5 rounded-lg hover:bg-neutral-800">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="hidden lg:inline">{ambientTranscriptOpen ? "إخفاء النص" : "إظهار النص"}</span>
          </button>
        )}
        {notesLoggedIn && (
          <button onClick={() => setAmbientNotesOpen((v) => !v)}
            className={`flex items-center gap-1.5 text-xs transition-colors px-2 lg:px-2.5 py-1.5 rounded-lg hover:bg-neutral-800 ${ambientNotesOpen ? "text-white" : "text-neutral-400 hover:text-white"}`}>
            <NotebookPenIcon className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{ambientNotesOpen ? "إخفاء الملاحظات" : "الملاحظات"}</span>
          </button>
        )}
        <button onClick={() => setAmbientMode(false)}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* Body — mobile: column stack; desktop: resizable panels */}
      {isMobile ? (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-center justify-center p-2">
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
            {ytId ? <div ref={ambientDivRef} className="w-full h-full" /> : noVideo}
          </div>
        </div>
        {ambientTranscriptOpen && transcript.length > 0 && (
          <div className={ambientNotesOpen ? "h-40 overflow-hidden border-t border-neutral-800 min-h-0" : "flex-1 overflow-hidden border-t border-neutral-800 min-h-0"}>
            <TranscriptPanel segments={transcript} currentTime={currentTime} col={col} onSeek={seekTo} variant="dark" lessonTitle={lesson.title} youtubeUrl={lesson.youtube ?? undefined} />
          </div>
        )}
        {ambientNotesOpen && notesLoggedIn && (
          <div className="flex-1 overflow-hidden border-t border-neutral-800 min-h-0">
            <AmbientNotePanel
              lessonKey={`${levelIdx}:${subjectIdx}:${courseIdx}:${selected}`}
              lessonTitle={lesson.title}
              courseTitle={courseTitle}
              col={col}
              currentTime={currentTime}
              onSeek={seekTo}
            />
          </div>
        )}
      </div>
      ) : (
      <div className="flex flex-1 overflow-hidden" dir="ltr">
        <div className="flex-1 min-w-0 overflow-hidden">
          <ResizablePanelGroup className="h-full">
            <ResizablePanel defaultSize={ambientTranscriptOpen ? 58 : 100} minSize={30}>
              <div dir="rtl" className="flex items-center justify-center p-6 h-full">
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black" style={{ maxHeight: "calc(100vh - 110px)" }}>
                  {ytId ? <div ref={ambientDivRef} className="w-full h-full" /> : noVideo}
                </div>
              </div>
            </ResizablePanel>
            {ambientTranscriptOpen && transcript.length > 0 && (
              <>
                <ResizableHandle className="bg-neutral-800 hover:bg-neutral-600 transition-colors" />
                <ResizablePanel defaultSize={42} minSize={15} maxSize={65}>
                  <div dir="rtl" className="h-full overflow-hidden">
                    <TranscriptPanel segments={transcript} currentTime={currentTime} col={col} onSeek={seekTo} variant="dark" lessonTitle={lesson.title} youtubeUrl={lesson.youtube ?? undefined} />
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
        {ambientNotesOpen && (
          <div dir="rtl" className="w-80 shrink-0 border-l border-neutral-800 overflow-hidden bg-neutral-900">
            <AmbientNotePanel
              lessonKey={`${levelIdx}:${subjectIdx}:${courseIdx}:${selected}`}
              lessonTitle={lesson.title}
              courseTitle={courseTitle}
              col={col}
              currentTime={currentTime}
              onSeek={seekTo}
            />
          </div>
        )}
      </div>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  const [pickerOpen, setPickerOpen] = useState(false);

  async function handleCreateLessonNote() {
    const folderId = topicFolder ? topicFolder.id : await createFolder(courseTitle);
    const id = await createNoteCtx({
      lessonKey: currentLessonKey,
      noteType: "lesson",
      title: lesson.title,
      folderId,
    });
    openNote(id);
    setPickerOpen(false);
  }

  return (
    <>
      {/* Shared grid — desktop: fixed playlist col + fluid video; mobile stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">

        {/* ── Playlist + siblings (right column in RTL) ── */}
        <div className="flex flex-col gap-5 self-start">

          {/* Playlist */}
          <div className="bg-white dark:bg-white/[0.04] rounded-sm border border-stone-100 dark:border-white/[0.08] shadow-sm dark:shadow-none overflow-hidden flex flex-col">
            <div className={`px-4 py-3 ${col.bg} text-white shrink-0`}>
              <p className="text-sm font-semibold">قائمة الدروس</p>
              <p className="text-white/70 text-xs mt-0.5">{lessons.length} {lessonWord(lessons.length)}</p>
            </div>
            {isLoaded && isLoggedIn && (
              <div className="px-4 py-2 border-b border-stone-100 dark:border-white/[0.06] flex items-center gap-2.5">
                <div className="flex-1 h-1.5 bg-stone-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full ${col.bg} rounded-full transition-all duration-500`} style={{ width: `${progressPct}%` }} />
                </div>
                <span className={`text-[11px] font-semibold ${col.text} shrink-0`}>{watchedCount}/{lessons.length}</span>
              </div>
            )}
            {isLoaded && !isLoggedIn && (
              <div className="px-4 py-2 border-b border-stone-100 dark:border-white/[0.06]">
                <SignInDialog trigger={
                  <button className="text-[11px] text-stone-400 hover:text-emerald-600 transition-colors underline underline-offset-2">
                    سجّل دخولك لتتبع تقدمك
                  </button>
                } />
              </div>
            )}
            <div className="divide-y divide-stone-50 dark:divide-white/[0.04] overflow-y-auto" style={{ maxHeight: "min(60vh, 520px)" }}>
              {lessons.map((l, idx) => {
                const isActive = idx === selected;
                const lKey = `${levelIdx}:${subjectIdx}:${courseIdx}:${idx}`;
                return (
                  <button key={idx} onClick={() => setSelected(idx)}
                    className={`w-full text-right px-3.5 py-3 flex items-start gap-2.5 border-r-2 transition-colors ${isActive ? `${col.light} ${col.activeBorder}` : "border-r-transparent hover:bg-stone-50 dark:hover:bg-white/[0.04]"}`}>
                    <div className={`shrink-0 w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center mt-0.5 ${isActive ? `${col.bg} text-white` : "bg-stone-100 dark:bg-white/10 text-stone-400 dark:text-white/40"}`}>
                      {toAr(idx)}
                    </div>
                    <p className={`flex-1 text-xs leading-relaxed text-right ${isActive ? `${col.text} font-semibold` : "text-stone-600 dark:text-white/50"}`}>
                      {stripLeadingNumber(l.title)}
                    </p>
                    <WatchButton lessonKey={lKey} col={col} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Other courses in the same subject */}
          {siblings && siblings.length > 1 && (
            <div>
              <p className="text-xs font-semibold text-stone-400 dark:text-white/30 tracking-widest mb-3">
                مقررات أخرى في {subjectTitle}
              </p>
              <div className="flex flex-col gap-1.5">
                {siblings.map((sib, idx) => {
                  const isActive = idx === courseIdx;
                  return (
                    <Link
                      key={idx}
                      href={`/level/${levelIdx}/${subjectIdx}/${idx}`}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        isActive
                          ? `${col.light} ${col.border} ${col.text}`
                          : "bg-white dark:bg-white/[0.04] border-stone-100 dark:border-white/[0.08] text-stone-600 dark:text-white/50 hover:border-stone-200 dark:hover:border-white/[0.15] hover:shadow-sm dark:hover:bg-white/[0.08]"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0 ${isActive ? `${col.bg} text-white` : "bg-stone-100 dark:bg-white/10 text-stone-400 dark:text-white/40"}`}>
                        {idx + 1}
                      </span>
                      <span className="flex-1 truncate">{stripLeadingNumber(sib.title)}</span>
                      <span className="text-xs opacity-60">{sib.files.length} {lessonWord(sib.files.length)}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Video panel (left column in RTL) ── */}
        <div className="flex flex-col gap-3">

          {/* 1. Video */}
          <div className="group relative aspect-video bg-stone-900 rounded-none lg:rounded-xl overflow-hidden shadow-lg lg:ring-1 ring-black/5 max-lg:-mx-4">
            {ytId ? <div ref={mainDivRef} className="w-full h-full" /> : noVideo}
            {ytId && (
              <button onClick={() => { ambientStartAtRef.current = Math.floor(currentTime); setAmbientMode(true); }}
                className="absolute top-2.5 left-2.5 flex items-center gap-1.5 text-[11px] font-medium text-white bg-black/50 hover:bg-black/70 rounded-lg px-2.5 py-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
                <span className="hidden lg:inline">وضع الانغماس</span>
              </button>
            )}
            {/* Next-lesson countdown overlay */}
            {countdown !== null && (
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-t from-black/85 to-transparent" dir="rtl">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-8 h-8 shrink-0">
                    <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                      <circle cx="16" cy="16" r="13" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="2.5" />
                      <circle cx="16" cy="16" r="13" fill="none" stroke="white" strokeWidth="2.5"
                        strokeDasharray={`${2 * Math.PI * 13}`}
                        strokeDashoffset={`${2 * Math.PI * 13 * (1 - countdown / 5)}`}
                        className="transition-all duration-1000 ease-linear"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-white text-[11px] font-bold">{countdown}</span>
                  </div>
                  <span className="text-white text-xs font-medium">الانتقال للدرس التالي…</span>
                </div>
                <button
                  onClick={() => setCountdown(null)}
                  className="text-white/70 hover:text-white text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors shrink-0"
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>

          {/* 2. Transcript (collapsible) */}
          {transcript.length > 0 && (
            <div>
              <button onClick={() => setTranscriptOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 bg-white dark:bg-white/[0.04] border border-stone-100 dark:border-white/[0.08] rounded-xl px-4 py-2.5 shadow-sm dark:shadow-none hover:bg-stone-50 dark:hover:bg-white/[0.08] transition-colors">
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-stone-400 dark:text-white/35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="text-xs font-semibold text-stone-500 dark:text-white/35">النص</span>
                </div>
                <svg className={`w-3.5 h-3.5 text-stone-400 dark:text-white/35 transition-transform ${transcriptOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {transcriptOpen && (
                <div className="mt-1.5" style={{ height: "260px" }}>
                  <TranscriptPanel segments={transcript} currentTime={currentTime} col={col} onSeek={seekTo} lessonTitle={lesson.title} youtubeUrl={lesson.youtube ?? undefined} />
                </div>
              )}
            </div>
          )}

          {/* 3. Prev / Next */}
          <div className="flex justify-between gap-3">
            <button onClick={goNext} disabled={selected === lessons.length - 1}
              className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-white/[0.04] border border-stone-100 dark:border-white/[0.08] rounded-xl py-2.5 text-xs font-medium text-stone-500 dark:text-white/40 hover:bg-stone-50 dark:hover:bg-white/[0.08] hover:text-stone-700 dark:hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm dark:shadow-none">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 8L6 4l-1 1L8.5 8 5 11l1 1 4.5-4z" /></svg>
              الدرس التالي
            </button>
            <button onClick={() => setSelected((s) => Math.max(s - 1, 0))} disabled={selected === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-white/[0.04] border border-stone-100 dark:border-white/[0.08] rounded-xl py-2.5 text-xs font-medium text-stone-500 dark:text-white/40 hover:bg-stone-50 dark:hover:bg-white/[0.08] hover:text-stone-700 dark:hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm dark:shadow-none">
              الدرس السابق
              <svg className="w-4 h-4 rotate-180" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 8L6 4l-1 1L8.5 8 5 11l1 1 4.5-4z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Lesson notes FAB + picker ── */}
      {notesLoggedIn && (
        <>
          {/* Backdrop to close picker */}
          {pickerOpen && (
            <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
          )}

          {/* Notes picker popup */}
          {pickerOpen && (
            <div className="fixed bottom-24 right-6 z-50 bg-white rounded-xl shadow-2xl border border-stone-100 w-64 overflow-hidden" dir="rtl">
              <div className="px-3 py-2.5 border-b border-stone-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700">ملاحظات الدرس</span>
                <button onClick={() => setPickerOpen(false)} className="p-0.5 text-stone-300 hover:text-stone-600">
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="max-h-52 overflow-y-auto py-1">
                {(topicFolder
                  ? allNotes.filter((n) => n.lessonKey === currentLessonKey || n.folderId === topicFolder.id)
                  : lessonNotes
                ).map((note) => (
                  <button
                    key={note.id}
                    onClick={() => { openNote(note.id); setPickerOpen(false); }}
                    className="w-full text-right px-3 py-2 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 transition-colors"
                  >
                    <NotebookPenIcon className="w-3 h-3 text-stone-300 shrink-0" />
                    <span className="truncate">{note.title}</span>
                  </button>
                ))}
                {lessonNoteCount === 0 && (
                  <p className="px-3 py-4 text-xs text-stone-400 text-center">لا توجد ملاحظات لهذا الدرس بعد</p>
                )}
              </div>
              <div className="border-t border-stone-100 p-2">
                <button
                  onClick={handleCreateLessonNote}
                  className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-white ${col.bg} transition-colors`}
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  ملاحظة جديدة
                </button>
              </div>
            </div>
          )}

          {/* FAB */}
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 ${col.bg} text-white`}
            aria-label="ملاحظات الدرس"
          >
            <NotebookPenIcon className="w-4 h-4" />
            <span className="text-sm font-medium">ملاحظات</span>
            {lessonNoteCount > 0 && (
              <span className="bg-white/25 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {lessonNoteCount}
              </span>
            )}
          </button>
        </>
      )}

      {mounted && ambientMode && createPortal(ambientOverlay, document.body)}
      <TranscriptUploadButton
        filename={transcriptFilename}
        onSaved={() => setTranscriptVersion((v) => v + 1)}
      />
      <AudioUploadButton
        filename={audioFilename}
        onSaved={() => setAudioVersion((v) => v + 1)}
      />
    </>
  );
}
