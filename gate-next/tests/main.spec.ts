import { test, expect } from '@playwright/test';

test.describe('GATE Layover Hackathon Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('1. Setup validation', async ({ page }) => {
    const now = new Date('2026-10-10T15:00:00Z');
    await page.clock.install({ time: now });

    // 1a. Departure in the past with rollover shows "tomorrow"
    await page.fill('input[type="time"]', '14:00');
    await expect(page.getByText(/TOMORROW/i)).toBeVisible();

    // 1b. Safe time <= 0 blocks START with a message
    await page.fill('input[type="time"]', '15:10');
    await expect(page.getByText('HEAD TO GATE NOW')).toBeVisible();
    const startBtn = page.getByRole('button', { name: /START LAYOVER/i });
    await expect(startBtn).toBeDisabled();

    // 1c. Empty gate handled (defaults to TBA)
    await page.fill('input[placeholder="B14 OR TBA"]', '');
    await page.fill('input[type="time"]', '18:00'); 
    await expect(startBtn).toBeEnabled();
    await startBtn.click();
    await expect(page.getByText('TBA')).toBeVisible(); 
  });

  test('2. Demo Mode', async ({ page }) => {
    const now = new Date('2026-10-10T15:00:00Z');
    await page.clock.install({ time: now });

    const wordmark = page.locator('span:has-text("GATE")').first();
    await wordmark.click(); await page.waitForTimeout(100);
    await wordmark.click(); await page.waitForTimeout(100);
    await wordmark.click();

    // Quest screen shown with DEMO chip
    await expect(page.getByText('DEMO')).toBeVisible();

    // Advance 45s (15s left) - heads-up
    await page.clock.fastForward(45000);
    // Usually banner + chime, let's look for START WRAPPING UP
    await expect(page.getByText(/START WRAPPING UP/i)).toBeVisible();

    // Advance 10s (5s left) - urgent
    await page.clock.fastForward(10000);
    await expect(page.getByText(/WALK TO GATE NOW/i)).toBeVisible();

    // Advance 10s (-5s left) - alarm
    await page.clock.fastForward(10000);
    await expect(page.getByRole('button', { name: 'I AM AT THE GATE' })).toBeVisible();
  });

  test('3. Alarm', async ({ page }) => {
    const now = new Date('2026-10-10T15:00:00Z');
    await page.clock.install({ time: now });

    const wordmark = page.locator('span:has-text("GATE")').first();
    await wordmark.click(); await page.waitForTimeout(100);
    await wordmark.click(); await page.waitForTimeout(100);
    await wordmark.click();
    await page.clock.fastForward(60000);
    
    // Check alarm UI
    const dismissBtn = page.getByRole('button', { name: 'I AM AT THE GATE' });
    await expect(dismissBtn).toBeVisible();
    await dismissBtn.click();

    // Safe Travels
    await expect(page.getByText(/SAFE TRAVELS/i)).toBeVisible();

    // Reset
    await page.getByRole('button', { name: /START NEW/i }).click();
    await expect(page.getByText('LAYOVER COMPANION')).toBeVisible();
  });

  test('4. Normal mode ladder', async ({ page }) => {
    const now = new Date('2026-10-10T15:00:00Z');
    await page.clock.install({ time: now });

    // departure 1.5 hours away => 90 min
    // buffer 30 + walk 10 + margin 5 = 45 min
    // returnBy = 45 min away
    await page.fill('input[type="time"]', '16:30'); 
    await page.getByRole('button', { name: /START LAYOVER/i }).click();

    // free > 15 min
    await expect(page.getByText(/START WRAPPING UP/i)).not.toBeVisible();
    await expect(page.getByText(/WALK TO GATE NOW/i)).not.toBeVisible();

    // fast forward to 14 min left (31 min forward)
    await page.clock.fastForward(31 * 60000);
    await expect(page.getByText(/START WRAPPING UP/i)).toBeVisible();

    // fast forward to 4 min left (10 min forward)
    await page.clock.fastForward(10 * 60000);
    await expect(page.getByText(/WALK TO GATE NOW/i)).toBeVisible();

    // fast forward to past 0
    await page.clock.fastForward(5 * 60000);
    await expect(page.getByRole('button', { name: 'I AM AT THE GATE' })).toBeVisible();
  });

  test('5. Stats drain', async ({ page }) => {
    const now = new Date('2026-10-10T15:00:00Z');
    await page.clock.install({ time: now });
    await page.fill('input[type="time"]', '20:00');
    await page.getByRole('button', { name: /START LAYOVER/i }).click();
    
    // Check hunger starts at 60 (vibe tired => hunger 60)
    await expect(page.locator('div').filter({ hasText: 'HUNGER' }).getByText('60', { exact: true })).toBeVisible();

    // Fast forward 10 minutes. Drain rate is 0.3/min => -3. Should be 57.
    await page.clock.fastForward(10 * 60000);
    await expect(page.locator('div').filter({ hasText: 'HUNGER' }).getByText('57', { exact: true })).toBeVisible();

    // Fast forward huge amount to clamp at 0
    await page.clock.fastForward(300 * 60000);
    await expect(page.locator('div').filter({ hasText: 'HUNGER' }).getByText('0', { exact: true })).toBeVisible();
  });

  test('6. Mission engine', async ({ page }) => {
    const now = new Date('2026-10-10T15:00:00Z');
    await page.clock.install({ time: now });
    
    await page.fill('input[type="time"]', '15:55');
    await page.getByRole('button', { name: /START LAYOVER/i }).click();

    // Check we got a mission card
    const skipBtn = page.getByRole('button', { name: /SKIP/i });
    await expect(skipBtn).toBeVisible();
    
    // Clicking skip should generate a new mission or fallback.
    // It shouldn't crash.
    await skipBtn.click();
    await expect(skipBtn).toBeVisible();
  });

  test('7. Complete adds boost and XP', async ({ page }) => {
    const now = new Date('2026-10-10T15:00:00Z');
    await page.clock.install({ time: now });
    await page.fill('input[type="time"]', '20:00');
    await page.getByRole('button', { name: /START LAYOVER/i }).click();
    
    // Check initial XP using TOTAL XP
    await expect(page.getByText('TOTAL XP').locator('..').getByText('0', { exact: true })).toBeVisible();

    // Click Complete
    await page.getByRole('button', { name: /COMPLETE/i }).click();
    
    // XP should increase
    await expect(page.locator('div').filter({ hasText: 'TOTAL XP' }).getByText('40', { exact: true }).first()).toBeVisible();

    // Rapid taps on SKIP shouldn't break state
    const skipBtn = page.getByRole('button', { name: /SKIP/i });
    for(let i=0; i<5; i++) {
      await skipBtn.click();
    }
    await expect(page.locator('div').filter({ hasText: 'TOTAL XP' }).getByText('40', { exact: true }).first()).toBeVisible();
  });

  test('8. Refresh mid-session', async ({ page }) => {
    const now = new Date('2026-10-10T15:00:00Z');
    await page.clock.install({ time: now });
    await page.fill('input[type="time"]', '20:00');
    await page.getByRole('button', { name: /START LAYOVER/i }).click();

    await page.getByRole('button', { name: /COMPLETE/i }).click();
    await expect(page.locator('div').filter({ hasText: 'TOTAL XP' }).getByText('40', { exact: true }).first()).toBeVisible();

    // Reload page
    await page.reload();
    
    // XP should still be 40
    await expect(page.locator('div').filter({ hasText: 'TOTAL XP' }).getByText('40', { exact: true }).first()).toBeVisible();

    // Advance time past returnBy (which is 19:15)
    await page.clock.fastForward(5 * 3600 * 1000);
    await page.reload();
    // Should go straight to alarm
    await expect(page.getByRole('button', { name: 'I AM AT THE GATE' })).toBeVisible();
  });

  test('9. Background simulation', async ({ page }) => {
    const now = new Date('2026-10-10T15:00:00Z');
    await page.clock.install({ time: now });
    
    // Return by in 16 mins
    await page.fill('input[type="time"]', '16:01');
    await page.getByRole('button', { name: /START LAYOVER/i }).click();
    
    // No heads up
    await expect(page.getByText(/START WRAPPING UP/i)).not.toBeVisible();

    // Pause clock 120s, resume (simulate suspend/resume). Time left is 14 mins.
    await page.clock.fastForward(120000); 
    // Usually visibilitychange or focus triggers useNow to update
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    
    // Now it should be 14 mins left -> HEADS UP
    await expect(page.getByText(/START WRAPPING UP/i)).toBeVisible();
  });

  test('10. Departure past midnight computes correctly', async ({ page }) => {
    const now = new Date('2026-10-10T23:50:00Z');
    await page.clock.install({ time: now });

    await page.fill('input[type="time"]', '00:40');
    // Departure is tomorrow 00:40
    await expect(page.getByText(/TOMORROW/i)).toBeVisible();

    // Return by is 45 mins before 00:40 => 23:55.
    // 23:55 is in the future.
    const startBtn = page.getByRole('button', { name: /START LAYOVER/i });
    await expect(startBtn).toBeEnabled();
  });
});
