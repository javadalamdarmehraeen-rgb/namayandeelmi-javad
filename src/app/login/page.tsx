import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/bootstrap";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  await ensureSeed();
  const user = await getSessionUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/panel");
  return <LoginForm />;
}
