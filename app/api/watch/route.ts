import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { markWatched, unmarkWatched } from "@/db/queries";
import { apiError } from "@/lib/apiError";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
    const { lessonKey, watched } = (await req.json()) as {
      lessonKey: string;
      watched: boolean;
    };

    if (!/^\d+:\d+:\d+:\d+$/.test(lessonKey) && !/^playlist:[A-Za-z0-9_-]+:\d+$/.test(lessonKey))
      return NextResponse.json({ error: "invalid key" }, { status: 400 });

    if (watched) {
      await markWatched(session.user.id, lessonKey);
    } else {
      await unmarkWatched(session.user.id, lessonKey);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("watch POST", err);
  }
}
