/**      (WebAudio) —     */
export function playNotificationSound() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const notes = [880, 1174.7];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.18 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.24);
    });
    setTimeout(() => ctx.close().catch(() => undefined), 900);
  } catch {
    /* ignore */
  }
}
export function vibrate(pattern: number | number[] = [120, 60, 120]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}
