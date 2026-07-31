import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

export default async function Home() {
  await ensureSeed();
  const user = await getSessionUser();
  if (!user) redirect("/login");
  redirect(user.role === "admin" ? "/admin" : "/panel");
}
