import { NextResponse } from "next/server";

export function apiError(ctx: string, err: unknown) {
  console.error(`[${ctx}]`, err);
  return NextResponse.json({ error: "internal" }, { status: 500 });
}
