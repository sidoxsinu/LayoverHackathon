let audio: HTMLAudioElement | undefined, 
    ctx: AudioContext | undefined, 
    wakeLock: any | undefined, 
    loop: ReturnType<typeof setInterval>, 
    vib: ReturnType<typeof setInterval>;

const el = () => {
  if (!audio) {
    audio = Object.assign(new Audio('/alarm.mp3'), { loop: true, preload: 'auto' });
  }
  return audio;
};

export async function arm() {            
  try { 
    await el().play(); 
    el().pause(); 
    el().currentTime = 0; 
  } catch {}
  if (!ctx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    ctx = new AudioContextClass();
  }
  await ctx.resume().catch(() => {});
  await lockScreen();
}

export async function lockScreen() {
  try { 
    if ('wakeLock' in navigator) {
      wakeLock = await (navigator as any).wakeLock.request('screen'); 
    }
  } catch {}
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') lockScreen();
  });
}

function beep(f: number, t: number, d = 0.25) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
  g.gain.setValueAtTime(0.6, ctx.currentTime + t);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d);
  o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + d);
}

export const chime = () => ctx && beep(660, 0, 0.4);

export function startAlarm() {
  el().play().catch(() => {                     
    const burst = () => [0, 0.35, 0.7].forEach(t => beep(880, t));
    burst(); loop = setInterval(burst, 1500);
  });
  const buzz = () => navigator.vibrate?.([500, 200, 500]);
  buzz(); vib = setInterval(buzz, 1500);
}

export function stopAlarm() {
  audio?.pause(); 
  clearInterval(loop); 
  clearInterval(vib); 
  navigator.vibrate?.(0);
  wakeLock?.release?.();
}
