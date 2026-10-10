// alarm.ts - browser-only module, no SSR
let audio: HTMLAudioElement | undefined;
let warningAudio: HTMLAudioElement | undefined;
let isPlaying = false;
let ctx: AudioContext | undefined;
let wakeLock: WakeLockSentinel | undefined;
let beepLoop: ReturnType<typeof setInterval> | undefined;
let vibLoop: ReturnType<typeof setInterval> | undefined;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio('/Alarm.mp3');
    audio.loop = true;
    audio.preload = 'auto';
  }
  return audio;
}

function getWarningAudio(): HTMLAudioElement {
  if (!warningAudio) {
    warningAudio = new Audio('/warning.mp3');
    warningAudio.loop = false;
    warningAudio.preload = 'auto';
  }
  return warningAudio;
}

function getCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

export async function arm(): Promise<void> {
  // Must be called inside a user gesture handler
  const a = getAudio();
  try {
    await a.play();
    if (!isPlaying) {
      a.pause();
      a.currentTime = 0;
    }
  } catch {}
  
  const w = getWarningAudio();
  try {
    await w.play();
    w.pause();
    w.currentTime = 0;
  } catch {}

  try {
    await getCtx().resume();
  } catch {}
  await lockScreen();
}

export async function lockScreen(): Promise<void> {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch {}
}

// Re-acquire wake lock when page becomes visible again
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      lockScreen();
    }
  });
}

function beep(frequency: number, startOffset: number, duration = 0.25): void {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.value = frequency;
  o.connect(g);
  g.connect(c.destination);
  g.gain.setValueAtTime(0.6, c.currentTime + startOffset);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startOffset + duration);
  o.start(c.currentTime + startOffset);
  o.stop(c.currentTime + startOffset + duration);
}

export function chime(): void {
  try { beep(660, 0, 0.4); } catch {}
}

export function playWarning(): void {
  try {
    const w = getWarningAudio();
    w.currentTime = 0;
    w.play().catch(() => {});
  } catch {}
}

export function startAlarm(): void {
  if (isPlaying) return;
  isPlaying = true;
  const a = getAudio();
  a.play().catch((err) => {
    if (err.name === 'AbortError') return;
    if (!isPlaying) return;
    // Audio file blocked - use oscillator fallback
    const burst = () => {
      try {
        beep(880, 0);
        beep(880, 0.35);
        beep(880, 0.7);
      } catch {}
    };
    burst();
    beepLoop = setInterval(burst, 1500);
  });

  const buzz = () => {
    try { navigator.vibrate?.([500, 200, 500]); } catch {}
  };
  buzz();
  vibLoop = setInterval(buzz, 1500);
}

export function silenceAlarm(): void {
  isPlaying = false;
  try {
    const a = getAudio();
    a.pause();
    a.currentTime = 0;
  } catch {}
  clearInterval(beepLoop);
  clearInterval(vibLoop);
  try { navigator.vibrate?.(0); } catch {}
}

export function stopAlarm(): void {
  silenceAlarm();
  try { wakeLock?.release(); } catch {}
  wakeLock = undefined;
}
