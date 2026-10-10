import { createBrowserClient } from './supabase';

export interface Trip {
  id: string;
  user_id: string;
  name: string;
  location: string | null;
  flight_no: string | null;
  gate: string | null;
  departure_at: string;
  walk_min: number;
  created_at?: string;
  updated_at?: string;
}

const CACHE_PREFIX = 'gate.trips.v1.';

export function getTripsCacheKey(userId: string): string {
  return `${CACHE_PREFIX}${userId}`;
}

export function getTripsCache(userId: string): Trip[] {
  try {
    const raw = localStorage.getItem(getTripsCacheKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setTripsCache(userId: string, trips: Trip[]): void {
  try {
    localStorage.setItem(getTripsCacheKey(userId), JSON.stringify(trips));
  } catch {}
}

export function clearTripsCache(userId: string): void {
  try {
    localStorage.removeItem(getTripsCacheKey(userId));
  } catch {}
}

export function clearAllTripsCaches(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export async function fetchUserTrips(userId: string): Promise<{
  trips: Trip[];
  offline: boolean;
  unavailable: boolean;
}> {
  const cached = getTripsCache(userId);
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (!isOnline) {
    return {
      trips: cached,
      offline: true,
      unavailable: cached.length === 0,
    };
  }

  const supabase = createBrowserClient();
  if (!supabase) {
    return {
      trips: cached,
      offline: false,
      unavailable: true,
    };
  }

  try {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('departure_at', { ascending: true });

    if (error) {
      return {
        trips: cached,
        offline: false,
        unavailable: true,
      };
    }

    const trips = (data as Trip[]) || [];
    setTripsCache(userId, trips);
    return {
      trips,
      offline: false,
      unavailable: false,
    };
  } catch {
    return {
      trips: cached,
      offline: false,
      unavailable: true,
    };
  }
}

export function formatTripDateTime(isoString: string): { dateStr: string; timeStr: string; departureMs: number } {
  const d = new Date(isoString);
  const departureMs = d.getTime();
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');

  return {
    dateStr: `${day} ${month}`,
    timeStr: `${hours}:${mins}`,
    departureMs,
  };
}

export function getTripStatus(departureMs: number, now = Date.now()): string {
  const diffMs = departureMs - now;
  if (diffMs < 0) return 'PAST';

  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays >= 1) {
    return `IN ${diffDays}D`;
  }
  if (diffHours >= 1) {
    return `IN ${diffHours}H`;
  }
  return 'TODAY';
}
