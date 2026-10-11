import { test, expect } from '@playwright/test';

test.describe('Venue and Waiting Type E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      try {
        localStorage.clear();
        localStorage.setItem('gate.tour.v1', JSON.stringify({ setup: true, quest: true, safe: true, passport: true }));
      } catch {}
    });
    try {
      await page.getByRole('button', { name: 'CONTINUE AS GUEST' }).click({ timeout: 2000 });
    } catch {}
    await expect(page.locator('[data-tour="setup-departure"]')).toBeVisible({ timeout: 5000 });
  });

  test('setup screen displays WAITING FOR and VENUE inputs', async ({ page }) => {
    // Verify WAITING FOR selector is present with default FLIGHT
    await expect(page.locator('[data-tour="setup-waittype"]')).toBeVisible();
    await expect(page.locator('[data-tour="setup-waittype"]')).toContainText('FLIGHT');

    // Verify VENUE input is present
    await expect(page.locator('[data-tour="setup-venue"]')).toBeVisible();
    const venueInput = page.locator('[data-tour="setup-venue"] input');
    await expect(venueInput).toBeVisible();
    await expect(page.locator('[data-tour="setup-venue"]')).toContainText('LEAVE EMPTY FOR STANDARD MISSIONS');
  });

  test('changing WAITING FOR to TRAIN updates place label to PLATFORM', async ({ page }) => {
    // Open WAITING FOR dropdown
    const waitTypeDropdown = page.locator('[data-tour="setup-waittype"] button[aria-haspopup="listbox"]');
    await waitTypeDropdown.click();

    // Select TRAIN option
    const trainOption = page.getByRole('option', { name: /TRAIN/i });
    await expect(trainOption).toBeVisible();
    await trainOption.click();

    // Verify labels updated across setup
    await expect(page.locator('[data-tour="setup-gate"]')).toContainText('PLATFORM');
    await expect(page.locator('[data-tour="setup-walk"]')).toContainText('WALK TO PLATFORM');
  });

  test('starting quest starts IMMEDIATELY without blocking on /api/venue-missions', async ({ page }) => {
    let apiCalled = false;

    // Route /api/venue-missions with a delayed response to prove start does not wait
    await page.route('**/api/venue-missions', async (route) => {
      apiCalled = true;
      // Delay for 3 seconds
      await new Promise((r) => setTimeout(r, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          venueKnown: true,
          venueSummary: 'Makerspace in Calicut',
          missions: [
            { tag: 'FOOD', title: 'Find water station', mins: 5, proof: 'photo', proofHint: 'WATER' },
            { tag: 'PLUG', title: 'Charge laptop safely', mins: 10, proof: 'photo', proofHint: 'CHARGER' },
            { tag: 'MOVE', title: 'Walk around room', mins: 5, proof: 'none' },
            { tag: 'SPOT', title: 'Find high tech tool', mins: 8, proof: 'photo', proofHint: 'TOOL' },
            { tag: 'MEET', title: 'Ask what people build', mins: 10, social: true, proof: 'none' },
          ],
        }),
      });
    });

    // Set duration to 2 hours
    const durationBtn = page.getByRole('button', { name: 'IN X H Y M' });
    await durationBtn.click();

    // Set venue
    const venueInput = page.locator('[data-tour="setup-venue"] input');
    await venueInput.fill('TINKERSPACE CALICUT');

    const startBtn = page.getByRole('button', { name: /START (WAIT|LAYOVER)/i });
    await expect(startBtn).toBeEnabled();

    const startTs = Date.now();
    await startBtn.click();

    // Verify quest screen mounted in under 1 second (did NOT wait for the 3s API call)
    await expect(page.locator('[data-tour="quest-countdown"]')).toBeVisible({ timeout: 1500 });
    const elapsed = Date.now() - startTs;
    expect(elapsed).toBeLessThan(2000);
    expect(apiCalled).toBe(true);
  });

  test('failed /api/venue-missions falls back gracefully without popup errors', async ({ page }) => {
    await page.route('**/api/venue-missions', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'SERVER_ERROR' }),
      });
    });

    const durationBtn = page.getByRole('button', { name: 'IN X H Y M' });
    await durationBtn.click();

    const venueInput = page.locator('[data-tour="setup-venue"] input');
    await venueInput.fill('SOME UNKNOWN VENUE');

    const startBtn = page.getByRole('button', { name: /START (WAIT|LAYOVER)/i });
    await startBtn.click();

    // Verify quest mounts with static missions and no error modal
    await expect(page.locator('[data-tour="quest-mission"]')).toBeVisible();
    await expect(page.locator('text=SERVER_ERROR')).not.toBeVisible();
    await expect(page.locator('text=ERROR')).not.toBeVisible();
  });

  test('demo mode triggers ZERO calls to /api/venue-missions', async ({ page }) => {
    let apiCallCount = 0;
    await page.route('**/api/venue-missions', (route) => {
      apiCallCount++;
      route.fulfill({ status: 200, body: JSON.stringify({ success: true, missions: [] }) });
    });

    // Triple tap wordmark
    const wordmark = page.locator('span:has-text("GATE")').first();
    await wordmark.click();
    await page.waitForTimeout(100);
    await wordmark.click();
    await page.waitForTimeout(100);
    await wordmark.click();

    await expect(page.getByText('DEMO', { exact: true })).toBeVisible();
    expect(apiCallCount).toBe(0);
  });
});
