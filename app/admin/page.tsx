import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminDashboard } from "./AdminDashboard";
import { getAllUsersActivity } from "@/db/queries";

const ADMIN_EMAIL = "azizktata77@gmail.com";

export const metadata = { title: "لوحة الإدارة" };

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL) redirect("/");

  const users = await getAllUsersActivity();
  return <AdminDashboard users={users} />;
}
