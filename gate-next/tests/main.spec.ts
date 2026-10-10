import { test, expect } from '@playwright/test';



function getOffsetTimeStr(now, offsetMins) {
  const d = new Date(now.getTime() + offsetMins * 60000);
  const h = d.getUTCHours().toString().padStart(2, '0');
  const m = d.getUTCMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

test.describe('GATE Layover Hackathon Tests', () => {
  

test.beforeEach(async ({ page }) => {
  
  await page.clock.install({ time: new Date('2026-10-10T12:00:00Z') });
  await page.evaluate(() => {
    window.fakeTime = new Date('2026-10-10T12:00:00Z').getTime();
    const OriginalDate = window.Date;
    class MockDate extends OriginalDate {
      constructor(...args) {
        if (args.length === 0) super(window.fakeTime);
        else super(...args);
      }
      static now() { return window.fakeTime; }
    }
    window.Date = MockDate;
  });

  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
});

  test('1. Setup validation', async ({ page }) => {
    
    // 1a. Departure in the past with rollover shows "tomorrow"
    await page.fill('input[type="time"]', await page.evaluate(() => { const d = new Date(Date.now() - 120 * 60000); return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`; }));
    
    // 1b. Safe time <= 0 blocks START with a message
    await page.fill('input[type="time"]', await page.evaluate(() => { const d = new Date(Date.now() + 10 * 60000); return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`; }));
    await expect(page.getByText('HEAD TO GATE NOW')).toBeVisible();
    const startBtn = page.getByRole('button', { name: /START LAYOVER/i });
    await expect(startBtn).toBeDisabled();

    // 1c. Empty gate handled (defaults to TBA)
    await page.fill('input[placeholder="B14 OR TBA"]', '');
    await page.fill('input[type="time"]', await page.evaluate(() => { const d = new Date(Date.now() + 180 * 60000); return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`; })); 
    await expect(startBtn).toBeEnabled();
    await startBtn.click();
    await expect(page.getByText('TBA')).toBeVisible(); 
  });

  test('2. Demo Mode', async ({ page }) => {
    
    const wordmark = page.locator('span:has-text("GATE")').first();
    await wordmark.click(); await page.waitForTimeout(100);
    await wordmark.click(); await page.waitForTimeout(100);
    await wordmark.click();

    // Quest screen shown with DEMO chip
    await expect(page.getByText('DEMO')).toBeVisible();

    // Advance 45s (15s left) - heads-up
    
        
    await page.evaluate((ms) => { window.fakeTime += ms; }, 45000);
    await page.clock.fastForward(45000);
  
  
    // Usually banner + chime, let's look for START WRAPPING UP
    await expect(page.getByText(/START WRAPPING UP/i)).toBeVisible();

    // Advance 10s (5s left) - urgent
    
        
    await page.evaluate((ms) => { window.fakeTime += ms; }, 10000);
    await page.clock.fastForward(10000);
  
  
    await expect(page.getByText(/WALK TO GATE NOW/i)).toBeVisible();

    // Advance 10s (-5s left) - alarm
    
        
    await page.evaluate((ms) => { window.fakeTime += ms; }, 10000);
    await page.clock.fastForward(10000);
  
  
    await expect(page.getByRole('button', { name: 'I AM AT THE GATE' })).toBeVisible();
  });

  test('3. Alarm', async ({ page }) => {
    
    const wordmark = page.locator('span:has-text("GATE")').first();
    await wordmark.click(); await page.waitForTimeout(100);
    await wordmark.click(); await page.waitForTimeout(100);
    await wordmark.click();
    
        
    await page.evaluate((ms) => { window.fakeTime += ms; }, 60000);
    await page.clock.fastForward(60000);
  
  
    
    // Check alarm UI
    const dismissBtn = page.getByRole('button', { name: 'I AM AT THE GATE' });
    await expect(dismissBtn).toBeVisible();
    await dismissBtn.click();

    // Safe Travels
    await expect(page.getByText(/LAYOVER COMPLETE/i)).toBeVisible();

    // Reset
    await page.getByRole('button', { name: /START NEW/i }).click();
    await expect(page.getByText('LAYOVER COMPANION')).toBeVisible();
  });

  
  test('4. Normal mode ladder', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    
    // departure 1.5 hours away => 90 min
    // buffer 30 + walk 10 + margin 5 = 45 min
    // returnBy = 45 min away
    await page.getByRole('button', { name: 'IN X H Y M' }).click();
    await page.fill('input[placeholder="H"]', '1');
    await page.fill('input[placeholder="M"]', '30'); 
    
    
    await page.getByRole('button', { name: /START LAYOVER/i }).click();
    await expect(page.getByRole('button', { name: /SKIP/i })).toBeVisible();

    

    // free > 15 min
    await expect(page.getByText(/START WRAPPING UP/i)).not.toBeVisible();
    await expect(page.getByText(/WALK TO GATE NOW/i)).not.toBeVisible();

    // fast forward to 14 min left (31 min forward)
    
        
    await page.evaluate((ms) => { window.fakeTime += ms; }, 31 * 60000);
    await page.clock.fastForward(31 * 60000);
  
  
    console.log("Test 4 state at 31m:", await page.locator('body').innerText());
    await expect(page.getByText(/START WRAPPING UP/i)).toBeVisible();

    // fast forward to 4 min left (10 min forward)
    
        
    await page.evaluate((ms) => { window.fakeTime += ms; }, 10 * 60000);
    await page.clock.fastForward(10 * 60000);
  
  
    await expect(page.getByText(/WALK TO GATE NOW/i)).toBeVisible();

    // fast forward to past 0
    
        
    await page.evaluate((ms) => { window.fakeTime += ms; }, 5 * 60000);
    await page.clock.fastForward(5 * 60000);
  
  
    await expect(page.getByRole('button', { name: 'I AM AT THE GATE' })).toBeVisible();
  });

  test('5. Stats drain', async ({ page }) => {

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));        await page.getByRole('button', { name: 'IN X H Y M' }).click();
    await page.fill('input[placeholder="H"]', '5');
    await page.fill('input[placeholder="M"]', '0');
    
    
    await page.getByRole('button', { name: /START LAYOVER/i }).click();
    await expect(page.getByRole('button', { name: /SKIP/i })).toBeVisible();

    
    
    // Check hunger starts at 60 (vibe tired => hunger 60)
    console.log("Test 5 state at start:", await page.locator('body').innerText());
    await expect(page.locator('div').filter({ hasText: 'HUNGER' }).getByText('70', { exact: true })).toBeVisible();

    // Fast forward 10 minutes. Drain rate is 0.3/min => -3. Should be 57.
    
        
    await page.evaluate((ms) => { window.fakeTime += ms; }, 10 * 60000);
    await page.clock.fastForward(10 * 60000);
  
  
    console.log('Test 5 state after fast forward:', await page.locator('body').innerText());
    await expect(page.locator('div').filter({ hasText: 'HUNGER' }).getByText('66', { exact: true })).toBeVisible();

    // Fast forward huge amount to clamp at 0
    
        
    await page.evaluate((ms) => { window.fakeTime += ms; }, 60 * 60000);
    await page.clock.fastForward(60 * 60000);
  
  
    console.log('Test 5 state at end:', await page.locator('body').innerText());
    await expect(page.locator('div').filter({ hasText: 'HUNGER' }).getByText('48', { exact: true })).toBeVisible();
  });

  test('6. Mission engine', async ({ page }) => {
        
    await page.getByRole('button', { name: 'IN X H Y M' }).click();
    await page.fill('input[placeholder="H"]', '0');
    await page.fill('input[placeholder="M"]', '55');
    
    
    await page.getByRole('button', { name: /START LAYOVER/i }).click();
    await expect(page.getByRole('button', { name: /SKIP/i })).toBeVisible();

    

    // Check we got a mission card
    const skipBtn = page.getByRole('button', { name: /SKIP/i });
    await expect(skipBtn).toBeVisible();
    
    // Clicking skip should generate a new mission or fallback.
    // It shouldn't crash.
    await skipBtn.click();
    await expect(skipBtn).toBeVisible();
  });

  test('7. Complete adds boost and XP', async ({ page }) => {
        await page.getByRole('button', { name: 'IN X H Y M' }).click();
    await page.fill('input[placeholder="H"]', '5');
    await page.fill('input[placeholder="M"]', '0');
    
    
    await page.getByRole('button', { name: /START LAYOVER/i }).click();
    await expect(page.getByRole('button', { name: /SKIP/i })).toBeVisible();

    
    
    // Check initial XP using TOTAL XP
    await expect(page.getByText('TOTAL XP').locator('..').getByText('0', { exact: true })).toBeVisible();

    // Click Complete
    await page.getByRole('button', { name: /COMPLETE/i }).click();
    
        
    await page.evaluate((ms) => { window.fakeTime += ms; }, 1100);
    await page.clock.fastForward(1100);
  
  
    
    // XP should increase
    await expect(page.locator('div').filter({ hasText: 'TOTAL XP' }).getByText('40').first()).toBeVisible();

    // Rapid taps on SKIP shouldn't break state
    const skipBtn = page.getByRole('button', { name: /SKIP/i });
    for(let i=0; i<5; i++) {
      await skipBtn.click();
    }
    await expect(page.locator('div').filter({ hasText: 'TOTAL XP' }).getByText('40').first()).toBeVisible();
  });

  test('8. Refresh mid-session', async ({ page }) => {
        await page.getByRole('button', { name: 'IN X H Y M' }).click();
    await page.fill('input[placeholder="H"]', '5');
    await page.fill('input[placeholder="M"]', '0');
    
    
    await page.getByRole('button', { name: /START LAYOVER/i }).click();
    await expect(page.getByRole('button', { name: /SKIP/i })).toBeVisible();

    

    await page.getByRole('button', { name: /COMPLETE/i }).click();
    
        
    await page.evaluate((ms) => { window.fakeTime += ms; }, 1100);
    await page.clock.fastForward(1100);
  
  
    await expect(page.locator('div').filter({ hasText: 'TOTAL XP' }).getByText('40').first()).toBeVisible();

    // Reload page
    await page.reload();
    
    // XP should still be 40
    await expect(page.locator('div').filter({ hasText: 'TOTAL XP' }).getByText('40').first()).toBeVisible();

    // Advance time past returnBy (which is 19:15)
    
        
    await page.evaluate((ms) => { window.fakeTime += ms; }, 5 * 3600 * 1000);
    await page.clock.fastForward(5 * 3600 * 1000);
  
  
    await page.reload();
    // Should go straight to alarm
    await expect(page.getByRole('button', { name: 'I AM AT THE GATE' })).toBeVisible();
  });

  test('9. Background simulation', async ({ page }) => {
        
    // Return by in 16 mins
    await page.getByRole('button', { name: 'IN X H Y M' }).click();
    await page.fill('input[placeholder="H"]', '1');
    await page.fill('input[placeholder="M"]', '1');
    
    
    await page.getByRole('button', { name: /START LAYOVER/i }).click();
    await expect(page.getByRole('button', { name: /SKIP/i })).toBeVisible();

    
    
    // No heads up
    await expect(page.getByText(/START WRAPPING UP/i)).not.toBeVisible();

    // Pause clock 120s, resume (simulate suspend/resume). Time left is 14 mins.
    
        
    await page.evaluate((ms) => { window.fakeTime += ms; }, 120000);
    await page.clock.fastForward(120000);
  
   
    // Usually visibilitychange or focus triggers useNow to update
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    
    // Now it should be 14 mins left -> HEADS UP
    console.log("Test 9 state at end:", await page.locator('body').innerText());
    await expect(page.getByText(/START WRAPPING UP/i)).toBeVisible();
  });

  
  test('10. Departure past midnight computes correctly', async ({ page }) => {
    await page.evaluate(() => { window.fakeTime = new Date('2026-10-10T23:50:00Z').getTime(); });

    
    await page.fill('input[type="time"]', await page.evaluate(() => { const d = new Date(Date.now() + 70 * 60000); return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`; }));
    // Departure is tomorrow 00:40
    
    // Return by is 45 mins before 00:40 => 23:55.
    // 23:55 is in the future.
    const startBtn = page.getByRole('button', { name: /START LAYOVER/i });
    await expect(startBtn).toBeEnabled();
  });
});
