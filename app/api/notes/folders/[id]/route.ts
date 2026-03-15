import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateFolder, deleteFolder } from "@/db/queries";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await params;
  const fields = await req.json() as {
    name?: string;
    parentId?: string | null;
    sortOrder?: number;
  };

  await updateFolder(id, session.user.id, fields);
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
  await deleteFolder(id, session.user.id);
  return NextResponse.json({ ok: true });
}
