export interface Mission {
  id: string;
  icon: string;
  type: string;
  text: string;
  mins: number;
  need: 'hunger' | 'sanity' | 'battery';
  boost: number;
  when: [number, number];
}

export const MISSIONS: Mission[] = [
  { id: 'meal',   icon: 'FOOD', type: 'HUNGER',  text: 'Find a sit-down restaurant and eat a real meal. You have time.',           mins: 45, need: 'hunger',  boost: 60, when: [150, 9999] },
  { id: 'souv',   icon: 'MOVE', type: 'EXPLORE', text: 'Find the most overpriced useless souvenir. Do not buy. Take a photo.',      mins: 15, need: 'sanity', boost: 30, when: [90, 9999] },
  { id: 'quiet',  icon: 'REST', type: 'REST',    text: 'Find the quietest corner. Sit. Do nothing for 10 minutes.',                mins: 15, need: 'sanity', boost: 35, when: [60, 9999] },
  { id: 'loop',   icon: 'MOVE', type: 'MOVE',    text: 'Walk one full terminal loop. Count the gates.',                            mins: 20, need: 'sanity', boost: 45, when: [60, 9999] },
  { id: 'plug',   icon: 'PLUG', type: 'BATTERY', text: 'Find an outlet. Plug in. You are a phone now.',                            mins: 20, need: 'battery', boost: 25, when: [30, 9999] },
  { id: 'coffee', icon: 'FOOD', type: 'COMFORT', text: 'Get a coffee or tea. Sit somewhere new.',                                  mins: 15, need: 'hunger',  boost: 20, when: [40, 180] },
  { id: 'snack',  icon: 'FOOD', type: 'SUPPLY',  text: 'Buy one snack for the flight. Something new if possible.',                 mins: 10, need: 'hunger',  boost: 30, when: [20, 60] },
  { id: 'wash',   icon: 'REST', type: 'PREP',    text: 'Freshen up. Wash your face. New person.',                                  mins: 5,  need: 'sanity', boost: 20, when: [10, 60] },
  { id: 'pack',   icon: 'PREP', type: 'PREP',    text: 'Pack your bag. Passport and boarding pass in hand.',                       mins: 5,  need: 'battery', boost: 0,  when: [0, 30] },
  { id: 'go',     icon: 'MOVE', type: 'FINAL',   text: 'Head to your gate now. You survived.',                                     mins: 5,  need: 'sanity', boost: 0,  when: [0, 15] },
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
  const fits = MISSIONS.filter(
    (m) =>
      minsLeft >= m.when[0] &&
      minsLeft <= m.when[1] &&
      m.mins <= minsLeft - 5 &&
      !recent.includes(m.id)
  );
  const pool = fits.length ? fits : MISSIONS.filter((m) => m.id === 'go');
  const lowest = (Object.entries(stats) as [keyof Stats, number][]).sort((a, b) => a[1] - b[1])[0][0];
  const targeted = pool.filter((m) => m.need === lowest);
  const from = targeted.length ? targeted : pool;
  return from[Math.floor(Math.random() * from.length)];
}

export function startStats(vibe: string): Stats {
  return {
    hunger: vibe === 'hungry' ? 30 : 70,
    sanity: vibe === 'wired' ? 40 : vibe === 'tired' ? 50 : 70,
    battery: 70,
  };
}

// Drain per 30s tick
export const DRAIN_30S = { hunger: 0.15, sanity: 0.2, battery: 0.075 };
