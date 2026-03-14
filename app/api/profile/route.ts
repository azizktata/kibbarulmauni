import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserById, updateUser } from "@/db/queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const user = await getUserById(session.user.id);
  return NextResponse.json({ name: user?.name ?? null, age: user?.age ?? null });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const body = (await req.json()) as { name?: string; age?: number };
  const fields: { name?: string; age?: number } = {};
  if (typeof body.name === "string") fields.name = body.name.trim();
  if (typeof body.age === "number") fields.age = body.age;

  if (Object.keys(fields).length > 0) {
    await updateUser(session.user.id, fields);
  }

  return NextResponse.json({ ok: true });
}
