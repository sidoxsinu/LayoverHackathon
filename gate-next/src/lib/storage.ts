const KEY = 'gate.v2';

export interface SavedState {
  departureMs: number;
  returnByMs: number;
  airportName?: string;
  gate: string;
  customMissions?: any[];
  vibe: string;
  walkMin: number;
  stats: { hunger: number; energy: number; battery: number };
  log: { logId?: string; id: string; text: string; status: 'completed' | 'skipped'; xp: number; ts: number }[];
  xp: number;
  screen: string;
  missionId: string | null;
  recent: string[];
  demo: boolean;
  startedMs: number;
  layoverId: string;
}

export function load(): SavedState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function save(s: Partial<SavedState>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export function clear(): void {
  localStorage.removeItem(KEY);
}
