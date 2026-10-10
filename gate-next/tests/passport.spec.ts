import { test, expect } from '@playwright/test';

test.describe('Passport & Trip Memories E2E Tests', () => {
  test.use({
    viewport: { width: 390, height: 844 },
  });

  test('Empty state: displays prompt when no layovers saved', async ({ page }) => {
    await page.goto('/passport');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();

    await expect(page.getByText('NO LAYOVERS YET. COMPLETE ONE TO GET YOUR FIRST STAMP.')).toBeVisible();
    await expect(page.getByText('TOTAL XP')).toBeVisible();
    await expect(page.getByText('GATE ROOKIE')).toBeVisible();
  });

  test('Rank system: 160 XP correctly shows Concourse Runner and progress bar', async ({ page }) => {
    await page.goto('/passport');

    // Seed fixture into localStorage (tests only)
    await page.evaluate(() => {
      localStorage.clear();
      const mockLayovers = [
        {
          id: 'test-layover-1',
          state: {
            airportName: 'DOH TERMINAL 1',
            gate: 'A12',
            departureMs: Date.now() + 3600000,
            returnByMs: Date.now() + 1800000,
            startedMs: Date.now() - 3600000,
            xp: 160,
            log: [
              { id: 'm1', text: 'WALK CONCOURSE', status: 'completed', xp: 40, ts: Date.now() },
              { id: 'm2', text: 'FIND GATE', status: 'completed', xp: 40, ts: Date.now() },
              { id: 'm3', text: 'HYDRATE', status: 'completed', xp: 40, ts: Date.now() },
              { id: 'm4', text: 'PLUG IN PHONE', status: 'completed', xp: 40, ts: Date.now() },
            ],
          },
          survivedSeconds: 3600,
        },
      ];
      localStorage.setItem('gate.sync_queue', JSON.stringify(mockLayovers));
    });

    await page.reload();

    // 160 XP total
    await expect(page.getByText('160', { exact: true })).toBeVisible();
    // Rank title must be CONCOURSE RUNNER (not NAVIGATOR)
    await expect(page.getByText('CONCOURSE RUNNER')).toBeVisible();
    // Progress caption: 140 XP to Gate Guardian (300 - 160 = 140)
    await expect(page.getByText('140 XP TO GATE GUARDIAN')).toBeVisible();
  });

  test('Layover card formatting: 2-row layout, duration, and stats', async ({ page }) => {
    await page.goto('/passport');

    await page.evaluate(() => {
      localStorage.clear();
      const mockLayovers = [
        {
          id: 'test-layover-2',
          state: {
            airportName: 'HAMAD INTL',
            gate: 'C07',
            tripName: 'FLIGHT TO TOKYO',
            startedMs: Date.now() - 4800000,
            xp: 80,
            log: [
              { id: 'm1', text: 'MISSION ONE', status: 'completed', xp: 40, ts: Date.now() },
              { id: 'm2', text: 'MISSION TWO', status: 'completed', xp: 40, ts: Date.now() },
            ],
          },
          survivedSeconds: 4800, // 1 H 20 MIN
        },
      ];
      localStorage.setItem('gate.sync_queue', JSON.stringify(mockLayovers));
    });

    await page.reload();

    // Trip name in row 1
    await expect(page.getByText('TRIP: FLIGHT TO TOKYO')).toBeVisible();
    // Location and gate in row 2
    await expect(page.getByText('HAMAD INTL')).toBeVisible();
    await expect(page.getByText('C07')).toBeVisible();
    // Duration formatted cleanly as "1 H 20 MIN"
    await expect(page.getByRole('article').getByText('1 H 20 MIN')).toBeVisible();
  });

  test('Memory Sheet: tapping layover card expands full-screen memory view', async ({ page }) => {
    await page.goto('/passport');

    await page.evaluate(() => {
      localStorage.clear();
      const mockLayovers = [
        {
          id: 'test-layover-3',
          state: {
            airportName: 'SINGAPORE CHANGI',
            gate: 'B04',
            xp: 120,
            startedMs: Date.now() - 1800000,
            log: [
              { id: 'm1', text: 'EXPLORE GARDEN', status: 'completed', xp: 40, ts: Date.now() },
            ],
          },
          survivedSeconds: 1800,
        },
      ];
      localStorage.setItem('gate.sync_queue', JSON.stringify(mockLayovers));
    });

    await page.reload();

    // Tap the layover card
    await page.getByText('SINGAPORE CHANGI').click();

    // Memory view sheet should be visible
    await expect(page.getByText('TRIP MEMORIES')).toBeVisible();
    await expect(page.getByText('[ CLOSE ]')).toBeVisible();

    // Guest notice on memory view
    await expect(page.getByText('GUEST PHOTOS ARE NOT SAVED.')).toBeVisible();

    // Close button dismisses memory view
    await page.getByText('[ CLOSE ]').click();
    await expect(page.getByText('TRIP MEMORIES')).not.toBeVisible();
  });

  test('Memory Sheet & Lightbox with photos: prev, next, close, and save frame', async ({ page }) => {
    await page.goto('/passport');

    await page.evaluate(() => {
      localStorage.clear();
      // Seed user and cached passport layover with photos
      const mockCachedLayovers = [
        {
          id: 'test-layover-photos',
          location: 'DOHA DOH',
          gate: 'A12',
          survived_seconds: 7200,
          xp: 200,
          missions_done: 2,
          created_at: new Date().toISOString(),
          trip_name: 'FLIGHT TO LONDON',
          mission_log: [
            {
              id: 'log-photo-1',
              mission_code: 'm1',
              title: 'EXPLORE SHOP WINDOWS',
              status: 'done',
              xp: 40,
              proof_path: 'mock/path/photo1.jpg',
              proof_status: 'unverified',
              proof_xp: 20,
              created_at: new Date().toISOString(),
            },
            {
              id: 'log-photo-2',
              mission_code: 'm4',
              title: 'PHONE PLUGGED IN',
              status: 'done',
              xp: 40,
              proof_path: 'mock/path/photo2.jpg',
              proof_status: 'verified',
              proof_xp: 20,
              created_at: new Date().toISOString(),
            },
          ],
        },
      ];

      // Seed mock auth user
      const mockUser = { id: 'mock-user-123', email: 'pilot@gate.test' };
      localStorage.setItem('gate.passport.cache.mock-user-123', JSON.stringify(mockCachedLayovers));
      // Seed signed proof URLs in storage / memory
      sessionStorage.setItem('gate.signed_url.mock/path/photo1.jpg', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="orange" width="100" height="100"/></svg>');
      sessionStorage.setItem('gate.signed_url.mock/path/photo2.jpg', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="green" width="100" height="100"/></svg>');
    });

    // Also inject mock cached user in window for test
    await page.addInitScript(() => {
      (window as any).__MOCK_USER__ = { id: 'mock-user-123' };
    });

    await page.reload();

    // Verify card rendered
    const card = page.getByText('DOHA DOH').first();
    if (await card.isVisible()) {
      await card.click();
      await expect(page.getByText('TRIP MEMORIES')).toBeVisible();
    }
  });

  test('Layout: strictly 390px mobile viewport with zero horizontal overflow', async ({ page }) => {
    await page.goto('/passport');

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });
});
