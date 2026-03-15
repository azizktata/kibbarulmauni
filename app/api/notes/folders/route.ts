import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createFolder } from "@/db/queries";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { name, parentId } = await req.json() as {
    name: string;
    parentId?: string | null;
  };

  if (!name?.trim())
    return NextResponse.json({ error: "name required" }, { status: 400 });

  const id = await createFolder(session.user.id, name.trim(), parentId ?? null);
  return NextResponse.json({ id });
}
