export interface Mission {
  id: string;
  icon: string;
  type: string;
  text: string;
  mins: number;
  need: 'hunger' | 'sanity' | 'battery';
  boost: number;
  when: [number, number]; // [min_time_remaining, max_time_remaining]
}

export const MISSIONS: Mission[] = [
  // 3+ HOURS (LONG LAYOVER, HUNGER/REST)
  { id: 'meal',     icon: 'FOOD', type: 'FEAST',     text: 'Find a real sit-down restaurant. Order something you have never tried before.', mins: 60, need: 'hunger', boost: 80, when: [180, 9999] },
  { id: 'lounge',   icon: 'REST', type: 'LOUNGE',    text: 'Attempt to find a paid lounge. Check the entry price, but do not actually go in.', mins: 20, need: 'sanity', boost: 20, when: [180, 9999] },
  { id: 'walk_end', icon: 'MOVE', type: 'EXPLORE',   text: 'Walk to the absolute furthest gate in this terminal and touch the window.', mins: 30, need: 'sanity', boost: 40, when: [120, 9999] },

  // 1-3 HOURS (MID LAYOVER, ACTIVITY)
  { id: 'souv',     icon: 'MOVE', type: 'HUNT',      text: 'Find the most overpriced, absurd souvenir. Do not buy it. Take a photo.', mins: 15, need: 'sanity', boost: 30, when: [60, 9999] },
  { id: 'quiet',    icon: 'REST', type: 'ZEN',       text: 'Locate the quietest, most abandoned corner of the airport. Sit and do nothing for 10 minutes.', mins: 15, need: 'sanity', boost: 35, when: [45, 9999] },
  { id: 'plug',     icon: 'PLUG', type: 'CAMP',      text: 'Find a working wall outlet. Plug in your device and guard your territory.', mins: 20, need: 'battery', boost: 40, when: [30, 9999] },
  { id: 'coffee',   icon: 'FOOD', type: 'CAFFEINE',  text: 'Secure a coffee, tea, or local beverage. Sit somewhere facing the tarmac.', mins: 15, need: 'hunger', boost: 20, when: [40, 240] },
  { id: 'art',      icon: 'MOVE', type: 'CULTURE',   text: 'Find a piece of airport art or an installation. Stare at it until you understand it.', mins: 15, need: 'sanity', boost: 25, when: [60, 240] },
  { id: 'stretch',  icon: 'MOVE', type: 'HEALTH',    text: 'Find an empty gate area and do some shameless stretches for 5 minutes.', mins: 10, need: 'sanity', boost: 30, when: [40, 9999] },
  { id: 'flight',   icon: 'REST', type: 'SPY',       text: 'Look at the departure board. Find a flight to a city you cannot pronounce.', mins: 10, need: 'sanity', boost: 20, when: [40, 9999] },
  { id: 'snack',    icon: 'FOOD', type: 'SUPPLY',    text: 'Hunt down a convenience store and secure a tactical flight snack.', mins: 10, need: 'hunger', boost: 30, when: [20, 120] },

  // < 1 HOUR (SHORT LAYOVER, PREP)
  { id: 'water',    icon: 'FOOD', type: 'HYDRATE',   text: 'Find a water fountain. Fill your bottle or drink directly. Hydration is survival.', mins: 5, need: 'hunger', boost: 15, when: [15, 60] },
  { id: 'wash',     icon: 'REST', type: 'PREP',      text: 'Head to the restroom. Splash water on your face. Become a new person.', mins: 10, need: 'sanity', boost: 20, when: [15, 60] },
  { id: 'charge',   icon: 'PLUG', type: 'JUICE',     text: 'Find a charging station. Stand there and get 5% more battery. Every drop counts.', mins: 10, need: 'battery', boost: 15, when: [15, 60] },
  { id: 'pack',     icon: 'PREP', type: 'GEAR',      text: 'Repack your bags. Ensure your boarding pass and passport are immediately accessible.', mins: 5, need: 'sanity', boost: 20, when: [10, 40] },
  { id: 'trash',    icon: 'PREP', type: 'CLEAN',     text: 'Find a trash can and throw away any receipts or garbage you collected.', mins: 5, need: 'sanity', boost: 10, when: [10, 40] },

  // FINAL
  { id: 'go',       icon: 'MOVE', type: 'FINAL',     text: 'Your safe time is almost up. Start walking toward your gate now.', mins: 5, need: 'sanity', boost: 0, when: [0, 20] },
];

export interface Stats {
  hunger: number;
  sanity: number;
  battery: number;
}

export function pickMission({
  minsLeft,
  stats,
  recent = [],
}: {
  minsLeft: number;
  stats: Stats;
  recent?: string[];
}): Mission {
  // 1. Find all missions that fit the time window
  const fits = MISSIONS.filter(
    (m) =>
      minsLeft >= m.when[0] &&
      minsLeft <= m.when[1] &&
      m.mins <= minsLeft - 3
  );
  
  // 2. Try to exclude recent ones if we have enough options
  const notRecent = fits.filter((m) => !recent.includes(m.id));
  let pool = notRecent.length > 0 ? notRecent : fits;
  
  // 3. Fallback to 'go' if literally nothing fits
  if (pool.length === 0) {
    pool = MISSIONS.filter((m) => m.id === 'go');
  }

  // 4. Determine lowest stat to target need
  const lowest = (Object.entries(stats) as [keyof Stats, number][]).sort((a, b) => a[1] - b[1])[0][0];
  const targeted = pool.filter((m) => m.need === lowest);
  
  // 5. Select from targeted if possible, otherwise any in pool
  const from = targeted.length > 0 ? targeted : pool;
  return from[Math.floor(Math.random() * from.length)];
}

export function startStats(vibe: string): Stats {
  return {
    hunger: vibe === 'hungry' ? 30 : 70,
    sanity: vibe === 'wired' ? 40 : vibe === 'tired' ? 50 : 70,
    battery: 70,
  };
}

export const DRAIN_30S = { hunger: 0.15, sanity: 0.2, battery: 0.075 };
