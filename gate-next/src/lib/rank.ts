export function getRankInfo(xp: number): { rank: string; nextThreshold: number | null } {
  if (xp >= 500) return { rank: 'VETERAN', nextThreshold: null };
  if (xp >= 300) return { rank: 'SEASONED', nextThreshold: 500 };
  if (xp >= 150) return { rank: 'NAVIGATOR', nextThreshold: 300 };
  if (xp >= 50) return { rank: 'EXPLORER', nextThreshold: 150 };
  return { rank: 'ROOKIE', nextThreshold: 50 };
}
