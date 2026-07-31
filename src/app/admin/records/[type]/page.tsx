import { notFound } from "next/navigation";
import RecordScreen, { type RecordType } from "@/components/RecordScreen";

export const dynamic = "force-dynamic";

export default async function AdminRecordsPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!["pharmacies", "doctors", "orders"].includes(type)) notFound();
  return <RecordScreen type={type as RecordType} isAdmin />;
}
