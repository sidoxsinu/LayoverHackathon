export const MISSION_XP = 40;
export const PROOF_BONUS_XP = 20;

export interface RankTier {
  level: number;
  title: string;
  minXp: number;
  meaning: string;
}

export const RANKS: readonly RankTier[] = [
  { level: 1, title: 'Gate Rookie', minXp: 0, meaning: 'JUST LANDED. YOUR FIRST LAYOVER.' },
  { level: 2, title: 'Terminal Nomad', minXp: 50, meaning: 'YOU KNOW HOW TO FILL AN AIRPORT HOUR.' },
  { level: 3, title: 'Concourse Runner', minXp: 150, meaning: 'YOU OWN THE CONCOURSE.' },
  { level: 4, title: 'Gate Guardian', minXp: 300, meaning: 'YOU NEVER MISS A BOARDING CALL.' },
  { level: 5, title: 'Transit Legend', minXp: 500, meaning: 'THE TERMINAL KNOWS YOUR NAME.' },
  { level: 6, title: 'Tarmac Veteran', minXp: 1000, meaning: 'STORMS AND DELAYS CANNOT SHAKE YOU.' },
  { level: 7, title: 'Airspace Navigator', minXp: 1800, meaning: 'EVERY SHORTCUT AND CONCOURSE MAPPED.' },
  { level: 8, title: 'Flight Commander', minXp: 3000, meaning: 'MASTER OF MULTI-LEG CONNECTIONS.' },
  { level: 9, title: 'Stratosphere Elite', minXp: 4600, meaning: 'THE GLOBAL AIR NETWORK IS YOUR BACKYARD.' },
  { level: 10, title: 'Apex Voyager', minXp: 6500, meaning: 'TOP RANK. AN IMMORTAL OF GLOBAL TRANSIT.' },
] as const;

export function sanitizeXp(xp: unknown): number {
  if (typeof xp !== 'number' || isNaN(xp) || !isFinite(xp) || xp < 0) {
    return 0;
  }
  return Math.floor(xp);
}

export function getRank(xp: unknown): RankTier {
  const clean = sanitizeXp(xp);
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (clean >= RANKS[i].minXp) {
      return RANKS[i];
    }
  }
  return RANKS[0];
}

export function getNextRank(xp: unknown): RankTier | null {
  const clean = sanitizeXp(xp);
  for (let i = 0; i < RANKS.length; i++) {
    if (clean < RANKS[i].minXp) {
      return RANKS[i];
    }
  }
  return null;
}

export interface RankProgress {
  level: number;
  totalLevels: number;
  current: RankTier;
  next: RankTier | null;
  xpIntoRank: number;
  xpForNext: number;
  xpToNext: number;
  pct: number;
  missionsToNext: number;
  missionsToNextWithProof: number;
}

export function rankProgress(xp: unknown): RankProgress {
  const clean = sanitizeXp(xp);

  let currentIndex = 0;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (clean >= RANKS[i].minXp) {
      currentIndex = i;
      break;
    }
  }

  const currentTier = RANKS[currentIndex];
  const nextTier = currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;

  if (!nextTier) {
    return {
      level: currentTier.level,
      totalLevels: RANKS.length,
      current: currentTier,
      next: null,
      xpIntoRank: clean - currentTier.minXp,
      xpForNext: 0,
      xpToNext: 0,
      pct: 100,
      missionsToNext: 0,
      missionsToNextWithProof: 0,
    };
  }

  const xpIntoRank = clean - currentTier.minXp;
  const xpForNext = nextTier.minXp - currentTier.minXp;
  const xpToNext = Math.max(0, nextTier.minXp - clean);
  const pct = Math.min(100, Math.max(0, Math.round((xpIntoRank / xpForNext) * 100)));
  const missionsToNext = Math.ceil(xpToNext / MISSION_XP);
  const missionsToNextWithProof = Math.ceil(xpToNext / (MISSION_XP + PROOF_BONUS_XP));

  return {
    level: currentTier.level,
    totalLevels: RANKS.length,
    current: currentTier,
    next: nextTier,
    xpIntoRank,
    xpForNext,
    xpToNext,
    pct,
    missionsToNext,
    missionsToNextWithProof,
  };
}

/**
 * Backward compatibility helper for legacy call sites.
 */
export function getRankInfo(xp: unknown): { rank: string; nextThreshold: number | null } {
  const clean = sanitizeXp(xp);
  const current = getRank(clean);
  const next = getNextRank(clean);
  return {
    rank: current.title,
    nextThreshold: next ? next.minXp : null,
  };
}
