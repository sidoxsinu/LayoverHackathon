import { test, expect } from '@playwright/test';
import { RANKS, getRank, getNextRank, rankProgress } from '../src/lib/rank';

test.describe('Rank System Unit Tests', () => {
  test('boundary: 0 XP returns Gate Rookie', () => {
    expect(getRank(0)).toBe('Gate Rookie');
    expect(getNextRank(0)).toBe('Terminal Nomad');
    const prog = rankProgress(0);
    expect(prog.current).toBe('Gate Rookie');
    expect(prog.next).toBe('Terminal Nomad');
    expect(prog.xpIntoRank).toBe(0);
    expect(prog.xpForNext).toBe(50);
    expect(prog.xpToNext).toBe(50);
    expect(prog.pct).toBe(0);
  });

  test('boundary: 49 XP returns Gate Rookie', () => {
    expect(getRank(49)).toBe('Gate Rookie');
    expect(getNextRank(49)).toBe('Terminal Nomad');
    const prog = rankProgress(49);
    expect(prog.xpToNext).toBe(1);
    expect(prog.pct).toBe(98);
  });

  test('boundary: 50 XP returns Terminal Nomad', () => {
    expect(getRank(50)).toBe('Terminal Nomad');
    expect(getNextRank(50)).toBe('Concourse Runner');
    const prog = rankProgress(50);
    expect(prog.current).toBe('Terminal Nomad');
    expect(prog.next).toBe('Concourse Runner');
    expect(prog.xpIntoRank).toBe(0);
    expect(prog.xpForNext).toBe(100);
    expect(prog.xpToNext).toBe(100);
    expect(prog.pct).toBe(0);
  });

  test('boundary: 149 XP returns Terminal Nomad', () => {
    expect(getRank(149)).toBe('Terminal Nomad');
    expect(getNextRank(149)).toBe('Concourse Runner');
  });

  test('boundary: 150 XP returns Concourse Runner', () => {
    expect(getRank(150)).toBe('Concourse Runner');
    expect(getNextRank(150)).toBe('Gate Guardian');
    const prog = rankProgress(150);
    expect(prog.current).toBe('Concourse Runner');
    expect(prog.next).toBe('Gate Guardian');
    expect(prog.xpIntoRank).toBe(0);
    expect(prog.xpForNext).toBe(150);
    expect(prog.xpToNext).toBe(150);
    expect(prog.pct).toBe(0);
  });

  test('spec bug case: 160 XP returns Concourse Runner', () => {
    expect(getRank(160)).toBe('Concourse Runner');
    expect(getNextRank(160)).toBe('Gate Guardian');
    const prog = rankProgress(160);
    expect(prog.current).toBe('Concourse Runner');
    expect(prog.next).toBe('Gate Guardian');
    expect(prog.xpIntoRank).toBe(10);
    expect(prog.xpForNext).toBe(150);
    expect(prog.xpToNext).toBe(140);
    expect(prog.pct).toBe(7);
  });

  test('boundary: 299 XP returns Concourse Runner', () => {
    expect(getRank(299)).toBe('Concourse Runner');
    expect(getNextRank(299)).toBe('Gate Guardian');
    const prog = rankProgress(299);
    expect(prog.xpToNext).toBe(1);
  });

  test('boundary: 300 XP returns Gate Guardian', () => {
    expect(getRank(300)).toBe('Gate Guardian');
    expect(getNextRank(300)).toBe('Transit Legend');
    const prog = rankProgress(300);
    expect(prog.current).toBe('Gate Guardian');
    expect(prog.next).toBe('Transit Legend');
    expect(prog.xpIntoRank).toBe(0);
    expect(prog.xpForNext).toBe(200);
    expect(prog.xpToNext).toBe(200);
    expect(prog.pct).toBe(0);
  });

  test('boundary: 499 XP returns Gate Guardian', () => {
    expect(getRank(499)).toBe('Gate Guardian');
    expect(getNextRank(499)).toBe('Transit Legend');
  });

  test('boundary: 500 XP returns Transit Legend (Max tier)', () => {
    expect(getRank(500)).toBe('Transit Legend');
    expect(getNextRank(500)).toBeNull();
    const prog = rankProgress(500);
    expect(prog.current).toBe('Transit Legend');
    expect(prog.next).toBeNull();
    expect(prog.xpIntoRank).toBe(0);
    expect(prog.pct).toBe(100);
  });

  test('boundary: 10000 XP returns Transit Legend', () => {
    expect(getRank(10000)).toBe('Transit Legend');
    expect(getNextRank(10000)).toBeNull();
    const prog = rankProgress(10000);
    expect(prog.current).toBe('Transit Legend');
    expect(prog.next).toBeNull();
    expect(prog.pct).toBe(100);
  });

  test('edge cases: negatives, NaN, and undefined guard to Gate Rookie', () => {
    expect(getRank(-10)).toBe('Gate Rookie');
    expect(getRank(NaN)).toBe('Gate Rookie');
    expect(getRank(undefined)).toBe('Gate Rookie');
    expect(getRank(null)).toBe('Gate Rookie');
  });
});
