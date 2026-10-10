// src/lib/tour.ts

export type TourScreenId = 'setup' | 'quest' | 'safe' | 'passport';

export interface TourStep {
  targetId: string; // matches data-tour="targetId"
  title: string;
  description: string;
}

export interface TourState {
  setup?: boolean;
  quest?: boolean;
  safe?: boolean;
  passport?: boolean;
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
    targetId: 'setup-flight',
    title: 'DEPARTURE AND GATE',
    description: 'ENTER SCHEDULED DEPARTURE TIME AND ASSIGNED GATE. YOUR LAYOVER DEADLINE DERIVES DIRECTLY FROM THIS FLIGHT.',
  },
  {
    targetId: 'setup-walk',
    title: 'WALK TIME',
    description: 'ESTIMATE WALKING MINUTES FROM TERMINAL TO GATE. SYSTEM LOCKS THIS DIRECTLY INTO YOUR SAFE RETURN TIME.',
  },
  {
    targetId: 'setup-vibe',
    title: 'TRAVEL VIBE',
    description: 'CHOOSE YOUR STARTING CONDITION TO SEED INITIAL ENERGY, HUNGER, AND STAT DEPLETION RATES.',
  },
  {
    targetId: 'setup-safe-time',
    title: 'SAFE TIME',
    description: 'TOTAL MINUTES BEFORE GATE CLOSING MINUS WALK TIME AND SAFETY BUFFER. MUST BE POSITIVE TO BEGIN.',
  },
];

export const QUEST_STEPS: TourStep[] = [
  {
    targetId: 'quest-countdown',
    title: 'RETURN COUNTDOWN',
    description: 'REMAINING TIME UNTIL YOU MUST HEAD TO YOUR GATE. ALERT LADDER ISSUES WARNINGS AT 15 MIN AND 5 MIN.',
  },
  {
    targetId: 'quest-stats',
    title: 'DRAINING STATS',
    description: 'FOUR VITALS DRAIN GRADUALLY OVER TIME. BLINKING RED INDICATES CRITICAL DEPLETION REQUIRING MISSIONS.',
  },
  {
    targetId: 'quest-mission',
    title: 'MISSION CARD',
    description: 'COMPLETE MISSIONS FOR XP AND STAT REPLENISHMENT. ATTACH OPTIONAL PHOTO PROOF FOR BONUS XP.',
  },
];

export const SAFE_STEPS: TourStep[] = [
  {
    targetId: 'safe-summary',
    title: 'LAYOVER SUMMARY',
    description: 'YOUR OFFICIAL TIME LOGGED, COMPLETED MISSIONS, ACCUMULATED XP, AND EARNED RANK TIER.',
  },
  {
    targetId: 'safe-passport',
    title: 'PASSPORT ARCHIVE',
    description: 'ACCESS YOUR LIFETIME LAYOVER LOG, PHOTO PROOFS, AND LEVEL PROGRESSION RECORD.',
  },
];
