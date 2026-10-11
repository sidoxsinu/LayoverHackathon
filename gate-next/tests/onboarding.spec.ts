import { test, expect } from '@playwright/test';

test.describe('Onboarding, Tour, Rank Explainer & Printable Passport', () => {

  test('1. Spotlight Tour: Setup auto-start, step navigation, and SKIP TOUR', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    try {
      await page.getByRole('button', { name: 'CONTINUE AS GUEST' }).click({ timeout: 1000 });
    } catch {}

    // Tour should appear on fresh session in Setup screen (Step 1 of 6)
    await expect(page.getByText('STEP 1 / 6')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('WELCOME TO GATE')).toBeVisible();

    // Click NEXT
    const nextBtn = page.getByRole('button', { name: 'NEXT' });
    await nextBtn.click();
    await expect(page.getByText('STEP 2 / 6')).toBeVisible();
    await expect(page.getByText('DEPARTURE TIME')).toBeVisible();

    // Click BACK
    const backBtn = page.getByRole('button', { name: 'BACK' });
    await backBtn.click();
    await expect(page.getByText('STEP 1 / 6')).toBeVisible();
    await expect(page.getByText('WELCOME TO GATE')).toBeVisible();

    // Click SKIP TOUR
    const skipTourBtn = page.getByRole('button', { name: 'SKIP TOUR' });
    await skipTourBtn.click();

    // Tour overlay should disappear
    await expect(page.getByText('STEP 1 / 6')).not.toBeVisible();

    // Check localStorage has marked setup tour as completed
    const tourState = await page.evaluate(() => localStorage.getItem('gate.tour.v1'));
    expect(tourState).toBeTruthy();
    const parsed = JSON.parse(tourState || '{}');
    expect(parsed.setup).toBe(true);
  });

  test('2. Spotlight Tour: HOW IT WORKS restarts tour', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('gate.tour.v1', JSON.stringify({ setup: true, quest: true, safe: true, passport: true }));
    });
    try {
      await page.getByRole('button', { name: 'CONTINUE AS GUEST' }).click({ timeout: 1000 });
    } catch {}

    // Tour is not visible because it was marked completed
    await expect(page.getByText('STEP 1 / 6')).not.toBeVisible();

    // Click HOW IT WORKS in footer
    const howItWorksBtn = page.getByRole('button', { name: 'HOW IT WORKS' });
    await expect(howItWorksBtn).toBeVisible();
    await howItWorksBtn.click();

    // Tour restarts at Step 1
    await expect(page.getByText('STEP 1 / 6')).toBeVisible();
    await expect(page.getByText('WELCOME TO GATE')).toBeVisible();

    // Skip to dismiss
    await page.getByRole('button', { name: 'SKIP TOUR' }).click();
    await expect(page.getByText('STEP 1 / 6')).not.toBeVisible();
  });

  test('3. Spotlight Tour: Demo Mode does not auto-run tour', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    try {
      await page.getByRole('button', { name: 'CONTINUE AS GUEST' }).click({ timeout: 1000 });
    } catch {}

    // Dismiss setup tour if up
    try {
      await page.getByRole('button', { name: 'SKIP TOUR' }).click({ timeout: 1500 });
    } catch {}

    // Clear quest tour from state so fresh quest would normally trigger it
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('gate.tour.v1') || '{}');
      delete state.quest;
      localStorage.setItem('gate.tour.v1', JSON.stringify(state));
    });

    // Triple tap GATE wordmark for Demo Mode
    const wordmark = page.locator('span:has-text("GATE")').first();
    await wordmark.click();
    await page.waitForTimeout(100);
    await wordmark.click();
    await page.waitForTimeout(100);
    await wordmark.click();

    // Should mount Quest in DEMO mode immediately
    await expect(page.getByText('DEMO', { exact: true })).toBeVisible();

    // Quest tour should NEVER appear in DEMO mode
    await page.waitForTimeout(600);
    await expect(page.getByText('STEP 1 / 8')).not.toBeVisible();
  });

  test('4. Rank Explainer in /passport: ladder, tiers, meanings and missions estimate', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/passport');
    await page.evaluate(() => {
      localStorage.clear();
      // Pre-seed a layover with 160 XP (Concourse Runner) in gate.sync_queue
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

    // Rank title and Level info displayed
    await expect(page.getByText('CONCOURSE RUNNER').first()).toBeVisible();
    await expect(page.getByText('LEVEL 3 OF 5').first()).toBeVisible();
    await expect(page.getByText('140 XP TO GATE GUARDIAN')).toBeVisible();

    // Click "WHAT IS THIS?" button
    const explainBtn = page.getByRole('button', { name: 'WHAT IS THIS?' });
    await expect(explainBtn).toBeVisible();
    await explainBtn.click();

    // Modal opens
    const dialog = page.getByRole('dialog', { name: 'Ranks and XP' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('HOW TO EARN XP')).toBeVisible();
    await expect(dialog.getByText('+40')).toBeVisible();
    await expect(dialog.getByText('+20')).toBeVisible();
    await expect(dialog.getByText('XP IS NEVER LOST')).toBeVisible();

    // Ladder table checks
    await expect(dialog.getByText('Gate Rookie', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Terminal Nomad', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Concourse Runner', { exact: true }).first()).toBeVisible();
    await expect(dialog.getByText('Gate Guardian', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Transit Legend', { exact: true })).toBeVisible();

    // Spec meanings present
    await expect(dialog.getByText('JUST LANDED. YOUR FIRST LAYOVER.')).toBeVisible();
    await expect(dialog.getByText('YOU KNOW HOW TO FILL AN AIRPORT HOUR.')).toBeVisible();
    await expect(dialog.getByText('YOU OWN THE CONCOURSE.')).toBeVisible();
    await expect(dialog.getByText('YOU NEVER MISS A BOARDING CALL.')).toBeVisible();
    await expect(dialog.getByText('TOP RANK. THE TERMINAL KNOWS YOUR NAME.')).toBeVisible();

    // Current rank highlighted with YOU ARE HERE
    await expect(dialog.getByText('YOU ARE HERE')).toBeVisible();

    // Mission estimates line present
    await expect(dialog.getByText(/ABOUT 4 MISSIONS, OR 3 WITH PHOTO PROOF/i)).toBeVisible();

    // Close button dismisses sheet
    await page.getByRole('button', { name: 'CLOSE' }).first().click();
    await expect(page.getByText('RANKS AND XP')).not.toBeVisible();
  });

  test('5. InfoTips: click opens popover, shows plain guidance, closes on click outside', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('gate.tour.v1', JSON.stringify({ setup: true, quest: true, safe: true, passport: true }));
    });
    try {
      await page.getByRole('button', { name: 'CONTINUE AS GUEST' }).click({ timeout: 1000 });
    } catch {}

    // Find the InfoTip next to SAFE TIME by its label "Safe time information"
    const safeTimeTipBtn = page.getByRole('button', { name: 'Safe time information' });
    await expect(safeTimeTipBtn).toBeVisible();
    await safeTimeTipBtn.click();

    // Popover is visible with safe time explanation
    await expect(page.getByText(/MINUTES LEFT BEFORE YOU MUST HEAD TO THE GATE/i)).toBeVisible();

    // Click outside on the heading to close
    await page.locator('span:has-text("GATE")').first().click();
    await expect(page.getByText(/MINUTES LEFT BEFORE YOU MUST HEAD TO THE GATE/i)).not.toBeVisible();
  });

  test('6. Printable Passport: /passport/print renders print document with stats and stamps', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/passport/print');
    await page.evaluate(() => {
      const mockLayovers = [
        {
          id: 'layover-print-test',
          state: {
            airportName: 'DXB / DUBAI',
            gate: 'B22',
            departureMs: Date.now() + 7200000,
            returnByMs: Date.now() + 3600000,
            startedMs: Date.now() - 7200000,
            xp: 160,
            tripName: 'EK501 DUBAI',
            log: [
              {
                id: 'm1',
                text: 'FIND POWER',
                status: 'completed',
                xp: 40,
                ts: Date.now() - 3600000,
                proofPath: 'mock/path.jpg',
                proofStatus: 'verified',
                proofXp: 20
              }
            ]
          },
          survivedSeconds: 7200
        }
      ];
      localStorage.setItem('gate.sync_queue', JSON.stringify(mockLayovers));
    });
    await page.reload();

    // Official passport header and certificate details
    await expect(page.getByText('GATE LAYOVER PASSPORT')).toBeVisible();
    await expect(page.getByText('CONCOURSE CLEARED')).toBeVisible();
    await expect(page.getByText('CONCOURSE RUNNER').first()).toBeVisible();
    await expect(page.getByText('LEVEL 3 OF 5')).toBeVisible();
    await expect(page.getByText('PASSPORT SUMMARY')).toBeVisible();

    // Stats table
    await expect(page.getByText('EK501 DUBAI')).toBeVisible();
    await expect(page.getByText('DXB / DUBAI')).toBeVisible();
    await expect(page.getByText('B22')).toBeVisible();

    // Print button exists and has 48px target
    const printBtn = page.getByRole('button', { name: 'PRINT / SAVE PDF' });
    await expect(printBtn).toBeVisible();
    const box = await printBtn.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(48);
  });
});
