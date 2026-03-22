"use client";

import { useState, useEffect } from "react";
import type { TranscriptSegment } from "@/lib/data";

export function useTranscriptLoader(
  selected: number,
  ytId: string | null,
  transcriptFilename: string,
  transcriptVersion: number
): { transcript: TranscriptSegment[]; transcriptLoading: boolean } {
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    setTranscript([]);
    setTranscriptLoading(true);

    const loadFile = () => {
      fetch(`/api/transcript?file=${transcriptFilename}`, { signal })
        .then((r) => r.json())
        .then(({ segments }: { segments: TranscriptSegment[] }) => {
          if (segments.length > 0) setTranscript(segments);
        })
        .catch((err) => { if (err?.name === "AbortError") return; })
        .finally(() => { if (!signal.aborted) setTranscriptLoading(false); });
    };

    if (!ytId) { loadFile(); return () => controller.abort(); }

    fetch(`/api/transcript?v=${ytId}`, { cache: "no-cache", signal })
      .then((r) => r.json())
      .then(({ segments }: { segments: TranscriptSegment[] }) => {
        if (segments.length > 0) { setTranscript(segments); setTranscriptLoading(false); }
        else loadFile();
      })
      .catch((err) => { if (err?.name !== "AbortError") loadFile(); });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, transcriptVersion]);

  return { transcript, transcriptLoading };
}
