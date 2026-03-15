"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { TranscriptSegment } from "@/lib/data";
import type { LevelColor } from "@/lib/constants";

interface Props {
  segments: TranscriptSegment[];
  currentTime: number;
  col: LevelColor;
  onSeek?: (time: number) => void;
  variant?: "light" | "dark";
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function TranscriptPanel({ segments, currentTime, col, onSeek, variant = "light" }: Props) {
  const [query, setQuery] = useState("");
  const segRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const dark = variant === "dark";

  // "last segment that has started" — robust regardless of dur values
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

  // Scroll to search match
  useEffect(() => {
    if (firstMatchIdx >= 0) {
      segRefs.current.get(firstMatchIdx)?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [firstMatchIdx]);

  // Scroll active segment into view when not searching
  useEffect(() => {
    if (query) return;
    if (activeIdx >= 0) {
      segRefs.current.get(activeIdx)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeIdx, query]);

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden h-full flex flex-col ${
      dark ? "bg-neutral-900 border-neutral-800" : "bg-white border-stone-100"
    }`}>
      {/* Header */}
      <div className={`px-4 py-2.5 border-b flex items-center gap-2 shrink-0 ${
        dark ? "border-neutral-800" : "border-stone-100"
      }`}>
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
          <svg className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${dark ? "text-neutral-600" : "text-stone-300"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث..."
            dir="rtl"
            className={`text-xs rounded-lg border pr-6 pl-2 py-1 w-32 focus:outline-none focus:ring-1 placeholder:opacity-40 ${
              dark
                ? "bg-neutral-800 border-neutral-700 text-neutral-200 focus:ring-neutral-600"
                : "bg-stone-50 border-stone-200 text-stone-700 focus:ring-stone-300"
            }`}
          />
        </div>
      </div>

      {/* Paragraph body */}
      <div className={`overflow-y-auto px-4 py-3 flex-1 ${dark ? "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-neutral-900 [&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full" : ""}`}>
        <p className={`text-sm leading-loose ${dark ? "text-neutral-300" : "text-stone-600"}`} dir="rtl">
          {segments.map((seg, idx) => {
            const isActive = idx === activeIdx;
            const isMatch = idx === firstMatchIdx;
            return (
              <span
                key={idx}
                ref={(el) => {
                  if (el) segRefs.current.set(idx, el);
                  else segRefs.current.delete(idx);
                }}
                className={
                  isActive
                    ? `${col.light} ${col.text} rounded px-0.5 font-medium transition-colors`
                    : isMatch
                    ? "bg-yellow-100 text-yellow-900 rounded px-0.5 transition-colors"
                    : undefined
                }
              >
                <button
                  onClick={() => onSeek?.(seg.start)}
                  className={`font-mono text-[10px] tabular-nums rounded px-1 py-0.5 mx-1 transition-colors align-middle leading-none ${
                    dark
                      ? "bg-neutral-700 hover:bg-neutral-600 text-neutral-400"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-400"
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
  );
}
