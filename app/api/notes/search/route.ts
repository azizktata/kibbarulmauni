import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchNotes } from "@/db/queries";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ results: [] });

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ results: [] });

  const results = await searchNotes(session.user.id, q);
  return NextResponse.json({ results });
}
