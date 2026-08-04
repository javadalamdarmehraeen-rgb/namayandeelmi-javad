import { redirect } from "next/navigation";
import LeaveScreen from "@/components/screens/LeaveScreen";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <LeaveScreen role={user.role} />;
}
