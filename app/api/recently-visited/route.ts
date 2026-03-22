import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRecentlyVisited, upsertRecentlyVisited } from "@/db/queries";
import { apiError } from "@/lib/apiError";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ entries: [], keys: [] });

  try {
    const entries = await getRecentlyVisited(session.user.id);
    // keep `keys` for backward compat with useRecentlyWatched
    return NextResponse.json({ entries, keys: entries.map((e) => e.key) });
  } catch (err) {
    return apiError("recently-visited GET", err);
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const { lessonKey, position } = await req.json();
    if (!lessonKey) return NextResponse.json({ ok: false }, { status: 400 });

    const validPosition =
      typeof position === "number" && Number.isFinite(position) && position >= 0
        ? position
        : undefined;

    await upsertRecentlyVisited(session.user.id, lessonKey, validPosition);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("recently-visited POST", err);
  }
}
