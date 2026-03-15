import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getNoteContent, updateNote, deleteNote } from "@/db/queries";

const VALID_TYPES = new Set(["lesson", "concept", "revision"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await params;
  const result = await getNoteContent(id, session.user.id);
  if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(result);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as {
    title?: string;
    content?: string;
    folderId?: string | null;
    lessonKey?: string | null;
    noteType?: string;
    isPinned?: number;
    sortOrder?: number;
  };

  if (body.lessonKey && !/^\d+:\d+:\d+:\d+$/.test(body.lessonKey))
    return NextResponse.json({ error: "invalid lessonKey" }, { status: 400 });

  if (body.noteType && !VALID_TYPES.has(body.noteType))
    return NextResponse.json({ error: "invalid noteType" }, { status: 400 });

  await updateNote(id, session.user.id, body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await params;
  await deleteNote(id, session.user.id);
  return NextResponse.json({ ok: true });
}
