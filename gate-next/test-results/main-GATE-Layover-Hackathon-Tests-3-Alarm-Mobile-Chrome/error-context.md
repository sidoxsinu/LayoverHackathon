# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: main.spec.ts >> GATE Layover Hackathon Tests >> 3. Alarm
- Location: tests/main.spec.ts:58:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/SAFE TRAVELS/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText(/SAFE TRAVELS/i) with timeout 5000ms
  - waiting for getByText(/SAFE TRAVELS/i)

```

```yaml
- alert
- text: GATE / LAYOVER COMPLETE LAYOVER PASSPORT SURVIVED 0M MISSIONS 0 XP 0 RANK FIRST-TIMER
- button "START NEW LAYOVER"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('GATE Layover Hackathon Tests', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/');
  6   |     await page.evaluate(() => localStorage.clear());
  7   |     await page.reload();
  8   |   });
  9   | 
  10  |   test('1. Setup validation', async ({ page }) => {
  11  |     const now = new Date('2026-10-10T15:00:00Z');
  12  |     await page.clock.install({ time: now });
  13  | 
  14  |     // 1a. Departure in the past with rollover shows "tomorrow"
  15  |     await page.fill('input[type="time"]', '14:00');
  16  |     await expect(page.getByText(/TOMORROW/i)).toBeVisible();
  17  | 
  18  |     // 1b. Safe time <= 0 blocks START with a message
  19  |     await page.fill('input[type="time"]', '15:10');
  20  |     await expect(page.getByText('HEAD TO GATE NOW')).toBeVisible();
  21  |     const startBtn = page.getByRole('button', { name: /START LAYOVER/i });
  22  |     await expect(startBtn).toBeDisabled();
  23  | 
  24  |     // 1c. Empty gate handled (defaults to TBA)
  25  |     await page.fill('input[placeholder="B14 OR TBA"]', '');
  26  |     await page.fill('input[type="time"]', '18:00'); 
  27  |     await expect(startBtn).toBeEnabled();
  28  |     await startBtn.click();
  29  |     await expect(page.getByText('TBA')).toBeVisible(); 
  30  |   });
  31  | 
  32  |   test('2. Demo Mode', async ({ page }) => {
  33  |     const now = new Date('2026-10-10T15:00:00Z');
  34  |     await page.clock.install({ time: now });
  35  | 
  36  |     const wordmark = page.locator('span:has-text("GATE")').first();
  37  |     await wordmark.click(); await page.waitForTimeout(100);
  38  |     await wordmark.click(); await page.waitForTimeout(100);
  39  |     await wordmark.click();
  40  | 
  41  |     // Quest screen shown with DEMO chip
  42  |     await expect(page.getByText('DEMO')).toBeVisible();
  43  | 
  44  |     // Advance 45s (15s left) - heads-up
  45  |     await page.clock.fastForward(45000);
  46  |     // Usually banner + chime, let's look for START WRAPPING UP
  47  |     await expect(page.getByText(/START WRAPPING UP/i)).toBeVisible();
  48  | 
  49  |     // Advance 10s (5s left) - urgent
  50  |     await page.clock.fastForward(10000);
  51  |     await expect(page.getByText(/WALK TO GATE NOW/i)).toBeVisible();
  52  | 
  53  |     // Advance 10s (-5s left) - alarm
  54  |     await page.clock.fastForward(10000);
  55  |     await expect(page.getByRole('button', { name: 'I AM AT THE GATE' })).toBeVisible();
  56  |   });
  57  | 
  58  |   test('3. Alarm', async ({ page }) => {
  59  |     const now = new Date('2026-10-10T15:00:00Z');
  60  |     await page.clock.install({ time: now });
  61  | 
  62  |     const wordmark = page.locator('span:has-text("GATE")').first();
  63  |     await wordmark.click(); await page.waitForTimeout(100);
  64  |     await wordmark.click(); await page.waitForTimeout(100);
  65  |     await wordmark.click();
  66  |     await page.clock.fastForward(60000);
  67  |     
  68  |     // Check alarm UI
  69  |     const dismissBtn = page.getByRole('button', { name: 'I AM AT THE GATE' });
  70  |     await expect(dismissBtn).toBeVisible();
  71  |     await dismissBtn.click();
  72  | 
  73  |     // Safe Travels
> 74  |     await expect(page.getByText(/SAFE TRAVELS/i)).toBeVisible();
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  75  | 
  76  |     // Reset
  77  |     await page.getByRole('button', { name: /START NEW/i }).click();
  78  |     await expect(page.getByText('LAYOVER COMPANION')).toBeVisible();
  79  |   });
  80  | 
  81  |   test('4. Normal mode ladder', async ({ page }) => {
  82  |     const now = new Date('2026-10-10T15:00:00Z');
  83  |     await page.clock.install({ time: now });
  84  | 
  85  |     // departure 1.5 hours away => 90 min
  86  |     // buffer 30 + walk 10 + margin 5 = 45 min
  87  |     // returnBy = 45 min away
  88  |     await page.fill('input[type="time"]', '16:30'); 
  89  |     await page.getByRole('button', { name: /START LAYOVER/i }).click();
  90  | 
  91  |     // free > 15 min
  92  |     await expect(page.getByText(/START WRAPPING UP/i)).not.toBeVisible();
  93  |     await expect(page.getByText(/WALK TO GATE NOW/i)).not.toBeVisible();
  94  | 
  95  |     // fast forward to 14 min left (31 min forward)
  96  |     await page.clock.fastForward(31 * 60000);
  97  |     await expect(page.getByText(/START WRAPPING UP/i)).toBeVisible();
  98  | 
  99  |     // fast forward to 4 min left (10 min forward)
  100 |     await page.clock.fastForward(10 * 60000);
  101 |     await expect(page.getByText(/WALK TO GATE NOW/i)).toBeVisible();
  102 | 
  103 |     // fast forward to past 0
  104 |     await page.clock.fastForward(5 * 60000);
  105 |     await expect(page.getByRole('button', { name: 'I AM AT THE GATE' })).toBeVisible();
  106 |   });
  107 | 
  108 |   test('5. Stats drain', async ({ page }) => {
  109 |     const now = new Date('2026-10-10T15:00:00Z');
  110 |     await page.clock.install({ time: now });
  111 |     await page.fill('input[type="time"]', '20:00');
  112 |     await page.getByRole('button', { name: /START LAYOVER/i }).click();
  113 |     
  114 |     // Check hunger starts at 60 (vibe tired => hunger 60)
  115 |     await expect(page.locator('div').filter({ hasText: 'HUNGER' }).getByText('60', { exact: true })).toBeVisible();
  116 | 
  117 |     // Fast forward 10 minutes. Drain rate is 0.3/min => -3. Should be 57.
  118 |     await page.clock.fastForward(10 * 60000);
  119 |     await expect(page.locator('div').filter({ hasText: 'HUNGER' }).getByText('57', { exact: true })).toBeVisible();
  120 | 
  121 |     // Fast forward huge amount to clamp at 0
  122 |     await page.clock.fastForward(300 * 60000);
  123 |     await expect(page.locator('div').filter({ hasText: 'HUNGER' }).getByText('0', { exact: true })).toBeVisible();
  124 |   });
  125 | 
  126 |   test('6. Mission engine', async ({ page }) => {
  127 |     const now = new Date('2026-10-10T15:00:00Z');
  128 |     await page.clock.install({ time: now });
  129 |     
  130 |     await page.fill('input[type="time"]', '15:55');
  131 |     await page.getByRole('button', { name: /START LAYOVER/i }).click();
  132 | 
  133 |     // Check we got a mission card
  134 |     const skipBtn = page.getByRole('button', { name: /SKIP/i });
  135 |     await expect(skipBtn).toBeVisible();
  136 |     
  137 |     // Clicking skip should generate a new mission or fallback.
  138 |     // It shouldn't crash.
  139 |     await skipBtn.click();
  140 |     await expect(skipBtn).toBeVisible();
  141 |   });
  142 | 
  143 |   test('7. Complete adds boost and XP', async ({ page }) => {
  144 |     const now = new Date('2026-10-10T15:00:00Z');
  145 |     await page.clock.install({ time: now });
  146 |     await page.fill('input[type="time"]', '20:00');
  147 |     await page.getByRole('button', { name: /START LAYOVER/i }).click();
  148 |     
  149 |     // Check initial XP using TOTAL XP
  150 |     await expect(page.getByText('TOTAL XP').locator('..').getByText('0', { exact: true })).toBeVisible();
  151 | 
  152 |     // Click Complete
  153 |     await page.getByRole('button', { name: /COMPLETE/i }).click();
  154 |     
  155 |     // XP should increase
  156 |     await expect(page.locator('div').filter({ hasText: 'TOTAL XP' }).getByText('40', { exact: true }).first()).toBeVisible();
  157 | 
  158 |     // Rapid taps on SKIP shouldn't break state
  159 |     const skipBtn = page.getByRole('button', { name: /SKIP/i });
  160 |     for(let i=0; i<5; i++) {
  161 |       await skipBtn.click();
  162 |     }
  163 |     await expect(page.locator('div').filter({ hasText: 'TOTAL XP' }).getByText('40', { exact: true }).first()).toBeVisible();
  164 |   });
  165 | 
  166 |   test('8. Refresh mid-session', async ({ page }) => {
  167 |     const now = new Date('2026-10-10T15:00:00Z');
  168 |     await page.clock.install({ time: now });
  169 |     await page.fill('input[type="time"]', '20:00');
  170 |     await page.getByRole('button', { name: /START LAYOVER/i }).click();
  171 | 
  172 |     await page.getByRole('button', { name: /COMPLETE/i }).click();
  173 |     await expect(page.locator('div').filter({ hasText: 'TOTAL XP' }).getByText('40', { exact: true }).first()).toBeVisible();
  174 | 
```