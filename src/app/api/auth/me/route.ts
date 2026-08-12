import { getSessionUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/bootstrap";
export const dynamic = "force-dynamic";
export async function GET() {
  await ensureSeed();
  const user = await getSessionUser();
  if (!user) return Response.json({ user: null }, { status: 401 });
  return Response.json({ user });
}
