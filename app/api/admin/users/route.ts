import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAllUsersActivity } from "@/db/queries";
import { apiError } from "@/lib/apiError";

const ADMIN_EMAIL = "azizktata77@gmail.com";

export async function GET() {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const users = await getAllUsersActivity();
    return NextResponse.json({ users });
  } catch (err) {
    return apiError("admin/users GET", err);
  }
}
