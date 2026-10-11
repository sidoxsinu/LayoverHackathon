// src/lib/tour.ts

export type TourScreenId = 'setup' | 'quest' | 'safe' | 'passport';

export interface TourStep {
  targetId: string; // matches data-tour="targetId" (empty string means centered card with no highlight)
  title: string;
  description: string;
}

export interface TourState {
  setup?: boolean;
  quest?: boolean;
  safe?: boolean;
  passport?: boolean;
  hints?: Record<string, boolean>;
}

const STORAGE_KEY = 'gate.tour.v1';

export function getTourState(): TourState {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function isTourCompleted(screen: TourScreenId): boolean {
  const state = getTourState();
  return Boolean(state[screen]);
}

export function markTourCompleted(screen: TourScreenId): void {
  if (typeof window === 'undefined') return;
  try {
    const state = getTourState();
    state[screen] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function resetTourState(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export const SETUP_STEPS: TourStep[] = [
  {
    targetId: '',
    title: 'WELCOME TO GATE',
    description: 'GATE TURNS YOUR WAITING TIME INTO A QUEST AND MAKES SURE YOU NEVER MISS DEPARTURE. 6 QUICK STEPS.',
  },
  {
    targetId: 'setup-departure',
    title: 'DEPARTURE TIME',
    description: 'WHEN YOU MUST DEPART. GATE COUNTS BACKWARDS FROM THIS.',
  },
  {
    targetId: 'setup-gate',
    title: 'DEPARTURE POINT',
    description: 'YOUR GATE, PLATFORM OR MEETING POINT. IT SHOWS ON THE ALARM SO YOU KNOW WHERE TO GO.',
  },
  {
    targetId: 'setup-walk',
    title: 'WALK TIME',
    description: 'HOW LONG IT TAKES YOU TO WALK BACK TO YOUR DEPARTURE POINT.',
  },
  {
    targetId: 'setup-vibe',
    title: 'TRAVEL VIBE',
    description: 'HOW YOU FEEL NOW. IT SETS YOUR STARTING STATS AND PICKS YOUR MISSIONS.',
  },
  {
    targetId: 'setup-start',
    title: 'START WAIT',
    description: 'SAFE TIME = DEPARTURE MINUS BUFFER, MINUS YOUR WALK. AT ZERO THE ALARM FIRES. TAP START AND KEEP YOUR VOLUME UP.',
  },
];

export const QUEST_STEPS: TourStep[] = [
  {
    targetId: 'quest-countdown',
    title: 'SAFE TIME',
    description: 'SAFE TIME. HOW LONG YOU CAN ROAM BEFORE YOU MUST WALK BACK. AT ZERO THE ALARM FIRES.',
  },
  {
    targetId: 'quest-alerts',
    title: 'ALERT LADDER',
    description: 'ALERTS: HEADS-UP AT 15 MIN, URGENT AT 5 MIN, FULL ALARM AT 0.',
  },
  {
    targetId: 'quest-stats',
    title: 'DRAINING STATS',
    description: 'HUNGER, ENERGY AND BATTERY DRAIN OVER TIME. BELOW 25 THEY BLINK. TAP A BAR TO CORRECT IT.',
  },
  {
    targetId: 'quest-mission',
    title: 'MISSION CARD',
    description: 'A MISSION THAT FITS YOUR SAFE TIME. COMPLETE IT FOR +40 XP. SKIP IS FREE.',
  },
  {
    targetId: 'quest-proof',
    title: 'PHOTO PROOF',
    description: 'ADD A PHOTO PROOF FOR +20 MORE XP. PROOF TURNS OFF WITH 5 MIN OR LESS LEFT.',
  },
  {
    targetId: 'quest-gate-arrival',
    title: 'DEPARTURE ARRIVAL',
    description: 'TAP WHEN YOU REACH YOUR DEPARTURE POINT. YOU CAN RETURN EARLY.',
  },
  {
    targetId: 'quest-mute',
    title: 'MUTE CONTROL',
    description: 'MUTES ALL SOUND AND VIBRATION. THE ALARM STILL SHOWS ON SCREEN.',
  },
  {
    targetId: '',
    title: 'XP & RANK',
    description: 'XP BUILDS YOUR RANK. SEE IT IN PASSPORT AFTER YOUR JOURNEY.',
  },
];

export const SAFE_STEPS: TourStep[] = [
  {
    targetId: 'safe-stamp',
    title: 'COMPLETION STAMP',
    description: 'YOUR STAMP FOR THIS WAIT SESSION.',
  },
  {
    targetId: 'safe-summary',
    title: 'XP AND MISSIONS',
    description: 'XP EARNED THIS TIME. IT ADDS TO YOUR TOTAL AND YOUR RANK.',
  },
  {
    targetId: 'safe-print',
    title: 'PRINT PASSPORT',
    description: 'PRINT OR SAVE YOUR PASSPORT AS PDF.',
  },
];

export const PASSPORT_STEPS: TourStep[] = [
  {
    targetId: 'passport-summary',
    title: 'TRAVELER SUMMARY',
    description: 'TOTAL XP AND YOUR CURRENT RANK.',
  },
  {
    targetId: 'passport-rank',
    title: 'RANKS AND XP',
    description: 'TAP TO SEE ALL 10 RANKS AND HOW TO EARN XP.',
  },
  {
    targetId: 'passport-history',
    title: 'PAST SESSIONS',
    description: 'EVERY WAIT SESSION YOU SURVIVED. TAP ONE FOR ITS PHOTO MEMORIES.',
  },
  {
    targetId: 'passport-print',
    title: 'PRINT FULL PASSPORT',
    description: 'PRINT YOUR FULL PASSPORT.',
  },
  {
    targetId: 'passport-leaderboard',
    title: 'LEADERBOARD',
    description: 'OPT IN TO SEE HOW YOUR XP COMPARES ACROSS ALL TRAVELERS.',
  },
];
