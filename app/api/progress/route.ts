import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWatchedKeys } from "@/db/queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ keys: [] });
  }
  const keys = await getWatchedKeys(session.user.id);
  return NextResponse.json({ keys });
}
