"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import type { TranscriptSegment } from "@/lib/data";
import type { LevelColor } from "@/lib/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  segments: TranscriptSegment[];
  currentTime: number;
  col: LevelColor;
  onSeek?: (time: number) => void;
  variant?: "light" | "dark";
  lessonTitle?: string;
  youtubeUrl?: string;
}

interface Popover {
  x: number;
  y: number;
  cleanText: string;
  timeRange: string;
}

interface ShareData {
  cleanText: string;
  timeRange: string;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function TranscriptPanel({ segments, currentTime, col, onSeek, variant = "light", lessonTitle, youtubeUrl }: Props) {
  const [query, setQuery] = useState("");
  const [popover, setPopover] = useState<Popover | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [copied, setCopied] = useState(false);
  const segRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const paraRef = useRef<HTMLParagraphElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);
  const dark = variant === "dark";

  const activeIdx = (() => {
    let idx = -1;
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].start <= currentTime) idx = i;
      else break;
    }
    return idx;
  })();

  const firstMatchIdx = useMemo(() => {
    if (!query.trim()) return -1;
    const q = query.trim().toLowerCase();
    return segments.findIndex(
      (s) => s.text.toLowerCase().includes(q) || fmt(s.start).includes(q)
    );
  }, [segments, query]);

  useEffect(() => {
    const el = segRefs.current.get(firstMatchIdx);
    const container = containerRef.current;
    if (firstMatchIdx < 0 || !el || !container) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const newScrollTop = container.scrollTop + (elRect.top - containerRect.top) - container.clientHeight / 2;
    container.scrollTo({ top: newScrollTop, behavior: "smooth" });
  }, [firstMatchIdx]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onUserScroll = () => { userScrolledRef.current = true; };
    el.addEventListener("wheel", onUserScroll, { passive: true });
    el.addEventListener("touchstart", onUserScroll, { passive: true });
    return () => {
      el.removeEventListener("wheel", onUserScroll);
      el.removeEventListener("touchstart", onUserScroll);
    };
  }, []);

  // Reset user-scroll lock when a new lesson's segments load
  useEffect(() => {
    userScrolledRef.current = false;
  }, [segments]);

  useEffect(() => {
    if (query) return;
    if (userScrolledRef.current) return;
    if (activeIdx < 0) return;

    // Scroll to 3 segments ahead so the active line sits near the top
    // with upcoming text visible below it
    const lookAheadIdx = Math.min(activeIdx + 4, segments.length - 1);
    const targetEl = segRefs.current.get(lookAheadIdx) ?? segRefs.current.get(activeIdx);
    const container = containerRef.current;
    if (!targetEl || !container) return;

    // Scroll only the transcript container — never the page
    const containerRect = container.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const newScrollTop = container.scrollTop + (targetRect.bottom - containerRect.bottom);
    container.scrollTo({ top: newScrollTop, behavior: "smooth" });
  }, [activeIdx, query, segments.length]);

  // ── Text selection ────────────────────────────────────────────────────────────
  function handleMouseUp() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !paraRef.current?.contains(sel.anchorNode)) {
      setPopover(null);
      return;
    }
    const range = sel.getRangeAt(0);

    const fragment = range.cloneContents();
    fragment.querySelectorAll("button").forEach((b) => b.remove());
    const cleanText = fragment.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (!cleanText) { setPopover(null); return; }

    const intersected: number[] = [];
    segRefs.current.forEach((el, idx) => {
      if (range.intersectsNode(el)) intersected.push(idx);
    });
    intersected.sort((a, b) => a - b);
    let timeRange = "";
    if (intersected.length > 0) {
      const first = segments[intersected[0]];
      const last = segments[intersected[intersected.length - 1]];
      timeRange = `${fmt(first.start)} – ${fmt(last.start + (last.dur || 0))}`;
    }

    const rect = range.getBoundingClientRect();
    setPopover({ x: rect.left + rect.width / 2, y: rect.top - 8, cleanText, timeRange });
  }

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (popoverRef.current?.contains(e.target as Node)) return;
      setPopover(null);
    }
    if (popover) {
      document.addEventListener("mousedown", onMouseDown);
      return () => document.removeEventListener("mousedown", onMouseDown);
    }
  }, [popover]);

  // ── Actions ───────────────────────────────────────────────────────────────────
  async function copyClean() {
    if (!popover) return;
    await navigator.clipboard.writeText(popover.cleanText);
    setPopover(null);
    window.getSelection()?.removeAllRanges();
  }

  function openShare() {
    if (!popover) return;
    setShareData({ cleanText: popover.cleanText, timeRange: popover.timeRange });
    setShareOpen(true);
    setPopover(null);
    window.getSelection()?.removeAllRanges();
  }

  function buildPlainText(d: ShareData) {
    const meta = [
      lessonTitle ?? "",
      [youtubeUrl ? `[يوتيوب](${youtubeUrl})` : "", d.timeRange ? `(${d.timeRange})` : ""]
        .filter(Boolean).join(" "),
    ].filter(Boolean).join("\n");

    return [d.cleanText, "", meta].filter((s, i, arr) => !(s === "" && arr[i - 1] === "")).join("\n").trim();
  }

  async function copyShare() {
    if (!shareData) return;
    await navigator.clipboard.writeText(buildPlainText(shareData));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // ── Popover ───────────────────────────────────────────────────────────────────
  const popoverEl = popover && (
    <div
      ref={popoverRef}
      style={{ position: "fixed", left: popover.x, top: popover.y, transform: "translate(-50%, -100%)", zIndex: 9999 }}
    >
      <div className={`flex items-center gap-0.5 rounded-full shadow-lg border px-1 py-1 ${dark ? "bg-neutral-800 border-neutral-700" : "bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700"}`}>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={copyClean}
          className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-full transition-colors ${dark ? "text-neutral-300 hover:bg-neutral-700" : "text-stone-600 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-neutral-700"}`}
        >
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          نسخ
        </button>
        <div className={`w-px h-4 ${dark ? "bg-neutral-700" : "bg-stone-200 dark:bg-neutral-700"}`} />
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={openShare}
          className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-full transition-colors ${dark ? "text-neutral-300 hover:bg-neutral-700" : "text-stone-600 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-neutral-700"}`}
        >
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          مشاركة
        </button>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className={`rounded-xl border shadow-sm overflow-hidden h-full flex flex-col ${
        dark ? "bg-neutral-900 border-neutral-800" : "bg-white dark:bg-neutral-900 border-stone-100 dark:border-neutral-800"
      }`}>
        {/* Header */}
        <div className={`px-4 py-2.5 border-b flex items-center gap-2 shrink-0 ${dark ? "border-neutral-800" : "border-stone-100 dark:border-neutral-800"}`}>
          {dark && (
            <>
              <svg className="w-3.5 h-3.5 shrink-0 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p className="text-xs font-semibold flex-1 text-neutral-400">النص</p>
            </>
          )}
          {!dark && <span className="flex-1" />}
          <div className="relative">
            <svg className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${dark ? "text-neutral-600" : "text-stone-300 dark:text-neutral-600"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="بحث..." dir="rtl"
              className={`text-xs rounded-lg border pr-6 pl-2 py-1 w-32 focus:outline-none focus:ring-1 placeholder:opacity-40 ${
                dark ? "bg-neutral-800 border-neutral-700 text-neutral-200 focus:ring-neutral-600"
                     : "bg-stone-50 dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 text-stone-700 dark:text-neutral-200 focus:ring-stone-300 dark:focus:ring-neutral-600"
              }`}
            />
          </div>
        </div>

        {/* Body */}
        <div ref={containerRef} className={`overflow-y-auto px-4 py-3 flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full ${dark ? "[&::-webkit-scrollbar-track]:bg-neutral-900 [&::-webkit-scrollbar-thumb]:bg-neutral-600" : "[&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-200 dark:[&::-webkit-scrollbar-track]:bg-neutral-900 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-600"}`}>
          <p ref={paraRef} onMouseUp={handleMouseUp} className={`text-sm leading-loose ${dark ? "text-neutral-300" : "text-stone-600 dark:text-neutral-300"}`} dir="rtl">
            {segments.map((seg, idx) => {
              const isActive = idx === activeIdx;
              const isMatch = idx === firstMatchIdx;
              return (
                <span
                  key={idx}
                  ref={(el) => { if (el) segRefs.current.set(idx, el); else segRefs.current.delete(idx); }}
                  className={
                    isActive ? `${col.light} ${col.text} rounded px-0.5 font-medium transition-colors`
                    : isMatch ? "bg-yellow-100 text-yellow-900 rounded px-0.5 transition-colors"
                    : undefined
                  }
                >
                  <button
                    onClick={() => { userScrolledRef.current = false; onSeek?.(seg.start); }}
                    className={`font-mono text-[10px] tabular-nums rounded px-1 py-0.5 mx-1 transition-colors align-middle leading-none ${
                      dark ? "bg-neutral-700 hover:bg-neutral-600 text-neutral-400"
                           : "bg-stone-100 dark:bg-neutral-700 hover:bg-stone-200 dark:hover:bg-neutral-600 text-stone-400 dark:text-neutral-400"
                    }`}
                    style={{ direction: "ltr" }}
                  >
                    {fmt(seg.start)}
                  </button>
                  {seg.text}{" "}
                </span>
              );
            })}
          </p>
        </div>
      </div>

      {/* Floating selection popover */}
      {typeof document !== "undefined" && popoverEl && createPortal(popoverEl, document.body)}

      {/* Share dialog */}
      <Dialog open={shareOpen} onOpenChange={(v) => { setShareOpen(v); if (!v) setCopied(false); }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-base">مشاركة المقتطف</DialogTitle>
          </DialogHeader>

          {shareData && (
            <div className="rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              {/* Quote body */}
              <div className="px-5 pt-5 pb-4 bg-white relative">
                {/* Decorative quote mark */}
                <svg className="absolute top-4 left-4 w-8 h-8 text-stone-100" viewBox="0 0 32 32" fill="currentColor" aria-hidden>
                  <path d="M10 8C6.7 8 4 10.7 4 14v10h10V14H7.9C8.4 11.6 10 9.8 12 9L10 8zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-6.1c.5-2.4 2.1-4.2 4.1-5L24 8z"/>
                </svg>
                <p dir="rtl" className="text-sm leading-relaxed text-stone-800 font-medium relative z-10">
                  {shareData.cleanText}
                </p>
              </div>

              {/* Signature footer */}
              <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  {lessonTitle && (
                    <p className="text-xs font-semibold text-stone-700 truncate">{lessonTitle}</p>
                  )}
                  {youtubeUrl && (
                    <a
                      href={youtubeUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-red-500 transition-colors w-fit"
                    >
                      <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 14" fill="currentColor">
                        <path d="M19.6 2.2C19.4 1.4 18.8.8 18 .6 16.4.2 10 .2 10 .2S3.6.2 2 .6C1.2.8.6 1.4.4 2.2 0 3.8 0 7 0 7s0 3.2.4 4.8c.2.8.8 1.4 1.6 1.6C3.6 13.8 10 13.8 10 13.8s6.4 0 8-.4c.8-.2 1.4-.8 1.6-1.6.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM8 10V4l5.3 3L8 10z"/>
                      </svg>
                      يوتيوب
                    </a>
                  )}
                </div>
                {shareData.timeRange && (
                  <div className="shrink-0 flex items-center gap-1.5 text-[11px] text-stone-500 bg-stone-100 rounded-lg px-2.5 py-1.5 font-mono" style={{ direction: "ltr" }}>
                    <svg className="w-3 h-3 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                    {shareData.timeRange}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-stone-400">سيتم نسخ النص بصيغة نصية</p>
            <button
              onClick={copyShare}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-800 hover:bg-stone-700 text-white"
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M20 6 9 17l-5-5"/></svg>
                  تم النسخ
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  نسخ النص
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
