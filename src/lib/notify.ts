import { db } from "@/db";
import { notifications } from "@/db/schema";
type NotifyInput = {
  toUserId?: number | null;
  toRole?: "admin" | "supervisor" | "rep" | "";
  fromName?: string;
  kind?: string;
  title: string;
  body?: string;
  link?: string;
};
/**           . */
export async function notify(input: NotifyInput) {
  try {
    await db.insert(notifications).values({
      toUserId: input.toUserId ?? null,
      toRole: input.toRole ?? "",
      fromName: input.fromName ?? "",
      kind: input.kind ?? "info",
      title: input.title.slice(0, 200),
      body: (input.body ?? "").slice(0, 2000),
      link: (input.link ?? "").slice(0, 200),
    });
  } catch {
    /* ignore */
  }
}
