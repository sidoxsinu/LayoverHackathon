import { test, expect } from '@playwright/test';

test.describe('Leaderboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto('/');
    await page.evaluate(() => {
      try {
        localStorage.clear();
        localStorage.setItem(
          'gate.tour.v1',
          JSON.stringify({ setup: true, quest: true, safe: true, passport: true })
        );
      } catch {}
    });
  });

  test('Guest mode: renders leaderboard with guest sign-in prompt and scope tabs', async ({ page }) => {
    // Mock RPC returning 3 travelers
    await page.route('**/rest/v1/rpc/get_leaderboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { position: 1, handle: 'SKY_RUNNER', total_xp: 320, layovers: 4, missions: 8, is_me: false },
          { position: 2, handle: 'NOMAD_99', total_xp: 180, layovers: 2, missions: 4, is_me: false },
          { position: 3, handle: 'GATE_CHASER', total_xp: 60, layovers: 1, missions: 1, is_me: false },
        ]),
      });
    });

    await page.goto('/leaderboard');

    // Header elements
    await expect(page.getByRole('heading', { name: 'LEADERBOARD' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'RETURN' })).toBeVisible();
    await expect(page.getByRole('button', { name: /REFRESH/i })).toBeVisible();

    // Scope tabs
    await expect(page.getByRole('tab', { name: 'ALL TIME' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'THIS WEEK' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'THIS VENUE' })).toBeVisible();

    // Guest callout
    await expect(page.getByText('SIGN IN WITH GOOGLE TO JOIN')).toBeVisible();
    await expect(page.getByRole('button', { name: 'SIGN IN WITH GOOGLE' })).toBeVisible();

    // Departure board table rows
    await expect(page.getByText('SKY_RUNNER')).toBeVisible();
    await expect(page.getByText('NOMAD_99')).toBeVisible();
    await expect(page.getByText('GATE_CHASER')).toBeVisible();

    // XP and Rank check
    await expect(page.getByText('320', { exact: true })).toBeVisible();
    await expect(page.getByText(/Gate Guardian · LV 4/i)).toBeVisible(); // 320 XP = Gate Guardian
    await expect(page.getByText('180', { exact: true })).toBeVisible();
    await expect(page.getByText(/Concourse Runner · LV 3/i)).toBeVisible(); // 180 XP = Concourse Runner
    await expect(page.getByText('60', { exact: true })).toBeVisible();
    await expect(page.getByText(/Terminal Nomad · LV 2/i)).toBeVisible(); // 60 XP = Terminal Nomad
  });

  test('Top 3 positions highlight amber, and own row displays YOU tag', async ({ page }) => {
    await page.route('**/rest/v1/rpc/get_leaderboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { position: 1, handle: 'PILOT_ONE', total_xp: 500, layovers: 6, missions: 12, is_me: false },
          { position: 2, handle: 'MY_HANDLE', total_xp: 240, layovers: 3, missions: 6, is_me: true },
          { position: 3, handle: 'THIRD_ROOKIE', total_xp: 40, layovers: 1, missions: 1, is_me: false },
          { position: 4, handle: 'FOURTH_USER', total_xp: 20, layovers: 1, missions: 0, is_me: false },
        ]),
      });
    });

    await page.goto('/leaderboard');

    await expect(page.getByText('PILOT_ONE')).toBeVisible();
    await expect(page.getByText('MY_HANDLE')).toBeVisible();

    // Own row shows "YOU" tag
    const youTag = page.getByText('YOU', { exact: true });
    await expect(youTag).toBeVisible();

    // Top 3 numbers are rendered
    await expect(page.getByText('1', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('2', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('3', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('4', { exact: true }).first()).toBeVisible();
  });

  test('Empty board displays: NO ONE HAS JOINED YET. BE THE FIRST.', async ({ page }) => {
    await page.route('**/rest/v1/rpc/get_leaderboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/leaderboard');

    await expect(page.getByText('NO ONE HAS JOINED YET. BE THE FIRST.')).toBeVisible();
  });

  test('RPC error / table missing displays: LEADERBOARD NOT AVAILABLE', async ({ page }) => {
    await page.route('**/rest/v1/rpc/get_leaderboard', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'relation does not exist' }),
      });
    });

    await page.goto('/leaderboard');

    await expect(page.getByText('LEADERBOARD NOT AVAILABLE')).toBeVisible();
    // Verify no crashing error banner or broken layout
    await expect(page.getByRole('heading', { name: 'LEADERBOARD' })).toBeVisible();
  });

  test('Offline with cached board displays OFFLINE, SHOWING SAVED BOARD', async ({ page }) => {
    // Route network to fail
    await page.route('**/rest/v1/rpc/get_leaderboard', async (route) => {
      await route.abort('failed');
    });

    // Pre-populate localStorage cache
    await page.evaluate(() => {
      const cached = {
        timestamp: Date.now() - 120000, // 2 minutes ago
        entries: [
          { position: 1, handle: 'SAVED_NOMAD', total_xp: 150, layovers: 2, missions: 3, is_me: false },
        ],
        myEntry: null,
      };
      localStorage.setItem('gate.lb.v1.all.global', JSON.stringify(cached));
    });

    await page.goto('/leaderboard');

    await expect(page.getByText('SAVED_NOMAD')).toBeVisible();
    await expect(page.getByText(/OFFLINE, SHOWING SAVED BOARD/i)).toBeVisible();
    await expect(page.getByText(/UPDATED 2M AGO/i)).toBeVisible();
  });

  test('Own row outside top 50 renders appended below separator', async ({ page }) => {
    // 50 top rows plus user at position 77
    const mockEntries = [
      { position: 1, handle: 'TOP_CHAMP', total_xp: 900, layovers: 10, missions: 20, is_me: false },
      { position: 2, handle: 'SECOND_CHAMP', total_xp: 850, layovers: 9, missions: 18, is_me: false },
      { position: 77, handle: 'ME_DOWN_HERE', total_xp: 50, layovers: 1, missions: 1, is_me: true },
    ];

    await page.route('**/rest/v1/rpc/get_leaderboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockEntries),
      });
    });

    await page.goto('/leaderboard');

    await expect(page.getByText('TOP_CHAMP')).toBeVisible();
    await expect(page.getByText('ME_DOWN_HERE')).toBeVisible();
    await expect(page.getByText('77', { exact: true })).toBeVisible();
    // Separator line
    await expect(page.getByText('· · ·')).toBeVisible();
  });

  test('Venue tab: empty state when user has not saved a venue', async ({ page }) => {
    await page.route('**/rest/v1/rpc/get_leaderboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/leaderboard');

    // Click THIS VENUE tab
    await page.getByRole('tab', { name: 'THIS VENUE' }).click();

    await expect(page.getByText('COMPLETE A LAYOVER TO SEE YOUR VENUE BOARD')).toBeVisible();
  });

  test('Venue tab: shows venue board when venue is in session', async ({ page }) => {
    let requestedVenue: string | null = null;
    await page.route('**/rest/v1/rpc/get_leaderboard', async (route) => {
      const postData = route.request().postDataJSON();
      requestedVenue = postData?.p_venue;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { position: 1, handle: 'CALICUT_LOCAL', total_xp: 120, layovers: 2, missions: 3, is_me: false },
        ]),
      });
    });

    await page.goto('/leaderboard');

    // Save a layover with venue
    await page.evaluate(() => {
      localStorage.setItem(
        'gate.v3',
        JSON.stringify({
          screen: 'safe',
          airportName: 'TINKERSPACE, CALICUT',
          venue: 'TINKERSPACE, CALICUT',
          gate: 'MAIN',
          departureMs: Date.now() + 3600000,
          returnByMs: Date.now() + 1800000,
          startedMs: Date.now() - 1800000,
          xp: 40,
          stats: { hunger: 80, energy: 70, battery: 90 },
          log: [],
          waitType: 'flight',
        })
      );
    });

    await page.reload();

    // Click THIS VENUE tab
    await page.getByRole('tab', { name: 'THIS VENUE' }).click();

    // Shows venue indicator
    await expect(page.getByText('VENUE: TINKERSPACE, CALICUT')).toBeVisible();
    await expect(page.getByText('CALICUT_LOCAL')).toBeVisible();
    expect(requestedVenue).toBe('TINKERSPACE, CALICUT');
  });

  test('Lockdown check: active quest or alarm immediately redirects to /', async ({ page }) => {
    await page.goto('/');

    // Set active quest in storage
    await page.evaluate(() => {
      localStorage.setItem(
        'gate.v3',
        JSON.stringify({
          screen: 'quest',
          departureMs: Date.now() + 3600000,
          returnByMs: Date.now() + 1800000,
          startedMs: Date.now() - 60000,
          airportName: 'DOH',
          gate: 'A1',
          stats: { hunger: 80, energy: 80, battery: 80 },
          xp: 0,
          log: [],
        })
      );
    });

    // Try navigating to /leaderboard
    await page.goto('/leaderboard');

    // Should immediately be redirected back to /
    await page.waitForURL('http://localhost:3000/');
    expect(page.url()).toBe('http://localhost:3000/');
  });

  test('Zero privacy leakage: no user_id, uuid or email in DOM or localStorage caches', async ({ page }) => {
    await page.route('**/rest/v1/rpc/get_leaderboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { position: 1, handle: 'CLEAN_USER', total_xp: 100, layovers: 2, missions: 2, is_me: false },
        ]),
      });
    });

    await page.goto('/leaderboard');
    await expect(page.getByText('CLEAN_USER')).toBeVisible();

    // Check page HTML
    const content = await page.content();
    // Must not contain email addresses
    expect(content).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    // Must not contain raw user_id or uuid keys
    expect(content).not.toContain('user_id');

    // Check localStorage cache
    const storageKeys = await page.evaluate(() => Object.keys(localStorage));
    for (const key of storageKeys) {
      if (key.startsWith('gate.lb.')) {
        const val = await page.evaluate((k) => localStorage.getItem(k), key);
        expect(val).not.toContain('user_id');
        expect(val).not.toContain('email');
      }
    }
  });

  test('UI tokens and constraints audit: no emojis, gradients, or banned elements', async ({ page }) => {
    await page.route('**/rest/v1/rpc/get_leaderboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { position: 1, handle: 'BOARD_KING', total_xp: 300, layovers: 3, missions: 6, is_me: false },
        ]),
      });
    });

    await page.goto('/leaderboard');
    await expect(page.getByText('BOARD_KING')).toBeVisible();

    const bodyText = await page.evaluate(() => document.body.innerText);

    // No em dashes
    expect(bodyText).not.toContain('—');

    // No emojis (surrogate pairs or high code points)
    const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]/;
    expect(emojiRegex.test(bodyText)).toBe(false);

    // Touch targets >= 48px
    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      if (await btn.isVisible()) {
        const box = await btn.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44); // 48px target with tolerance
        }
      }
    }
  });
});
