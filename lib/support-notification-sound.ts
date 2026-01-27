/**
 * Play a short notification sound for new support messages.
 * Tries /sounds/new-message-alert.mp3; falls back to Web Audio beep if missing or on error.
 * Call prepareSupportSound() on user gesture (e.g. support page mount, thread click) so
 * AudioContext can start; otherwise playback may be blocked by the browser.
 */

const SOUND_PATH = "/sounds/newmessage.mp3";

let sharedContext: AudioContext | null = null;

function getSharedContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!window.AudioContext) return null;
  if (!sharedContext) sharedContext = new window.AudioContext();
  return sharedContext;
}

/** Call on user gesture (support page view, thread click) to allow sound later. */
export function prepareSupportSound(): void {
  const ctx = getSharedContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

function playBeepFallback(): void {
  try {
    const ctx = getSharedContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().then(() => playBeepNow(ctx)).catch(() => {});
      return;
    }
    playBeepNow(ctx);
  } catch {
    /* ignore */
  }
}

function playBeepNow(ctx: AudioContext): void {
  try {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    oscillator.type = "sine";
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    oscillator.start(t);
    oscillator.stop(t + 0.2);
  } catch {
    /* ignore */
  }
}

export function playNewMessageAlert(): void {
  if (typeof window === "undefined") return;
  try {
    const audio = new Audio(SOUND_PATH);
    audio.volume = 0.5;
    audio.play().catch(() => playBeepFallback());
  } catch {
    playBeepFallback();
  }
}
