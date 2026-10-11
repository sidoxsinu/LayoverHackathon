// src/lib/leaderboard.ts
// Client data layer for GATE Leaderboard: server-computed, isolated, offline-resilient

import { createBrowserClient } from './supabase';

export interface LeaderboardEntry {
  position: number;
  handle: string;
  total_xp: number;
  layovers: number;
  missions: number;
  is_me: boolean;
}

export type LeaderboardScope = 'all' | 'week' | 'venue';

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  myEntry: LeaderboardEntry | null;
  isOffline: boolean;
  isUnavailable: boolean;
  cachedAgeText: string | null;
}

export interface MembershipInfo {
  isMember: boolean;
  handle: string | null;
  handleChangedAt: string | null;
}

const IN_MEMORY_CACHE = new Map<string, { timestamp: number; result: LeaderboardResult }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds in-memory TTL
const TIMEOUT_MS = 6000; // 6 second strict network timeout

export function normalizeVenue(venue?: string | null): string {
  if (!venue) return '';
  return venue.trim().toUpperCase();
}

function getCacheKey(scope: LeaderboardScope, venue?: string | null): string {
  const normVenue = scope === 'venue' ? normalizeVenue(venue) : 'global';
  return `${scope}:${normVenue}`;
}

function getStorageKey(scope: LeaderboardScope, venue?: string | null): string {
  const normVenue = scope === 'venue' ? normalizeVenue(venue) : 'global';
  return `gate.lb.v1.${scope}.${normVenue}`;
}

export function formatAge(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return 'JUST NOW';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}M AGO`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}H AGO`;
  const days = Math.floor(hours / 24);
  return `${days}D AGO`;
}

function getLocalCachedBoard(scope: LeaderboardScope, venue?: string | null): {
  entries: LeaderboardEntry[];
  myEntry: LeaderboardEntry | null;
  ageText: string;
} | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getStorageKey(scope, venue));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.entries)) return null;
    return {
      entries: parsed.entries,
      myEntry: parsed.myEntry || null,
      ageText: formatAge(parsed.timestamp || Date.now()),
    };
  } catch {
    return null;
  }
}

function setLocalCachedBoard(
  scope: LeaderboardScope,
  venue: string | null | undefined,
  entries: LeaderboardEntry[],
  myEntry: LeaderboardEntry | null
): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      timestamp: Date.now(),
      entries,
      myEntry,
    };
    localStorage.setItem(getStorageKey(scope, venue), JSON.stringify(payload));
  } catch {}
}

async function withTimeout<T = any>(promise: PromiseLike<T>, ms = TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('TIMEOUT')), ms);
  });
  try {
    return await Promise.race([Promise.resolve(promise), timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * Fetch leaderboard from Supabase with in-memory caching and offline fallback.
 */
export async function fetchLeaderboard(
  scope: LeaderboardScope,
  venue?: string | null,
  forceRefresh = false
): Promise<LeaderboardResult> {
  const normVenue = normalizeVenue(venue);
  const cacheKey = getCacheKey(scope, normVenue);
  const now = Date.now();

  // 1. Check in-memory cache if not forcing refresh
  if (!forceRefresh) {
    const mem = IN_MEMORY_CACHE.get(cacheKey);
    if (mem && now - mem.timestamp < CACHE_TTL_MS) {
      return mem.result;
    }
  }

  // 2. Offline check
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  if (isOffline) {
    const cached = getLocalCachedBoard(scope, normVenue);
    if (cached) {
      return {
        entries: cached.entries,
        myEntry: cached.myEntry,
        isOffline: true,
        isUnavailable: false,
        cachedAgeText: cached.ageText,
      };
    }
    return {
      entries: [],
      myEntry: null,
      isOffline: true,
      isUnavailable: false,
      cachedAgeText: null,
    };
  }

  // 3. Client configuration check
  const supabase = createBrowserClient();
  if (!supabase) {
    const cached = getLocalCachedBoard(scope, normVenue);
    return {
      entries: cached ? cached.entries : [],
      myEntry: cached ? cached.myEntry : null,
      isOffline: false,
      isUnavailable: true,
      cachedAgeText: cached ? cached.ageText : null,
    };
  }

  // 4. Remote RPC Call
  try {
    const rpcPromise = supabase.rpc('get_leaderboard', {
      p_scope: scope,
      p_venue: normVenue || null,
      p_limit: 50,
    });

    const { data, error } = (await withTimeout<any>(rpcPromise)) || {};

    if (error) {
      const isFetchFailure =
        (typeof navigator !== 'undefined' && !navigator.onLine) ||
        (error.message && (
          error.message.includes('fetch') ||
          error.message.includes('network') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('abort')
        ));

      const cached = getLocalCachedBoard(scope, normVenue);
      if (isFetchFailure && cached) {
        return {
          entries: cached.entries,
          myEntry: cached.myEntry,
          isOffline: true,
          isUnavailable: false,
          cachedAgeText: cached.ageText,
        };
      }

      // If table/function missing or database error
      return {
        entries: [],
        myEntry: null,
        isOffline: false,
        isUnavailable: true,
        cachedAgeText: null,
      };
    }

    const rawRows = (data as any[]) || [];
    const entries: LeaderboardEntry[] = rawRows.map((r) => ({
      position: Number(r.position ?? r.rank_position ?? r.pos ?? 0),
      handle: String(r.handle || '').toUpperCase(),
      total_xp: Number(r.total_xp || 0),
      layovers: Number(r.layovers || 0),
      missions: Number(r.missions || 0),
      is_me: Boolean(r.is_me),
    }));

    const myEntry = entries.find((e) => e.is_me) || null;

    // Cache to localStorage
    setLocalCachedBoard(scope, normVenue, entries, myEntry);

    const result: LeaderboardResult = {
      entries,
      myEntry,
      isOffline: false,
      isUnavailable: false,
      cachedAgeText: null,
    };

    // Store in-memory cache
    IN_MEMORY_CACHE.set(cacheKey, { timestamp: now, result });

    return result;
  } catch (err) {
    // Network error or timeout: fall back to local cached board
    const cached = getLocalCachedBoard(scope, normVenue);
    return {
      entries: cached ? cached.entries : [],
      myEntry: cached ? cached.myEntry : null,
      isOffline: true,
      isUnavailable: false,
      cachedAgeText: cached ? cached.ageText : null,
    };
  }
}

/**
 * Check if the active signed-in user is a leaderboard member.
 */
export async function checkMembership(): Promise<MembershipInfo> {
  const supabase = createBrowserClient();
  if (!supabase) return { isMember: false, handle: null, handleChangedAt: null };

  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      return { isMember: false, handle: null, handleChangedAt: null };
    }

    const query = supabase
      .from('leaderboard_members')
      .select('handle, handle_changed_at')
      .eq('user_id', session.session.user.id)
      .maybeSingle();

    const { data, error } = (await withTimeout<any>(query)) || {};

    if (error || !data) {
      return { isMember: false, handle: null, handleChangedAt: null };
    }

    return {
      isMember: true,
      handle: String(data.handle || '').toUpperCase(),
      handleChangedAt: data.handle_changed_at || null,
    };
  } catch {
    return { isMember: false, handle: null, handleChangedAt: null };
  }
}

/**
 * Join or update handle on the leaderboard.
 */
export async function joinLeaderboard(handle: string): Promise<{ success: boolean; error?: string }> {
  const cleanHandle = handle.trim().toUpperCase();
  if (cleanHandle.length < 3 || cleanHandle.length > 16) {
    return { success: false, error: 'HANDLE MUST BE 3 TO 16 CHARACTERS' };
  }
  if (!/^[A-Z0-9_]+$/.test(cleanHandle)) {
    return { success: false, error: 'ONLY LETTERS, NUMBERS AND UNDERSCORE ALLOWED' };
  }

  const supabase = createBrowserClient();
  if (!supabase) {
    return { success: false, error: 'LEADERBOARD NOT AVAILABLE' };
  }

  try {
    const rpcPromise = supabase.rpc('join_leaderboard', {
      p_handle: cleanHandle,
    });

    const { data, error } = (await withTimeout<any>(rpcPromise)) || {};

    if (error) {
      const msg = error.message || '';
      if (msg.includes('HANDLE_NOT_ALLOWED')) return { success: false, error: 'HANDLE NOT ALLOWED' };
      if (msg.includes('HANDLE_TAKEN')) return { success: false, error: 'HANDLE TAKEN' };
      if (msg.includes('HANDLE_CHANGE_TOO_SOON')) return { success: false, error: 'YOU CAN CHANGE YOUR HANDLE ONCE AN HOUR' };
      if (msg.includes('HANDLE_INVALID')) return { success: false, error: 'HANDLE INVALID' };
      return { success: false, error: 'TRY AGAIN' };
    }

    if (data === 'OK') {
      IN_MEMORY_CACHE.clear(); // invalidate in-memory caches
      return { success: true };
    }

    if (data === 'HANDLE TAKEN') return { success: false, error: 'HANDLE TAKEN' };
    if (data === 'HANDLE NOT ALLOWED') return { success: false, error: 'HANDLE NOT ALLOWED' };
    if (data === 'HANDLE CHANGE TOO SOON') return { success: false, error: 'YOU CAN CHANGE YOUR HANDLE ONCE AN HOUR' };
    if (data === 'NOT SIGNED IN') return { success: false, error: 'SIGN IN TO JOIN' };
    if (data === 'HANDLE INVALID') return { success: false, error: 'HANDLE INVALID' };

    return { success: false, error: data || 'TRY AGAIN' };
  } catch {
    return { success: false, error: 'NETWORK ERROR, TRY AGAIN' };
  }
}

/**
 * Leave leaderboard. Deletes the user's member row without altering layovers or passport.
 */
export async function leaveLeaderboard(): Promise<{ success: boolean; error?: string }> {
  const supabase = createBrowserClient();
  if (!supabase) return { success: false, error: 'LEADERBOARD NOT AVAILABLE' };

  try {
    const rpcPromise = supabase.rpc('leave_leaderboard');
    const { data, error } = (await withTimeout<any>(rpcPromise)) || {};

    if (error || data !== 'OK') {
      return { success: false, error: 'TRY AGAIN' };
    }

    IN_MEMORY_CACHE.clear();
    return { success: true };
  } catch {
    return { success: false, error: 'NETWORK ERROR, TRY AGAIN' };
  }
}
