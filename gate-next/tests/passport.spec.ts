import { test, expect } from '@playwright/test';

test.describe('Passport & Trip Memories E2E Tests', () => {
  test('Empty state: displays prompt when no layovers saved', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/passport');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();

    await expect(page.getByText('NO LAYOVERS YET. COMPLETE ONE TO GET YOUR FIRST STAMP.')).toBeVisible();
    await expect(page.getByText('TOTAL XP')).toBeVisible();
    await expect(page.getByText('GATE ROOKIE').first()).toBeVisible();
  });

  test('Rank system: 160 XP correctly shows Concourse Runner and progress bar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/passport');

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

    await expect(page.getByText('160', { exact: true })).toBeVisible();
    await expect(page.getByText('CONCOURSE RUNNER')).toBeVisible();
    await expect(page.getByText('140 XP TO GATE GUARDIAN')).toBeVisible();
  });

  test('Layover card formatting: 2-row layout, duration, and stats', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
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
          survivedSeconds: 4800,
        },
      ];
      localStorage.setItem('gate.sync_queue', JSON.stringify(mockLayovers));
    });

    await page.reload();

    await expect(page.getByText('TRIP: FLIGHT TO TOKYO')).toBeVisible();
    await expect(page.getByText('HAMAD INTL')).toBeVisible();
    await expect(page.getByText('C07')).toBeVisible();
    await expect(page.getByRole('article').getByText('1 H 20 MIN')).toBeVisible();
  });

  test('Trip Memories sheet: opaque background, inert page behind, elementFromPoint hit-test, singular "1 PHOTO"', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/passport');

    const svgPhoto = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="orange" width="100" height="100"/></svg>';

    await page.evaluate((img) => {
      localStorage.clear();
      const mockLayovers = [
        {
          id: 'test-layover-1photo',
          state: {
            airportName: 'DOHA DOH',
            gate: 'A12',
            tripName: 'FLIGHT TO CALICUT',
            startedMs: Date.now() - 1800000,
            xp: 60,
            log: [
              {
                id: 'm1',
                text: 'FIND QUIET SPOT',
                status: 'completed',
                xp: 40,
                proofXp: 20,
                proof_path: img,
                proof_status: 'unverified',
                ts: Date.now(),
              },
            ],
          },
          survivedSeconds: 1800,
        },
      ];
      localStorage.setItem('gate.sync_queue', JSON.stringify(mockLayovers));
    }, svgPhoto);

    await page.reload();

    // Verify copy fix: singular "1 PHOTO" on card
    await expect(page.getByRole('article').getByText('1 PHOTO', { exact: true })).toBeVisible();

    // Tap layover card to open Trip Memories sheet
    await page.getByRole('article').click();

    // Sheet should be open in portal
    const sheetHeader = page.getByText('TRIP MEMORIES');
    await expect(sheetHeader).toBeVisible();

    // 1. Check background opacity of sheet: solid #101010 (rgb(16, 16, 16))
    const sheetBg = await page.evaluate(() => {
      const sheet = document.querySelector('[aria-label="Trip Memories"]');
      if (!sheet) return null;
      const comp = window.getComputedStyle(sheet);
      return {
        bg: comp.backgroundColor,
        opacity: comp.opacity,
      };
    });
    expect(sheetBg?.bg).toBe('rgb(16, 16, 16)');
    expect(sheetBg?.opacity).toBe('1');

    // 2. Assert passport header text is NOT hit-testable while sheet is open
    // elementFromPoint at the top of the viewport returns an element inside the sheet, NOT the passport header
    const hitElement = await page.evaluate(() => {
      const el = document.elementFromPoint(100, 20);
      return el ? el.closest('[aria-label="Trip Memories"]') !== null : false;
    });
    expect(hitElement).toBe(true);

    // 3. Assert passport page root has inert attribute and aria-hidden="true"
    const isRootInert = await page.evaluate(() => {
      const passportRoot = document.querySelector('.min-h-\\[100dvh\\].bg-ink.flex.flex-col');
      return passportRoot?.hasAttribute('inert') && passportRoot?.getAttribute('aria-hidden') === 'true';
    });
    expect(isRootInert).toBe(true);

    // 4. Exactly one header row visible: "TRIP MEMORIES" and "CLOSE"
    await expect(page.getByText('TRIP MEMORIES')).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Trip Memories' }).getByRole('button', { name: 'CLOSE', exact: true })).toBeVisible();
    await expect(page.getByText('CAPTURED FRAMES (1 PHOTO)')).toBeVisible();

    // 5. Open Lightbox by clicking the frame
    await page.getByRole('button', { name: /Open framed photo/i }).click();

    // Lightbox should open
    await expect(page.getByText('1 / 1')).toBeVisible();

    // 6. Test Lightbox CLOSE returns to sheet (not passport)
    await page.getByRole('dialog', { name: 'Photo Lightbox' }).getByRole('button', { name: 'CLOSE', exact: true }).click();
    await expect(page.getByText('1 / 1')).not.toBeVisible();
    await expect(page.getByText('TRIP MEMORIES')).toBeVisible(); // Still in sheet!

    // 7. Test Esc key closes sheet and restores passport
    await page.keyboard.press('Escape');
    await expect(page.getByText('TRIP MEMORIES')).not.toBeVisible();

    // Assert inert attribute removed on passport page
    const isRootRestored = await page.evaluate(() => {
      const passportRoot = document.querySelector('.min-h-\\[100dvh\\].bg-ink.flex.flex-col');
      return !passportRoot?.hasAttribute('inert');
    });
    expect(isRootRestored).toBe(true);
  });

  test('Trip Memories with 3+ photos: plural "3 PHOTOS", grid layout, lightbox navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/passport');

    const svgPhoto = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="green" width="100" height="100"/></svg>';

    await page.evaluate((img) => {
      localStorage.clear();
      const mockLayovers = [
        {
          id: 'test-layover-3photos',
          state: {
            airportName: 'HEATHROW LHR',
            gate: 'B22',
            startedMs: Date.now() - 3600000,
            xp: 140,
            log: [
              { id: 'm1', text: 'EXPLORE SHOP', status: 'completed', xp: 40, proofXp: 20, proof_path: img, proof_status: 'verified', ts: Date.now() },
              { id: 'm2', text: 'CHARGE PHONE', status: 'completed', xp: 40, proofXp: 20, proof_path: img, proof_status: 'unverified', ts: Date.now() },
              { id: 'm3', text: 'EAT MEAL', status: 'completed', xp: 40, proofXp: 20, proof_path: img, proof_status: 'unverified', ts: Date.now() },
            ],
          },
          survivedSeconds: 3600,
        },
      ];
      localStorage.setItem('gate.sync_queue', JSON.stringify(mockLayovers));
    }, svgPhoto);

    await page.reload();

    // Verify copy fix: plural "3 PHOTOS" on card
    await expect(page.getByRole('article').getByText('3 PHOTOS')).toBeVisible();

    // Open sheet
    await page.getByRole('article').click();
    await expect(page.getByText('CAPTURED FRAMES (3 PHOTOS)')).toBeVisible();

    // Verify 3 frames present
    const frames = page.getByRole('button', { name: /Open framed photo/i });
    await expect(frames).toHaveCount(3);

    // Open first frame in lightbox
    await frames.first().click();
    await expect(page.getByText('1 / 3')).toBeVisible();

    // Navigate NEXT using exact: true to avoid Next.js dev logo conflict
    await page.getByRole('button', { name: 'NEXT', exact: true }).click();
    await expect(page.getByText('2 / 3')).toBeVisible();

    // Navigate NEXT again
    await page.getByRole('button', { name: 'NEXT', exact: true }).click();
    await expect(page.getByText('3 / 3')).toBeVisible();

    // Navigate PREV
    await page.getByRole('button', { name: 'PREV', exact: true }).click();
    await expect(page.getByText('2 / 3')).toBeVisible();

    // Keyboard navigation (ArrowLeft)
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByText('1 / 3')).toBeVisible();

    // Press Escape in lightbox: returns to sheet
    await page.keyboard.press('Escape');
    await expect(page.getByText('1 / 3')).not.toBeVisible();
    await expect(page.getByText('TRIP MEMORIES')).toBeVisible();

    // Close sheet via CLOSE button
    await page.getByRole('dialog', { name: 'Trip Memories' }).getByRole('button', { name: 'CLOSE', exact: true }).click();
    await expect(page.getByText('TRIP MEMORIES')).not.toBeVisible();
  });

  test('Trip Memories with 0 photos: empty state in sheet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/passport');

    await page.evaluate(() => {
      localStorage.clear();
      const mockLayovers = [
        {
          id: 'test-layover-0photos',
          state: {
            airportName: 'CHANGI SIN',
            gate: 'D10',
            startedMs: Date.now() - 1200000,
            xp: 40,
            log: [
              { id: 'm1', text: 'FIND GATE', status: 'completed', xp: 40, ts: Date.now() },
            ],
          },
          survivedSeconds: 1200,
        },
      ];
      localStorage.setItem('gate.sync_queue', JSON.stringify(mockLayovers));
    });

    await page.reload();

    await expect(page.getByRole('article').getByText('0 PHOTOS')).toBeVisible();
    await page.getByRole('article').click();

    await expect(page.getByText('TRIP MEMORIES')).toBeVisible();
    await expect(page.getByText('NO PHOTOS FROM THIS LAYOVER.')).toBeVisible();
    await expect(page.getByText('GUEST PHOTOS ARE NOT SAVED.')).toBeVisible();

    await page.getByRole('dialog', { name: 'Trip Memories' }).getByRole('button', { name: 'CLOSE', exact: true }).click();
    await expect(page.getByText('TRIP MEMORIES')).not.toBeVisible();
  });

  test('Body scroll locking and scroll restoration on close', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/passport');

    await page.evaluate(() => {
      localStorage.clear();
      const mockLayovers = Array.from({ length: 8 }).map((_, i) => ({
        id: `test-layover-scroll-${i}`,
        state: {
          airportName: `AIRPORT ${i}`,
          gate: `A${i}`,
          startedMs: Date.now() - (i + 1) * 1000000,
          xp: 40,
          log: [{ id: 'm1', text: 'WALK', status: 'completed', xp: 40, ts: Date.now() }],
        },
        survivedSeconds: 1000,
      }));
      localStorage.setItem('gate.sync_queue', JSON.stringify(mockLayovers));
    });

    await page.reload();

    // Scroll passport page down
    await page.evaluate(() => window.scrollTo(0, 150));
    const scrolledY = await page.evaluate(() => window.scrollY);

    // Open sheet
    await page.getByRole('article').first().click();
    await expect(page.getByText('TRIP MEMORIES')).toBeVisible();

    // Body overflow should be hidden
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe('hidden');

    // Close sheet
    await page.getByRole('dialog', { name: 'Trip Memories' }).getByRole('button', { name: 'CLOSE', exact: true }).click();
    await expect(page.getByText('TRIP MEMORIES')).not.toBeVisible();

    // Body overflow should be restored
    const restoredOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(restoredOverflow).toBe('');

    // Scroll position should be restored
    const finalScrollY = await page.evaluate(() => window.scrollY);
    expect(finalScrollY).toBe(scrolledY);
  });

  test('Zero horizontal overflow at 390x844 and 360x640 viewports', async ({ page }) => {
    for (const vp of [{ width: 390, height: 844 }, { width: 360, height: 640 }]) {
      await page.setViewportSize(vp);
      await page.goto('/passport');

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    }
  });
});
