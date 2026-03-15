import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import type { TranscriptSegment } from "@/lib/data";
import { auth } from "@/auth";

const ADMIN_EMAIL = "azizktata77@gmail.com";

// ── YouTube captions (timedtext API) ──────────────────────────────────────────

interface TimedTextEvent {
  tStartMs: number;
  dDurationMs?: number;
  segs?: { utf8: string }[];
}

async function fetchCaptions(videoId: string, lang: string): Promise<TranscriptSegment[] | null> {
  const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) return null;

  const json = (await res.json()) as { events?: TimedTextEvent[] };
  if (!json.events?.length) return null;

  return json.events
    .filter((e) => e.segs)
    .map((e) => ({
      start: e.tStartMs / 1000,
      dur: (e.dDurationMs ?? 0) / 1000,
      text: e.segs!.map((s) => s.utf8).join("").replace(/\n/g, " ").trim(),
    }))
    .filter((s) => s.text);
}

// ── Raw file parser (M:SS) format ─────────────────────────────────────────────

function parseRawTranscript(raw: string): TranscriptSegment[] {
  const regex = /\((\d+):(\d{2})\)\s*([\s\S]*?)(?=\(\d+:\d{2}\)|$)/g;
  const matches = [...raw.matchAll(regex)];
  const segments: TranscriptSegment[] = [];

  for (let i = 0; i < matches.length; i++) {
    const [, min, sec, rawText] = matches[i];
    const start = parseInt(min) * 60 + parseInt(sec);
    const text = rawText.trim().replace(/\s+/g, " ");
    if (!text) continue;

    const nextStart =
      i + 1 < matches.length
        ? parseInt(matches[i + 1][1]) * 60 + parseInt(matches[i + 1][2])
        : start + 5;

    segments.push({ start, dur: nextStart - start, text });
  }

  return segments;
}

// ── POST — admin upload ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { file, content } = (await req.json()) as { file: string; content: string };
  if (!/^[\w\-]+\.txt$/.test(file))
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });

  const filePath = resolve(process.cwd(), "data/transcripts", file);
  writeFileSync(filePath, content, "utf8");
  return NextResponse.json({ ok: true });
}

// ── GET handler ────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const videoId = searchParams.get("v");
  const file = searchParams.get("file");

  // File-based transcript
  if (file) {
    // Prevent path traversal — only allow safe filenames
    if (!/^[\w\-]+\.txt$/.test(file)) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }
    try {
      const filePath = resolve(process.cwd(), "data/transcripts", file);
      const raw = readFileSync(filePath, "utf8");
      const segments = parseRawTranscript(raw);
      return NextResponse.json(
        { segments },
        { headers: { "Cache-Control": "public, max-age=86400" } }
      );
    } catch {
      return NextResponse.json({ segments: [] }, { status: 404 });
    }
  }

  // YouTube captions
  if (!videoId) {
    return NextResponse.json({ error: "Missing v or file param" }, { status: 400 });
  }

  try {
    const segments =
      (await fetchCaptions(videoId, "ar")) ??
      (await fetchCaptions(videoId, "en")) ??
      [];

    return NextResponse.json(
      { segments },
      { headers: { "Cache-Control": "public, max-age=86400" } }
    );
  } catch {
    return NextResponse.json(
      { segments: [] },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  }
}
