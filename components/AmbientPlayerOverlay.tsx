"use client";

import type { RefObject } from "react";
import type { TranscriptSegment } from "@/lib/data";
import type { LevelColor } from "@/lib/constants";
import { NotebookPenIcon } from "lucide-react";
import { TranscriptPanel } from "./TranscriptPanel";
import { AmbientNotePanel } from "./AmbientNotePanel";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

function toAr(n: number): string {
  return (n + 1).toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

interface Props {
  col: LevelColor;
  lessonTitle: string;
  lessonYoutubeUrl?: string;
  lessonKey: string;
  courseTitle: string;
  selected: number;
  lessonCount: number;
  ytId: string | null;
  transcript: TranscriptSegment[];
  transcriptLoading: boolean;
  currentTime: number;
  countdown: number | null;
  isMobile: boolean;
  ambientTranscriptOpen: boolean;
  ambientNotesOpen: boolean;
  notesLoggedIn: boolean;
  playerDivRef: RefObject<HTMLDivElement | null>;
  noVideo: React.ReactNode;
  onSeek: (t: number) => void;
  onClose: () => void;
  onGoNext: () => void;
  onGoPrev: () => void;
  onCancelCountdown: () => void;
  onToggleTranscript: () => void;
  onToggleNotes: () => void;
}

export function AmbientPlayerOverlay({
  col,
  lessonTitle,
  lessonYoutubeUrl,
  lessonKey,
  courseTitle,
  selected,
  lessonCount,
  ytId,
  transcript,
  transcriptLoading,
  currentTime,
  countdown,
  isMobile,
  ambientTranscriptOpen,
  ambientNotesOpen,
  notesLoggedIn,
  playerDivRef,
  noVideo,
  onSeek,
  onClose,
  onGoNext,
  onGoPrev,
  onCancelCountdown,
  onToggleTranscript,
  onToggleNotes,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950" dir="rtl">
      {/* Top bar */}
      <div className="shrink-0 flex items-center gap-1.5 px-3 lg:px-5 py-2.5 lg:py-3 border-b border-neutral-800">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{lessonTitle}</p>
          <p className={`text-xs mt-0.5 ${col.text} hidden lg:block`}>الدرس {toAr(selected)} من {toAr(lessonCount - 1)}</p>
        </div>
        <button onClick={onGoPrev} disabled={selected === 0}
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
            <button onClick={onCancelCountdown} className="text-[11px] text-neutral-400 hover:text-white px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors">
              إلغاء
            </button>
          </div>
        ) : (
          <button onClick={onGoNext} disabled={selected === lessonCount - 1}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white disabled:opacity-25 transition-colors px-2 lg:px-2.5 py-1.5 rounded-lg hover:bg-neutral-800">
            <span className="hidden lg:inline">التالي</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 8L6 4l-1 1L8.5 8 5 11l1 1 4.5-4z" /></svg>
          </button>
        )}
        {transcript.length > 0 && (
          <button onClick={onToggleTranscript}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors px-2 lg:px-2.5 py-1.5 rounded-lg hover:bg-neutral-800">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="hidden lg:inline">{ambientTranscriptOpen ? "إخفاء النص" : "إظهار النص"}</span>
          </button>
        )}
        {notesLoggedIn && (
          <button onClick={onToggleNotes}
            className={`flex items-center gap-1.5 text-xs transition-colors px-2 lg:px-2.5 py-1.5 rounded-lg hover:bg-neutral-800 ${ambientNotesOpen ? "text-white" : "text-neutral-400 hover:text-white"}`}>
            <NotebookPenIcon className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{ambientNotesOpen ? "إخفاء الملاحظات" : "الملاحظات"}</span>
          </button>
        )}
        <button onClick={onClose}
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
              {ytId ? <div ref={playerDivRef} className="w-full h-full" /> : noVideo}
            </div>
          </div>
          {ambientTranscriptOpen && transcript.length > 0 && (
            <div className={ambientNotesOpen ? "h-40 overflow-hidden border-t border-neutral-800 min-h-0" : "flex-1 overflow-hidden border-t border-neutral-800 min-h-0"}>
              <TranscriptPanel segments={transcript} currentTime={currentTime} col={col} onSeek={onSeek} variant="dark" lessonTitle={lessonTitle} youtubeUrl={lessonYoutubeUrl} />
            </div>
          )}
          {ambientNotesOpen && notesLoggedIn && (
            <div className="flex-1 overflow-hidden border-t border-neutral-800 min-h-0">
              <AmbientNotePanel
                lessonKey={lessonKey}
                lessonTitle={lessonTitle}
                courseTitle={courseTitle}
                col={col}
                currentTime={currentTime}
                onSeek={onSeek}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-hidden" dir="ltr">
          <ResizablePanelGroup className="h-full">
            <ResizablePanel
              defaultSize={ambientTranscriptOpen ? (ambientNotesOpen ? "52%" : "60%") : (ambientNotesOpen ? "65%" : "100%")}
              minSize="30%"
            >
              <div className="flex items-center justify-center p-6 h-full min-w-0">
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black" style={{ maxHeight: "calc(100vh - 110px)" }}>
                  {ytId ? <div ref={playerDivRef} className="w-full h-full" /> : noVideo}
                </div>
              </div>
            </ResizablePanel>
            {ambientTranscriptOpen && (transcript.length > 0 || transcriptLoading) && (
              <>
                <ResizableHandle withHandle className="bg-neutral-800 hover:bg-neutral-600 transition-colors" />
                <ResizablePanel defaultSize={ambientNotesOpen ? "28%" : "40%"} minSize="15%">
                  <div className="h-full flex flex-col min-w-0 overflow-hidden">
                    {transcript.length > 0 ? (
                      <TranscriptPanel segments={transcript} currentTime={currentTime} col={col} onSeek={onSeek} variant="dark" lessonTitle={lessonTitle} youtubeUrl={lessonYoutubeUrl} />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-neutral-600 text-xs">جارٍ تحميل النص…</span>
                      </div>
                    )}
                  </div>
                </ResizablePanel>
              </>
            )}
            {ambientNotesOpen && notesLoggedIn && (
              <>
                <ResizableHandle withHandle className="bg-neutral-800 hover:bg-neutral-600 transition-colors" />
                <ResizablePanel defaultSize="20%" minSize="15%">
                  <div className="h-full flex flex-col min-w-0 overflow-hidden bg-neutral-900">
                    <AmbientNotePanel
                      lessonKey={lessonKey}
                      lessonTitle={lessonTitle}
                      courseTitle={courseTitle}
                      col={col}
                      currentTime={currentTime}
                      onSeek={onSeek}
                    />
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      )}
    </div>
  );
}
