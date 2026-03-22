import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getNoteSummaries, getFolders, createNote, folderBelongsToUser } from "@/db/queries";
import { apiError } from "@/lib/apiError";

const VALID_TYPES = new Set(["lesson", "concept", "revision"]);

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ notes: [], folders: [] });

  try {
    const [userNotes, userFolders] = await Promise.all([
      getNoteSummaries(session.user.id),
      getFolders(session.user.id),
    ]);
    return NextResponse.json({ notes: userNotes, folders: userFolders });
  } catch (err) {
    return apiError("notes GET", err);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
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

    if (typeof body.title === "string" && body.title.length > 200)
      return NextResponse.json({ error: "title too long" }, { status: 400 });

    if (typeof body.content === "string" && body.content.length > 100_000)
      return NextResponse.json({ error: "content too long" }, { status: 400 });

    if (body.folderId) {
      const owned = await folderBelongsToUser(body.folderId, session.user.id);
      if (!owned) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const id = await createNote(session.user.id, body);
    return NextResponse.json({ id });
  } catch (err) {
    return apiError("notes POST", err);
  }
}
