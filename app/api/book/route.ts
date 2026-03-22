import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { auth } from "@/auth";
import { apiError } from "@/lib/apiError";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!ADMIN_EMAIL || session?.user?.email !== ADMIN_EMAIL)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { lessonKey, book } = (await req.json()) as { lessonKey: string; book: string };

  // Validate lessonKey format: "N:N:N:N"
  if (!/^\d+:\d+:\d+:\d+$/.test(lessonKey))
    return NextResponse.json({ error: "Invalid lessonKey" }, { status: 400 });

  // Validate book URL (empty string = remove link)
  if (book && !/^https?:\/\/.+/.test(book))
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });

  const [lIdx, sIdx, cIdx, fIdx] = lessonKey.split(":").map(Number);

  try {
    const filePath = resolve(process.cwd(), "data/kibbarulmauni.json");
    const data = JSON.parse(readFileSync(filePath, "utf8"));

    const lesson = data[lIdx]?.subjects[sIdx]?.courses[cIdx]?.files[fIdx];
    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

    if (book) {
      lesson.book = book;
    } else {
      delete lesson.book;
    }

    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("book POST", err);
  }
}
