import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getNoteSummaries, getFolders, createNote } from "@/db/queries";

const VALID_TYPES = new Set(["lesson", "concept", "revision"]);

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ notes: [], folders: [] });

  const [userNotes, userFolders] = await Promise.all([
    getNoteSummaries(session.user.id),
    getFolders(session.user.id),
  ]);
  return NextResponse.json({ notes: userNotes, folders: userFolders });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = await req.json() as {
    title?: string;
    content?: string;
    folderId?: string | null;
    lessonKey?: string | null;
    noteType?: string;
  };

  if (body.lessonKey && !/^\d+:\d+:\d+:\d+$/.test(body.lessonKey) && !/^playlist:[A-Za-z0-9_-]+:\d+$/.test(body.lessonKey))
    return NextResponse.json({ error: "invalid lessonKey" }, { status: 400 });

  if (body.noteType && !VALID_TYPES.has(body.noteType))
    return NextResponse.json({ error: "invalid noteType" }, { status: 400 });

  const id = await createNote(session.user.id, body);
  return NextResponse.json({ id });
}
