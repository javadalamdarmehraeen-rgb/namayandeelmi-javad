export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { ensureSeed } = await import("@/lib/bootstrap");
    await ensureSeed();
  } catch (err) {
    console.error("instrumentation bootstrap failed", err);
  }
}
