import { notFound } from "next/navigation";
import RecordScreen, { type RecordType } from "@/components/RecordScreen";
const TYPES = ["pharmacies", "doctors", "orders"] as const;
/**             */
export function generateStaticParams() {
  return TYPES.map((type) => ({ type }));
}
export const dynamicParams = false;
export default async function AdminRecordsPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!TYPES.includes(type as RecordType)) notFound();
  return <RecordScreen type={type as RecordType} isAdmin />;
}
