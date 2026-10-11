import { test, expect } from '@playwright/test';
import {
  VALID_MISSION_TAGS,
  sanitizeMissionText,
  deriveStatEffect,
  validateVenueMissions,
  normalizeVenueKey,
} from '../src/lib/venueMissions';
import { getWaitLabels, normalizeWaitType, WAIT_LABELS } from '../src/lib/labels';
import { MISSIONS } from '../src/lib/missions';

test.describe('Labels and Wait Types Unit Tests', () => {
  test('supported wait types match spec', () => {
    expect(normalizeWaitType('flight')).toBe('flight');
    expect(normalizeWaitType('train')).toBe('train');
    expect(normalizeWaitType('bus')).toBe('bus');
    expect(normalizeWaitType('other')).toBe('other');
    expect(normalizeWaitType('UNKNOWN')).toBe('flight');
    expect(normalizeWaitType(null)).toBe('flight');
  });

  test('labels mapping for flight', () => {
    const l = getWaitLabels('flight');
    expect(l.departureLabel).toBe('DEPARTURE');
    expect(l.placeLabel).toBe('GATE');
    expect(l.finalTask).toBe('GO TO YOUR GATE');
    expect(l.arrivalCard).toBe('ENJOY YOUR JOURNEY');
    expect(l.waitNoun).toBe('FLIGHT');
  });

  test('labels mapping for train', () => {
    const l = getWaitLabels('train');
    expect(l.departureLabel).toBe('DEPARTURE');
    expect(l.placeLabel).toBe('PLATFORM');
    expect(l.finalTask).toBe('GO TO YOUR PLATFORM');
    expect(l.arrivalCard).toBe('ENJOY YOUR TRIP');
    expect(l.waitNoun).toBe('TRAIN');
  });

  test('labels mapping for bus', () => {
    const l = getWaitLabels('bus');
    expect(l.departureLabel).toBe('DEPARTURE');
    expect(l.placeLabel).toBe('BUS STOP OR BAY');
    expect(l.finalTask).toBe('GO TO YOUR BUS STOP');
    expect(l.arrivalCard).toBe('ENJOY YOUR RIDE');
    expect(l.waitNoun).toBe('BUS');
  });

  test('labels mapping for other', () => {
    const l = getWaitLabels('other');
    expect(l.departureLabel).toBe('STARTS AT');
    expect(l.placeLabel).toBe('MEETING POINT');
    expect(l.finalTask).toBe('GO TO YOUR MEETING POINT');
    expect(l.arrivalCard).toBe('ENJOY YOUR TIME');
    expect(l.waitNoun).toBe('EVENT');
  });
});

test.describe('Venue Missions Validator Unit Tests', () => {
  test('sanitizes emojis, urls, html, and em dashes', () => {
    const dirty = 'Check this out! 🚀 http://evil.com <b>bold</b> — take a break!';
    const clean = sanitizeMissionText(dirty);
    expect(clean).not.toContain('🚀');
    expect(clean).not.toContain('http');
    expect(clean).not.toContain('<b>');
    expect(clean).not.toContain('—');
    expect(clean).toBe('Check this out! bold - take a break!');
  });

  test('code-derived stat effects match rules and discard AI stats', () => {
    expect(deriveStatEffect('FOOD')).toEqual({ need: 'hunger', boost: 30 });
    expect(deriveStatEffect('REST')).toEqual({ need: 'energy', boost: 30 });
    expect(deriveStatEffect('PLUG')).toEqual({ need: 'battery', boost: 30 });
    expect(deriveStatEffect('MOVE')).toEqual({ need: 'energy', boost: -15 });
    expect(deriveStatEffect('MEET')).toEqual({ need: 'energy', boost: 5 });
    expect(deriveStatEffect('SPOT')).toEqual({ need: 'energy', boost: 5 });
    expect(deriveStatEffect('PREP')).toEqual({ need: 'energy', boost: 0 });
  });

  test('validates and clamps valid missions', () => {
    const rawBatch = [
      { tag: 'FOOD', title: 'Get a hot chai', mins: 1, proof: 'photo', proofHint: 'PHOTO OF TEA' }, // mins clamped to 3
      { tag: 'REST', title: 'Close eyes and relax', mins: 35, proof: 'none' }, // mins clamped to 20
      { tag: 'PLUG', title: 'Plug in phone to charge', mins: 10, proof: 'photo', proofHint: 'OUTLET' },
      { tag: 'SPOT', title: 'Find departure clock', mins: 5, proof: 'photo', proofHint: 'CLOCK' },
      { tag: 'MEET', title: 'Say hi to someone building', mins: 8, social: true, proof: 'none' },
    ];

    const validated = validateVenueMissions(rawBatch, 'layover-123', 'TinkerSpace Calicut');
    expect(validated.length).toBe(5);

    expect(validated[0].mins).toBe(3);
    expect(validated[1].mins).toBe(20);
    expect(validated[2].mins).toBe(10);
    expect(validated[0].need).toBe('hunger');
    expect(validated[0].boost).toBe(30);
    expect(validated[4].social).toBe(true);
    expect(validated[4].privacyNotice).toContain('ONLY PEOPLE WHO AGREE');
    expect(validated[0].venueTag).toBe('AT TINKERSPACE CALICUT');
  });

  test('rejects unknown tags and invalid titles', () => {
    const rawBatch = [
      { tag: 'INVALID_TAG', title: 'Do something wild', mins: 10 },
      { tag: 'FOOD', title: 'AB', mins: 10 }, // too short (<3)
      { tag: 'MOVE', title: 'A'.repeat(80), mins: 10 }, // too long (>60)
      { tag: 'PLUG', title: 'Valid mission one', mins: 10 },
      { tag: 'REST', title: 'Valid mission two', mins: 10 },
      { tag: 'SPOT', title: 'Valid mission three', mins: 10 },
    ];

    // Only 3 valid survive, which is < 4 -> should reject entire batch and return []
    const validated = validateVenueMissions(rawBatch, 'layover-123');
    expect(validated.length).toBe(0);
  });

  test('drops duplicates and rejects batch if < 4 survive', () => {
    const rawBatch = [
      { tag: 'FOOD', title: 'Duplicate title', mins: 10 },
      { tag: 'FOOD', title: 'Duplicate title', mins: 10 },
      { tag: 'PLUG', title: 'Unique mission two', mins: 10 },
      { tag: 'SPOT', title: 'Unique mission three', mins: 10 },
    ];

    const validated = validateVenueMissions(rawBatch, 'layover-123');
    // Only 3 survive due to deduplication, which is < 4 -> batch dropped
    expect(validated.length).toBe(0);
  });

  test('normalizes venue keys for 12h local cache', () => {
    expect(normalizeVenueKey('TinkerSpace Calicut!')).toBe('tinkerspace_calicut');
    expect(normalizeVenueKey('Terminal 2 (COK)')).toBe('terminal_2_cok');
  });

  test('fallback missions pool contains SPOT and MEET offline fallbacks', () => {
    const spotMissions = MISSIONS.filter((m) => m.icon === 'SPOT');
    const meetMissions = MISSIONS.filter((m) => m.icon === 'MEET');
    expect(spotMissions.length).toBeGreaterThanOrEqual(2);
    expect(meetMissions.length).toBeGreaterThanOrEqual(2);
  });
});
