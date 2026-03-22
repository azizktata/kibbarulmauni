import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchNotes } from "@/db/queries";
import { apiError } from "@/lib/apiError";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ results: [] });

  try {
    const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
    if (!q) return NextResponse.json({ results: [] });

    if (q.length > 200)
      return NextResponse.json({ error: "query too long" }, { status: 400 });

    const results = await searchNotes(session.user.id, q);
    return NextResponse.json({ results });
  } catch (err) {
    return apiError("notes/search GET", err);
  }
}
