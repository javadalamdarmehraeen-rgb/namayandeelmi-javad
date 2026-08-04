import { getSessionUser } from "@/lib/auth";
import { fetchUpdates, getTokens } from "@/lib/messaging";

export const dynamic = "force-dynamic";

/** لیست چت‌های اخیر ربات برای انتخاب آسان chat_id */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && !user.permissions.includes("messengers"))) {
    return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }
  const b = await req.json().catch(() => ({}));
  const platform = String(b.platform ?? "bale");
  const result = await fetchUpdates(platform, String(b.token ?? ""));
  return Response.json(result);
}

export async function GET() {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && !user.permissions.includes("messengers"))) {
    return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }
  const tokens = await getTokens();
  // فقط وجود/عدم وجود توکن را برمی‌گردانیم، نه خود مقدار کامل
  const masked: Record<string, string> = {};
  for (const [k, v] of Object.entries(tokens)) {
    masked[k] = v ? `${v.slice(0, 8)}••••${v.slice(-4)}` : "";
  }
  return Response.json({ tokens: masked });
}
