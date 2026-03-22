import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWatchedKeys } from "@/db/queries";
import { apiError } from "@/lib/apiError";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ keys: [] }, { status: 401 });

  try {
    const keys = await getWatchedKeys(session.user.id);
    return NextResponse.json({ keys });
  } catch (err) {
    return apiError("progress GET", err);
  }
}
