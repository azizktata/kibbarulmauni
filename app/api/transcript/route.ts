import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import type { TranscriptSegment } from "@/lib/data";
import { auth } from "@/auth";
import { apiError } from "@/lib/apiError";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

// ── YouTube captions via Android InnerTube API ────────────────────────────────
// Uses the Android client context which returns caption track URLs accessible server-side.

const YT_CLIENT_VERSION = "20.10.38";
const YT_USER_AGENT = `com.google.android.youtube/${YT_CLIENT_VERSION} (Linux; U; Android 14)`;

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

function parseTimedTextXml(xml: string): TranscriptSegment[] {
  // Try <p t="..." d="..."> format (timedtext format 3)
  const segs: TranscriptSegment[] = [];
  const pRe = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let m: RegExpExecArray | null;
  while ((m = pRe.exec(xml)) !== null) {
    const start = parseInt(m[1], 10);
    const dur = parseInt(m[2], 10);
    let text = "";
    // Extract <s> segments if present
    const sRe = /<s[^>]*>([^<]*)<\/s>/g;
    let sm: RegExpExecArray | null;
    while ((sm = sRe.exec(m[3])) !== null) text += sm[1];
    if (!text) text = m[3].replace(/<[^>]+>/g, "");
    text = decodeEntities(text).trim();
    if (text) segs.push({ start: start / 1000, dur: dur / 1000, text });
  }
  if (segs.length) return segs;

  // Fallback: <text start="..." dur="..."> format
  const textRe = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
  while ((m = textRe.exec(xml)) !== null) {
    const text = decodeEntities(m[3]).trim();
    if (text) segs.push({ start: parseFloat(m[1]), dur: parseFloat(m[2]), text });
  }
  return segs;
}

async function fetchYouTubeCaptions(videoId: string): Promise<TranscriptSegment[] | null> {
  // Step 1: get caption tracks via Android InnerTube player API
  const playerRes = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": YT_USER_AGENT },
    body: JSON.stringify({
      context: { client: { clientName: "ANDROID", clientVersion: YT_CLIENT_VERSION } },
      videoId,
    }),
  });
  if (!playerRes.ok) return null;

  const playerData = await playerRes.json() as {
    captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: { languageCode: string; kind?: string; baseUrl: string }[] } };
  };
  const tracks = playerData.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  if (!tracks.length) return null;

  // Step 2: pick best track (Arabic manual → Arabic ASR → English manual → English ASR)
  const pick = (lang: string, asr: boolean) =>
    tracks.find((t) => t.languageCode === lang && (asr ? t.kind === "asr" : t.kind !== "asr")) ??
    (asr ? tracks.find((t) => t.languageCode === lang) : undefined);

  const track = pick("ar", false) ?? pick("ar", true) ?? pick("en", false) ?? pick("en", true) ?? tracks[0];

  // Step 3: fetch the XML caption file
  const capRes = await fetch(track.baseUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!capRes.ok) return null;
  const xml = await capRes.text();
  if (!xml) return null;

  const segs = parseTimedTextXml(xml);
  return segs.length ? segs : null;
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
    const segments = await fetchYouTubeCaptions(videoId) ?? [];
    // Only cache when we actually got segments; empty means captions unavailable or transient error
    // Use "private" so the browser caches per-user but Netlify Edge CDN does NOT cache.
    // "public" caused Netlify to serve one video's captions for all videos because
    // the netlify-vary header only keys on Next.js internal params, not our ?v= param.
    const cc = segments.length > 0 ? "private, max-age=86400" : "no-store";
    return NextResponse.json({ segments }, { headers: { "Cache-Control": cc } });
  } catch {
    return NextResponse.json({ segments: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
