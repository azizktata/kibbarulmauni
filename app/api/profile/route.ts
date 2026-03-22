import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserById, updateUser } from "@/db/queries";
import { apiError } from "@/lib/apiError";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
    const user = await getUserById(session.user.id);
    return NextResponse.json({ name: user?.name ?? null, age: user?.age ?? null });
  } catch (err) {
    return apiError("profile GET", err);
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
    const body = (await req.json()) as { name?: string; age?: number };
    const fields: { name?: string; age?: number } = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (name.length > 100)
        return NextResponse.json({ error: "name too long" }, { status: 400 });
      fields.name = name;
    }

    if (typeof body.age === "number") {
      if (!Number.isInteger(body.age) || body.age < 1 || body.age > 150)
        return NextResponse.json({ error: "invalid age" }, { status: 400 });
      fields.age = body.age;
    }

    if (Object.keys(fields).length > 0) {
      await updateUser(session.user.id, fields);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("profile PATCH", err);
  }
}
