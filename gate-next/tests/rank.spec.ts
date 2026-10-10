import { test, expect } from '@playwright/test';
import { RANKS, getRank, getNextRank, rankProgress, MISSION_XP, PROOF_BONUS_XP } from '../src/lib/rank';

test.describe('Rank System Unit Tests', () => {
  test('constants: MISSION_XP is 40 and PROOF_BONUS_XP is 20', () => {
    expect(MISSION_XP).toBe(40);
    expect(PROOF_BONUS_XP).toBe(20);
  });

  test('rank tier meanings match spec exactly', () => {
    expect(RANKS[0].meaning).toBe('JUST LANDED. YOUR FIRST LAYOVER.');
    expect(RANKS[1].meaning).toBe('YOU KNOW HOW TO FILL AN AIRPORT HOUR.');
    expect(RANKS[2].meaning).toBe('YOU OWN THE CONCOURSE.');
    expect(RANKS[3].meaning).toBe('YOU NEVER MISS A BOARDING CALL.');
    expect(RANKS[4].meaning).toBe('TOP RANK. THE TERMINAL KNOWS YOUR NAME.');
  });

  test('boundary: 0 XP returns Gate Rookie (level 1)', () => {
    const rank = getRank(0);
    expect(rank.title).toBe('Gate Rookie');
    expect(rank.level).toBe(1);
    expect(getNextRank(0)?.title).toBe('Terminal Nomad');
    expect(getNextRank(0)?.level).toBe(2);

    const prog = rankProgress(0);
    expect(prog.level).toBe(1);
    expect(prog.totalLevels).toBe(5);
    expect(prog.current.title).toBe('Gate Rookie');
    expect(prog.next?.title).toBe('Terminal Nomad');
    expect(prog.xpIntoRank).toBe(0);
    expect(prog.xpForNext).toBe(50);
    expect(prog.xpToNext).toBe(50);
    expect(prog.pct).toBe(0);
    expect(prog.missionsToNext).toBe(2); // ceil(50 / 40) = 2
    expect(prog.missionsToNextWithProof).toBe(1); // ceil(50 / 60) = 1
  });

  test('boundary: 49 XP returns Gate Rookie', () => {
    const rank = getRank(49);
    expect(rank.title).toBe('Gate Rookie');
    expect(rank.level).toBe(1);
    expect(getNextRank(49)?.title).toBe('Terminal Nomad');

    const prog = rankProgress(49);
    expect(prog.xpToNext).toBe(1);
    expect(prog.pct).toBe(98);
    expect(prog.missionsToNext).toBe(1);
    expect(prog.missionsToNextWithProof).toBe(1);
  });

  test('boundary: 50 XP returns Terminal Nomad (level 2)', () => {
    const rank = getRank(50);
    expect(rank.title).toBe('Terminal Nomad');
    expect(rank.level).toBe(2);
    expect(getNextRank(50)?.title).toBe('Concourse Runner');

    const prog = rankProgress(50);
    expect(prog.level).toBe(2);
    expect(prog.current.title).toBe('Terminal Nomad');
    expect(prog.next?.title).toBe('Concourse Runner');
    expect(prog.xpIntoRank).toBe(0);
    expect(prog.xpForNext).toBe(100);
    expect(prog.xpToNext).toBe(100);
    expect(prog.pct).toBe(0);
    expect(prog.missionsToNext).toBe(3); // ceil(100 / 40) = 3
    expect(prog.missionsToNextWithProof).toBe(2); // ceil(100 / 60) = 2
  });

  test('boundary: 149 XP returns Terminal Nomad', () => {
    expect(getRank(149).title).toBe('Terminal Nomad');
    expect(getRank(149).level).toBe(2);
    expect(getNextRank(149)?.title).toBe('Concourse Runner');
  });

  test('boundary: 150 XP returns Concourse Runner (level 3)', () => {
    const rank = getRank(150);
    expect(rank.title).toBe('Concourse Runner');
    expect(rank.level).toBe(3);
    expect(getNextRank(150)?.title).toBe('Gate Guardian');

    const prog = rankProgress(150);
    expect(prog.level).toBe(3);
    expect(prog.current.title).toBe('Concourse Runner');
    expect(prog.next?.title).toBe('Gate Guardian');
    expect(prog.xpIntoRank).toBe(0);
    expect(prog.xpForNext).toBe(150);
    expect(prog.xpToNext).toBe(150);
    expect(prog.pct).toBe(0);
  });

  test('spec bug case: 160 XP must give level 3 CONCOURSE RUNNER with xpToNext 140', () => {
    const rank = getRank(160);
    expect(rank.title).toBe('Concourse Runner');
    expect(rank.level).toBe(3);
    expect(getNextRank(160)?.title).toBe('Gate Guardian');

    const prog = rankProgress(160);
    expect(prog.level).toBe(3);
    expect(prog.current.title).toBe('Concourse Runner');
    expect(prog.next?.title).toBe('Gate Guardian');
    expect(prog.xpIntoRank).toBe(10);
    expect(prog.xpForNext).toBe(150);
    expect(prog.xpToNext).toBe(140);
    expect(prog.pct).toBe(7);
    expect(prog.missionsToNext).toBe(4); // ceil(140 / 40) = 4
    expect(prog.missionsToNextWithProof).toBe(3); // ceil(140 / 60) = 3
  });

  test('boundary: 299 XP returns Concourse Runner', () => {
    expect(getRank(299).title).toBe('Concourse Runner');
    expect(getNextRank(299)?.title).toBe('Gate Guardian');
    const prog = rankProgress(299);
    expect(prog.xpToNext).toBe(1);
    expect(prog.missionsToNext).toBe(1);
  });

  test('boundary: 300 XP returns Gate Guardian (level 4)', () => {
    const rank = getRank(300);
    expect(rank.title).toBe('Gate Guardian');
    expect(rank.level).toBe(4);
    expect(getNextRank(300)?.title).toBe('Transit Legend');

    const prog = rankProgress(300);
    expect(prog.level).toBe(4);
    expect(prog.current.title).toBe('Gate Guardian');
    expect(prog.next?.title).toBe('Transit Legend');
    expect(prog.xpIntoRank).toBe(0);
    expect(prog.xpForNext).toBe(200);
    expect(prog.xpToNext).toBe(200);
    expect(prog.pct).toBe(0);
    expect(prog.missionsToNext).toBe(5); // ceil(200 / 40) = 5
    expect(prog.missionsToNextWithProof).toBe(4); // ceil(200 / 60) = 4
  });

  test('boundary: 499 XP returns Gate Guardian', () => {
    expect(getRank(499).title).toBe('Gate Guardian');
    expect(getRank(499).level).toBe(4);
    expect(getNextRank(499)?.title).toBe('Transit Legend');
  });

  test('boundary: 500 XP returns Transit Legend (level 5 Max tier)', () => {
    const rank = getRank(500);
    expect(rank.title).toBe('Transit Legend');
    expect(rank.level).toBe(5);
    expect(getNextRank(500)).toBeNull();

    const prog = rankProgress(500);
    expect(prog.level).toBe(5);
    expect(prog.current.title).toBe('Transit Legend');
    expect(prog.next).toBeNull();
    expect(prog.xpIntoRank).toBe(0);
    expect(prog.xpToNext).toBe(0);
    expect(prog.pct).toBe(100);
    expect(prog.missionsToNext).toBe(0);
    expect(prog.missionsToNextWithProof).toBe(0);
  });

  test('boundary: 10000 XP returns Transit Legend', () => {
    const rank = getRank(10000);
    expect(rank.title).toBe('Transit Legend');
    expect(rank.level).toBe(5);
    expect(getNextRank(10000)).toBeNull();

    const prog = rankProgress(10000);
    expect(prog.current.title).toBe('Transit Legend');
    expect(prog.next).toBeNull();
    expect(prog.pct).toBe(100);
  });

  test('edge cases: negatives, NaN, and undefined guard to Gate Rookie (level 1)', () => {
    expect(getRank(-10).title).toBe('Gate Rookie');
    expect(getRank(-10).level).toBe(1);
    expect(getRank(NaN).title).toBe('Gate Rookie');
    expect(getRank(undefined).title).toBe('Gate Rookie');
    expect(getRank(null).title).toBe('Gate Rookie');
  });
});
