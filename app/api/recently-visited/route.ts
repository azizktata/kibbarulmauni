import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRecentlyVisited, upsertRecentlyVisited } from "@/db/queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ entries: [], keys: [] });
  const entries = await getRecentlyVisited(session.user.id);
  // keep `keys` for backward compat with useRecentlyWatched
  return NextResponse.json({ entries, keys: entries.map((e) => e.key) });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  const { lessonKey, position } = await req.json();
  if (!lessonKey) return NextResponse.json({ ok: false }, { status: 400 });
  await upsertRecentlyVisited(session.user.id, lessonKey, typeof position === "number" ? position : undefined);
  return NextResponse.json({ ok: true });
}
