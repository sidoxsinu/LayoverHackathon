// src/lib/venueMissions.ts
import { Mission } from './missions';
import { WaitType } from './labels';

export type MissionTag = 'FOOD' | 'MOVE' | 'REST' | 'PLUG' | 'PREP' | 'MEET' | 'SPOT';

export const VALID_MISSION_TAGS: readonly MissionTag[] = [
  'FOOD',
  'MOVE',
  'REST',
  'PLUG',
  'PREP',
  'MEET',
  'SPOT',
] as const;

export interface RawVenueMission {
  title?: unknown;
  tag?: unknown;
  mins?: unknown;
  proofHint?: unknown;
  proof?: unknown;
  social?: unknown;
  boost?: unknown;
  xp?: unknown;
}

export interface VenueMissionsResponse {
  venueKnown?: boolean;
  venueSummary?: string;
  missions?: RawVenueMission[];
}

export interface ValidatedVenueMission extends Mission {
  source: 'venue';
  social: boolean;
  venueTag?: string;
  privacyNotice: string;
}

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
const URL_REGEX = /https?:\/\/[^\s]+/gi;
const HTML_REGEX = /<[^>]*>/g;

export function sanitizeMissionText(text: string): string {
  return text
    .replace(URL_REGEX, '')
    .replace(HTML_REGEX, '')
    .replace(/—/g, '-')
    .replace(EMOJI_REGEX, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Derives need and boost purely from the tag in code.
 * AI output is NEVER allowed to set stat boosts or XP.
 */
export function deriveStatEffect(tag: MissionTag): {
  need: 'hunger' | 'energy' | 'battery';
  boost: number;
} {
  switch (tag) {
    case 'FOOD':
      return { need: 'hunger', boost: 30 };
    case 'REST':
      return { need: 'energy', boost: 30 };
    case 'PLUG':
      return { need: 'battery', boost: 30 };
    case 'MOVE':
      return { need: 'energy', boost: -15 };
    case 'MEET':
      return { need: 'energy', boost: 5 };
    case 'SPOT':
      return { need: 'energy', boost: 5 };
    case 'PREP':
    default:
      return { need: 'energy', boost: 0 };
  }
}

/**
 * Validates, filters, and standardizes AI-generated venue missions.
 * Discards the whole batch if fewer than 4 valid missions survive.
 */
export function validateVenueMissions(
  rawList: unknown,
  layoverId: string,
  venueName?: string
): ValidatedVenueMission[] {
  if (!Array.isArray(rawList)) {
    return [];
  }

  const seenTitles = new Set<string>();
  const validated: ValidatedVenueMission[] = [];

  for (let i = 0; i < rawList.length; i++) {
    const raw = rawList[i];
    if (!raw || typeof raw !== 'object') continue;

    // 1. Tag validation
    const rawTag = String(raw.tag || '').trim().toUpperCase();
    if (!VALID_MISSION_TAGS.includes(rawTag as MissionTag)) {
      continue;
    }
    const tag = rawTag as MissionTag;

    // 2. Title validation (3 to 60 chars after sanitize)
    if (typeof raw.title !== 'string') continue;
    const cleanTitle = sanitizeMissionText(raw.title).toUpperCase();
    if (cleanTitle.length < 3 || cleanTitle.length > 60) {
      continue;
    }

    // Deduplicate by normalized title
    if (seenTitles.has(cleanTitle)) {
      continue;
    }
    seenTitles.add(cleanTitle);

    // 3. Mins clamping (integer 3 to 20)
    const parsedMins = typeof raw.mins === 'number' ? Math.round(raw.mins) : parseInt(String(raw.mins), 10);
    const mins = isNaN(parsedMins) ? 10 : Math.max(3, Math.min(20, parsedMins));

    // 4. Social & Proof flags
    const social = Boolean(raw.social);
    const proofRaw = String(raw.proof || '').trim().toLowerCase();
    const proof: 'photo' | 'none' = proofRaw === 'photo' ? 'photo' : 'none';

    // 5. Proof hint (max 70 chars)
    let proofHint = '';
    if (proof === 'photo') {
      const rawHint = typeof raw.proofHint === 'string' ? sanitizeMissionText(raw.proofHint).toUpperCase() : '';
      proofHint = rawHint.length > 0 ? rawHint.slice(0, 70) : 'PHOTO OF WHERE YOU ARE';
    }

    // 6. Privacy notice
    const privacyNotice = social
      ? 'ONLY PEOPLE WHO AGREE TO BE IN THE PHOTO. NO ID OR BOARDING PASS.'
      : 'NO FACES, ID OR BOARDING PASS.';

    // 7. Stat effect (derived in code, AI values discarded)
    const { need, boost } = deriveStatEffect(tag);

    const venueTag = venueName ? `AT ${sanitizeMissionText(venueName).toUpperCase().slice(0, 24)}` : undefined;

    validated.push({
      id: `v-${layoverId}-${i + 1}`,
      icon: tag,
      type: tag,
      text: cleanTitle,
      mins,
      need,
      boost,
      when: [mins + 3, 720],
      proof,
      proofHint,
      source: 'venue',
      social,
      venueTag,
      privacyNotice,
    });

    if (validated.length >= 8) {
      break;
    }
  }

  // If fewer than 4 survive, reject entire set
  if (validated.length < 4) {
    return [];
  }

  return validated;
}

// -----------------------------------------------------------------------------
// Local Cache Management (12 Hours TTL)
// -----------------------------------------------------------------------------

const CACHE_PREFIX = 'gate.venue.v1';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export function normalizeVenueKey(venue: string): string {
  return venue
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

export interface CachedVenueData {
  timestamp: number;
  venueSummary: string;
  venueKnown: boolean;
  missions: ValidatedVenueMission[];
}

export function getCachedVenueMissions(
  venue: string,
  waitType: WaitType
): ValidatedVenueMission[] | null {
  if (typeof window === 'undefined') return null;
  const norm = normalizeVenueKey(venue);
  if (!norm) return null;

  try {
    const key = `${CACHE_PREFIX}.${norm}.${waitType}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const data: CachedVenueData = JSON.parse(raw);
    if (!data || !Array.isArray(data.missions) || data.missions.length < 4) {
      return null;
    }

    if (Date.now() - data.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return data.missions;
  } catch {
    return null;
  }
}

export function setCachedVenueMissions(
  venue: string,
  waitType: WaitType,
  missions: ValidatedVenueMission[],
  venueSummary: string = '',
  venueKnown: boolean = false
): void {
  if (typeof window === 'undefined') return;
  const norm = normalizeVenueKey(venue);
  if (!norm || missions.length < 4) return;

  try {
    const key = `${CACHE_PREFIX}.${norm}.${waitType}`;
    const payload: CachedVenueData = {
      timestamp: Date.now(),
      venueSummary,
      venueKnown,
      missions,
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {}
}
