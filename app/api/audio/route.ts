import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { auth } from "@/auth";
import { apiError } from "@/lib/apiError";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
const AUDIO_DIR = resolve(process.cwd(), "data/audio");

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const file = searchParams.get("file");

  if (!file || !/^[\w\-]+\.mp3$/.test(file)) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  try {
    const filePath = resolve(AUDIO_DIR, file);
    const exists = existsSync(filePath);

    if (searchParams.get("check") === "1") {
      return NextResponse.json({ exists });
    }

    if (!exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const name = searchParams.get("name") || file;
    const buffer = readFileSync(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    return apiError("audio GET", err);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!ADMIN_EMAIL || session?.user?.email !== ADMIN_EMAIL)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  const MAX_AUDIO_BYTES = 150 * 1024 * 1024; // 150 MB
  if (contentLength > MAX_AUDIO_BYTES)
    return NextResponse.json({ error: "File too large" }, { status: 413 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const filename = formData.get("filename") as string | null;

  if (!file || !filename || !/^[\w\-]+\.mp3$/.test(filename)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (file.size > MAX_AUDIO_BYTES)
    return NextResponse.json({ error: "File too large" }, { status: 413 });

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    mkdirSync(AUDIO_DIR, { recursive: true });
    writeFileSync(resolve(AUDIO_DIR, filename), buffer);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("audio POST", err);
  }
}
