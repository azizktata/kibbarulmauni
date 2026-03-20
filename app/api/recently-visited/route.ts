import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRecentlyVisited, upsertRecentlyVisited } from "@/db/queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ keys: [] });
  const keys = await getRecentlyVisited(session.user.id);
  return NextResponse.json({ keys });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  const { lessonKey } = await req.json();
  if (!lessonKey) return NextResponse.json({ ok: false }, { status: 400 });
  await upsertRecentlyVisited(session.user.id, lessonKey);
  return NextResponse.json({ ok: true });
}
