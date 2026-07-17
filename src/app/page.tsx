import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { dashboardPathForRole } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect(dashboardPathForRole(session.role));
  redirect("/login");
}
