import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateFolder, deleteFolder, getFolders } from "@/db/queries";
import { apiError } from "@/lib/apiError";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
    const { id } = await params;
    const fields = await req.json() as {
      name?: string;
      parentId?: string | null;
      sortOrder?: number;
    };

    if (fields.parentId != null) {
      // Prevent self-reference
      if (fields.parentId === id)
        return NextResponse.json({ error: "invalid parentId" }, { status: 400 });

      // Verify parentId belongs to this user and detect cycles
      const allFolders = await getFolders(session.user.id);
      const folderMap = new Map(allFolders.map((f) => [f.id, f]));

      if (!folderMap.has(fields.parentId))
        return NextResponse.json({ error: "invalid parentId" }, { status: 400 });

      // Walk ancestor chain from parentId — fail if we encounter `id` (cycle)
      let cursor: string | null = fields.parentId;
      while (cursor !== null) {
        const parent = folderMap.get(cursor);
        if (!parent) break;
        if (parent.id === id)
          return NextResponse.json({ error: "cycle detected" }, { status: 400 });
        cursor = parent.parentId;
      }
    }

    await updateFolder(id, session.user.id, fields);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("notes/folders/[id] PATCH", err);
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
    await deleteFolder(id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("notes/folders/[id] DELETE", err);
  }
}
