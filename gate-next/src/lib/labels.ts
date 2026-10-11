// src/lib/labels.ts

export type WaitType = 'flight' | 'train' | 'bus' | 'other';

export interface WaitLabels {
  type: WaitType;
  selectorLabel: string;
  departureLabel: string;
  placeLabel: string;
  finalTask: string;
  arrivalCard: string;
  waitNoun: string;
}

export const WAIT_LABELS: Record<WaitType, WaitLabels> = {
  flight: {
    type: 'flight',
    selectorLabel: 'FLIGHT',
    departureLabel: 'DEPARTURE',
    placeLabel: 'GATE',
    finalTask: 'GO TO YOUR GATE',
    arrivalCard: 'ENJOY YOUR JOURNEY',
    waitNoun: 'FLIGHT',
  },
  train: {
    type: 'train',
    selectorLabel: 'TRAIN',
    departureLabel: 'DEPARTURE',
    placeLabel: 'PLATFORM',
    finalTask: 'GO TO YOUR PLATFORM',
    arrivalCard: 'ENJOY YOUR TRIP',
    waitNoun: 'TRAIN',
  },
  bus: {
    type: 'bus',
    selectorLabel: 'BUS',
    departureLabel: 'DEPARTURE',
    placeLabel: 'BUS STOP OR BAY',
    finalTask: 'GO TO YOUR BUS STOP',
    arrivalCard: 'ENJOY YOUR RIDE',
    waitNoun: 'BUS',
  },
  other: {
    type: 'other',
    selectorLabel: 'OTHER',
    departureLabel: 'STARTS AT',
    placeLabel: 'MEETING POINT',
    finalTask: 'GO TO YOUR MEETING POINT',
    arrivalCard: 'ENJOY YOUR TIME',
    waitNoun: 'EVENT',
  },
};

export const WAIT_TYPE_OPTIONS: readonly WaitType[] = ['flight', 'train', 'bus', 'other'] as const;

export function normalizeWaitType(input: unknown): WaitType {
  if (typeof input === 'string') {
    const clean = input.trim().toLowerCase();
    if (clean === 'flight' || clean === 'train' || clean === 'bus' || clean === 'other') {
      return clean;
    }
  }
  return 'flight';
}

export function getWaitLabels(type: unknown): WaitLabels {
  const norm = normalizeWaitType(type);
  return WAIT_LABELS[norm] || WAIT_LABELS.flight;
}
