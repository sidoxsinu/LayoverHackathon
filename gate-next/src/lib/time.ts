const MIN = 60_000;
export const BUFFER_MIN = 30;
export const MARGIN_MIN = 5;

export function nextOccurrence(hhmm: string, now = Date.now()): number {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 1);
  return d.getTime();
}

export function schedule({ departureMs, walkMin }: { departureMs: number; walkMin: number }) {
  return { departureMs, returnByMs: departureMs - (BUFFER_MIN + walkMin + MARGIN_MIN) * MIN };
}

export function demoSchedule(walkMin: number, now = Date.now()) {
  const returnByMs = now + 60_000;
  return { returnByMs, departureMs: returnByMs + (BUFFER_MIN + walkMin + MARGIN_MIN) * MIN };
}

export function phaseFor(msLeft: number, demo = false): 'free' | 'headsup' | 'urgent' | 'alarm' {
  const [urgent, heads] = demo ? [10_000, 20_000] : [5 * MIN, 15 * MIN];
  if (msLeft <= 0) return 'alarm';
  if (msLeft <= urgent) return 'urgent';
  if (msLeft <= heads) return 'headsup';
  return 'free';
}

export function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

export function fmtDuration(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / MIN));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}M`;
  if (m === 0) return `${h}H`;
  return `${h}H ${m}M`;
}
