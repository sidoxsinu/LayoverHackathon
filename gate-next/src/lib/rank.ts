export interface RankTier {
  title: string;
  minXp: number;
}

export const RANKS: readonly RankTier[] = [
  { title: 'Gate Rookie', minXp: 0 },
  { title: 'Terminal Nomad', minXp: 50 },
  { title: 'Concourse Runner', minXp: 150 },
  { title: 'Gate Guardian', minXp: 300 },
  { title: 'Transit Legend', minXp: 500 },
] as const;

function sanitizeXp(xp: unknown): number {
  if (typeof xp !== 'number' || isNaN(xp) || !isFinite(xp) || xp < 0) {
    return 0;
  }
  return Math.floor(xp);
}

export function getRank(xp: unknown): string {
  const clean = sanitizeXp(xp);
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (clean >= RANKS[i].minXp) {
      return RANKS[i].title;
    }
  }
  return RANKS[0].title;
}

export function getNextRank(xp: unknown): string | null {
  const clean = sanitizeXp(xp);
  for (let i = 0; i < RANKS.length; i++) {
    if (clean < RANKS[i].minXp) {
      return RANKS[i].title;
    }
  }
  return null;
}

export interface RankProgress {
  current: string;
  next: string | null;
  xpIntoRank: number;
  xpForNext: number;
  xpToNext: number;
  pct: number;
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
      current: currentTier.title,
      next: null,
      xpIntoRank: clean - currentTier.minXp,
      xpForNext: 0,
      xpToNext: 0,
      pct: 100,
    };
  }

  const xpIntoRank = clean - currentTier.minXp;
  const xpForNext = nextTier.minXp - currentTier.minXp;
  const xpToNext = Math.max(0, nextTier.minXp - clean);
  const pct = Math.min(100, Math.max(0, Math.round((xpIntoRank / xpForNext) * 100)));

  return {
    current: currentTier.title,
    next: nextTier.title,
    xpIntoRank,
    xpForNext,
    xpToNext,
    pct,
  };
}

/**
 * Backward compatibility helper for legacy call sites.
 */
export function getRankInfo(xp: unknown): { rank: string; nextThreshold: number | null } {
  const clean = sanitizeXp(xp);
  const current = getRank(clean);
  const next = getNextRank(clean);
  const nextTier = next ? RANKS.find((r) => r.title === next) : null;
  return {
    rank: current,
    nextThreshold: nextTier ? nextTier.minXp : null,
  };
}
