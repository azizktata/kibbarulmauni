import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import type { TranscriptSegment } from "@/lib/data";
import { auth } from "@/auth";
import { apiError } from "@/lib/apiError";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

// ── Raw file parser (M:SS) format ─────────────────────────────────────────────

function parseTimestampToSeconds(raw: string): number {
  const parts = raw.split(":").map(Number);
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  } else {
    const [m, s] = parts;
    return m * 60 + s;
  }
}

// In your route file - parseRawTranscript
function parseRawTranscript(raw: string): TranscriptSegment[] {
  // H:MM:SS must come BEFORE M:SS in alternation to avoid partial match
  const regex = /\((\d+:\d{2}:\d{2}|\d+:\d{2})\)\s*([\s\S]*?)(?=\(\d+:\d{2}:\d{2}\)|\(\d+:\d{2}\)|$)/g;
  const matches = [...raw.matchAll(regex)];
  const segments: TranscriptSegment[] = [];

  for (let i = 0; i < matches.length; i++) {
    const [, timestamp, rawText] = matches[i];
    const start = parseTimestampToSeconds(timestamp);
    const text = rawText.trim().replace(/\s+/g, " ");
    if (!text) continue;

    const nextStart =
      i + 1 < matches.length
        ? parseTimestampToSeconds(matches[i + 1][1])
        : start + 5;

    segments.push({ start, dur: nextStart - start, text });
  }

  return segments;
}
// ── POST — admin upload ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!ADMIN_EMAIL || session?.user?.email !== ADMIN_EMAIL)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const MAX_TRANSCRIPT_BYTES = 500 * 1024; // 500 KB
  const { file, content } = (await req.json()) as { file: string; content: string };
  if (!/^[\w\-]+\.txt$/.test(file))
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });

  if (typeof content !== "string" || Buffer.byteLength(content, "utf8") > MAX_TRANSCRIPT_BYTES)
    return NextResponse.json({ error: "Content too large" }, { status: 413 });

  try {
    const filePath = resolve(process.cwd(), "data/transcripts", file);
    writeFileSync(filePath, content, "utf8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("transcript POST", err);
  }
}

// ── GET handler ────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const file = searchParams.get("file");

  if (!file) return NextResponse.json({ error: "Missing file param" }, { status: 400 });

  if (!/^[\w\-]+\.txt$/.test(file))
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });

  try {
    const filePath = resolve(process.cwd(), "data/transcripts", file);
    const raw = readFileSync(filePath, "utf8");
    const segments = parseRawTranscript(raw);
    return NextResponse.json(
      { segments },
      { headers: {
        "Cache-Control": "private, max-age=86400",
        "Netlify-CDN-Cache-Control": "no-store",
      }}
    );
  } catch {
    return NextResponse.json(
      { segments: [] },
      { status: 404, headers: { "Netlify-CDN-Cache-Control": "no-store" } }
    );
  }
}
