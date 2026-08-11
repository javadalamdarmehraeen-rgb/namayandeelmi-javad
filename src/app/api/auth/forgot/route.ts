import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSeed } from "@/lib/bootstrap";
import { notify } from "@/lib/notify";
import { eq } from "drizzle-orm";
export const dynamic = "force-dynamic";
/**    —      */
export async function POST(req: Request) {
  await ensureSeed();
  const b = await req.json().catch(() => ({}));
  const username = String(b.username ?? "").trim().toLowerCase();
  const phone = String(b.phone ?? "").replace(/\D/g, "");
  if (!username) return Response.json({ error: "    " }, { status: 400 });
  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  const u = rows[0];
  //        
  const done = Response.json({
    ok: true,
    message:
      "     .             .     
  .",
  });
  if (!u) return done;
  for (const role of ["admin", "supervisor"] as const) {
    await notify({
      toRole: role,
      fromName: u.fullName,
      kind: "password",
      title: `     — ${u.fullName}`,
      body: ` : ${u.username}\n : ${phone || "—"}\n : ${u.phone || "—"}\n  «
  »    .`,
      link: "/admin/users",
    });
  }
  return done;
}
