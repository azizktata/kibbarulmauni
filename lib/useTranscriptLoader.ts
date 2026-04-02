"use client";

import { useState, useEffect } from "react";
import type { TranscriptSegment } from "@/lib/data";

export function useTranscriptLoader(
  selected: number,
  transcriptFilename: string | null,
  transcriptVersion: number
): { transcript: TranscriptSegment[]; transcriptLoading: boolean } {



  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    
    setTranscript([]);

    if (!transcriptFilename) return () => controller.abort();

    setTranscriptLoading(true);
    fetch(`/api/transcript?file=${transcriptFilename}`, { signal })
      .then((r) => r.json())
      .then(({ segments }: { segments: TranscriptSegment[] }) => {
        if (!signal.aborted && segments.length > 0) setTranscript(segments);
      })
      .catch((err) => { if (err?.name === "AbortError") return; })
      .finally(() => { if (!signal.aborted) setTranscriptLoading(false); });

    return () => controller.abort();
  }, [selected, transcriptFilename, transcriptVersion]);

  return { transcript, transcriptLoading };
}
