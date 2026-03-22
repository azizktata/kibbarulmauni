import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getNoteContent, updateNote, deleteNote, folderBelongsToUser } from "@/db/queries";
import { apiError } from "@/lib/apiError";

const VALID_TYPES = new Set(["lesson", "concept", "revision"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
    const { id } = await params;
    const result = await getNoteContent(id, session.user.id);
    if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (err) {
    return apiError("notes/[id] GET", err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
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

    if (body.lessonKey && !/^\d+:\d+:\d+:\d+$/.test(body.lessonKey) && !/^playlist:[A-Za-z0-9_-]+:\d+$/.test(body.lessonKey))
      return NextResponse.json({ error: "invalid lessonKey" }, { status: 400 });

    if (body.noteType && !VALID_TYPES.has(body.noteType))
      return NextResponse.json({ error: "invalid noteType" }, { status: 400 });

    if (typeof body.title === "string" && body.title.length > 200)
      return NextResponse.json({ error: "title too long" }, { status: 400 });

    if (typeof body.content === "string" && body.content.length > 100_000)
      return NextResponse.json({ error: "content too long" }, { status: 400 });

    if (body.folderId) {
      const owned = await folderBelongsToUser(body.folderId, session.user.id);
      if (!owned) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    await updateNote(id, session.user.id, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("notes/[id] PATCH", err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
    const { id } = await params;
    await deleteNote(id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("notes/[id] DELETE", err);
  }
}
