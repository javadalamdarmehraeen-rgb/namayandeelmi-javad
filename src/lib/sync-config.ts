/**
 * ============================================================
 *    
 *  Render (namayandeelmi-javad.onrender.com)  NdcoHub.ir
 * ------------------------------------------------------------
 *       :
 *    uid        →    (UUID)       
 *    updated_at →    (    )
 *    origin     →        
 *
 *  : Last-Write-Wins   updated_at
 * ============================================================
 */
export type SyncTable = {
  /**     */
  name: string;
  /**     */
  label: string;
  /**      ( ) */
  skipColumns?: string[];
  /**    (   ) */
  defaultOn: boolean;
  /**       */
  batch: number;
};
export const SYNC_TABLES: SyncTable[] = [
  { name: "users", label: "", defaultOn: true, batch: 500 },
  { name: "roles", label: "", defaultOn: true, batch: 200 },
  { name: "options", label: " ", defaultOn: true, batch: 2000 },

  { name: "settings", label: "", defaultOn: true, batch: 200 },
  { name: "pharmacies", label: "", defaultOn: true, batch: 1000 },
  { name: "doctors", label: "", defaultOn: true, batch: 1000 },
  { name: "orders", label: "", defaultOn: true, batch: 1000 },
  { name: "targets", label: " ", defaultOn: true, batch: 500 },
  { name: "homes", label: " ", defaultOn: true, batch: 500 },
  { name: "leaves", label: "", defaultOn: true, batch: 500 },
  { name: "messengers", label: "", defaultOn: true, batch: 200 },
  { name: "notifications", label: "", defaultOn: true, batch: 500 },
  { name: "activity_logs", label: " ", defaultOn: false, batch: 500 },
  { name: "trips", label: " ", defaultOn: true, batch: 500 },
  { name: "trip_points", label: " ", defaultOn: false, batch: 2000 },
  { name: "attachments", label: "  ", defaultOn: false, batch: 20 },
];
/**        ( ) */
export const LOCAL_ONLY_COLUMNS = new Set(["id"]);
/**    —  Render  NdcoHub    */
export function nodeName(): string {
  return (
    process.env.NODE_NAME ||
    process.env.SYNC_NODE_NAME ||
    (process.env.RENDER ? "render" : "") ||
    (process.env.VERCEL ? "vercel" : "") ||
    "primary"
  );
}
/**     */
export function selfUrl(): string {
  return (
    process.env.PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.RENDER_EXTERNAL_URL ?? "") ||
    ""
  );
}
/**      : name|url,name|url */
export function configuredPeers(): { peer: string; url: string }[] {
  const raw = process.env.SYNC_PEERS || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const [peer, url] = entry.split("|").map((x) => x.trim());
      return { peer: peer || "peer", url: url || peer };
    })
    .filter((p) => p.url.startsWith("http"));
}
/**           */
export function syncSecret(): string {
  return process.env.SYNC_SECRET || process.env.APP_SECRET || "";
}
/**          */
export const PUBLIC_ENDPOINTS: string[] = (
  process.env.NEXT_PUBLIC_ENDPOINTS || "https://ndcohub.ir,https://namayandeelmi-javad.onrender.com"
)
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);
