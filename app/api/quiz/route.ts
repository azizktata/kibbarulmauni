import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { resolve } from "path";
import { auth } from "@/auth";
import { apiError } from "@/lib/apiError";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

export type QuizQuestion = {
  text: string;
  options: string[];
  correct: number;
};

function quizPath(file: string) {
  return resolve(process.cwd(), "data/quizzes", `${file}.json`);
}

function isValidFile(file: string) {
  return /^\d+-\d+-\d+-\d+$/.test(file);
}

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const file = req.nextUrl.searchParams.get("file");
  if (!file || !isValidFile(file))
    return NextResponse.json({ questions: [] }, { status: 400 });

  try {
    const raw = readFileSync(quizPath(file), "utf8");
    const { questions } = JSON.parse(raw) as { questions: QuizQuestion[] };
    return NextResponse.json(
      { questions },
      { headers: { "Netlify-CDN-Cache-Control": "no-store", "Cache-Control": "private, max-age=300" } }
    );
  } catch {
    return NextResponse.json(
      { questions: [] },
      { status: 404, headers: { "Netlify-CDN-Cache-Control": "no-store" } }
    );
  }
}

// ── POST ───────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!ADMIN_EMAIL || session?.user?.email !== ADMIN_EMAIL)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { file, questions } = (await req.json()) as { file: string; questions: QuizQuestion[] };

  if (!file || !isValidFile(file))
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });

  if (!Array.isArray(questions) || questions.length === 0)
    return NextResponse.json({ error: "questions required" }, { status: 400 });

  for (const q of questions) {
    if (!q.text?.trim()) return NextResponse.json({ error: "Question text required" }, { status: 400 });
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6)
      return NextResponse.json({ error: "Each question needs 2–6 options" }, { status: 400 });
    if (typeof q.correct !== "number" || q.correct < 0 || q.correct >= q.options.length)
      return NextResponse.json({ error: "Invalid correct index" }, { status: 400 });
  }

  try {
    writeFileSync(quizPath(file), JSON.stringify({ questions }, null, 2), "utf8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("quiz POST", err);
  }
}

// ── DELETE ─────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!ADMIN_EMAIL || session?.user?.email !== ADMIN_EMAIL)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const file = req.nextUrl.searchParams.get("file");
  if (!file || !isValidFile(file))
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });

  try {
    unlinkSync(quizPath(file));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // already gone
  }
}
