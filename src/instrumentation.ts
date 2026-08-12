export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { ensureSeed } = await import("@/lib/bootstrap");
    await ensureSeed();
  } catch (err) {
    console.error("instrumentation bootstrap failed", err);
  }
  //      
  try {
    const { configuredPeers, syncSecret } = await import("@/lib/sync-config");
    if (configuredPeers().length === 0 || !syncSecret()) return;
    const minutes = Math.max(1, Number(process.env.SYNC_INTERVAL_MINUTES ?? 5));
    const g = globalThis as typeof globalThis & { __sekSyncTimer?: NodeJS.Timeout };
    if (g.__sekSyncTimer) clearInterval(g.__sekSyncTimer);
    const run = async () => {
      try {
        const { syncAll } = await import("@/lib/sync");
        const reports = await syncAll();
        for (const r of reports) {
          console.log(`[sync:${r.peer}] ${r.ok ? "" : ""}  ${r.pulled} /  ${r.pushed} — ${r.detail}`);
        }
      } catch (err) {
        console.error("[sync]   :", err instanceof Error ? err.message : err);
      }
    };
    //         
    setTimeout(run, 25_000);
    g.__sekSyncTimer = setInterval(run, minutes * 60_000);
    console.log(`    ${minutes}   `);
  } catch (err) {
    console.error("sync scheduler failed", err);
  }
}
