# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: main.spec.ts >> GATE Layover Hackathon Tests >> 3. Alarm
- Location: tests/main.spec.ts:56:7

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
  12  |     await page.clock.setFixedTime(now);
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
  34  |     await page.clock.setFixedTime(now);
  35  | 
  36  |     const wordmark = page.locator('span:has-text("GATE")').first();
  37  |     await wordmark.click(); await wordmark.click(); await wordmark.click();
  38  | 
  39  |     // Quest screen shown with DEMO chip
  40  |     await expect(page.getByText('DEMO')).toBeVisible();
  41  | 
  42  |     // Advance 40s (20s left) - heads-up
  43  |     await page.clock.fastForward(40000);
  44  |     // Usually banner + chime, let's look for HEADS UP
  45  |     await expect(page.getByText(/HEADS UP/i)).toBeVisible();
  46  | 
  47  |     // Advance 10s (10s left) - urgent
  48  |     await page.clock.fastForward(10000);
  49  |     await expect(page.getByText(/URGENT/i)).toBeVisible();
  50  | 
  51  |     // Advance 10s (0s left) - alarm
  52  |     await page.clock.fastForward(10000);
  53  |     await expect(page.getByRole('button', { name: 'I AM AT THE GATE' })).toBeVisible();
  54  |   });
  55  | 
  56  |   test('3. Alarm', async ({ page }) => {
  57  |     const now = new Date('2026-10-10T15:00:00Z');
  58  |     await page.clock.setFixedTime(now);
  59  | 
  60  |     const wordmark = page.locator('span:has-text("GATE")').first();
  61  |     await wordmark.click(); await wordmark.click(); await wordmark.click();
  62  |     await page.clock.fastForward(60000);
  63  |     
  64  |     // Check alarm UI
  65  |     const dismissBtn = page.getByRole('button', { name: 'I AM AT THE GATE' });
  66  |     await expect(dismissBtn).toBeVisible();
  67  |     await dismissBtn.click();
  68  | 
  69  |     // Safe Travels
> 70  |     await expect(page.getByText(/SAFE TRAVELS/i)).toBeVisible();
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  71  | 
  72  |     // Reset
  73  |     await page.getByRole('button', { name: /START NEW/i }).click();
  74  |     await expect(page.getByText('LAYOVER COMPANION')).toBeVisible();
  75  |   });
  76  | 
  77  |   test('4. Normal mode ladder', async ({ page }) => {
  78  |     const now = new Date('2026-10-10T15:00:00Z');
  79  |     await page.clock.setFixedTime(now);
  80  | 
  81  |     // departure 1.5 hours away => 90 min
  82  |     // buffer 30 + walk 10 + margin 5 = 45 min
  83  |     // returnBy = 45 min away
  84  |     await page.fill('input[type="time"]', '16:30'); 
  85  |     await page.getByRole('button', { name: /START LAYOVER/i }).click();
  86  | 
  87  |     // free > 15 min
  88  |     await expect(page.getByText(/HEADS UP/i)).not.toBeVisible();
  89  |     await expect(page.getByText(/URGENT/i)).not.toBeVisible();
  90  | 
  91  |     // fast forward to 15 min left (30 min forward)
  92  |     await page.clock.fastForward(30 * 60000);
  93  |     await expect(page.getByText(/HEADS UP/i)).toBeVisible();
  94  | 
  95  |     // fast forward to 5 min left (10 min forward)
  96  |     await page.clock.fastForward(10 * 60000);
  97  |     await expect(page.getByText(/URGENT/i)).toBeVisible();
  98  | 
  99  |     // fast forward to 0
  100 |     await page.clock.fastForward(5 * 60000);
  101 |     await expect(page.getByRole('button', { name: 'I AM AT THE GATE' })).toBeVisible();
  102 |   });
  103 | 
  104 |   test('5. Stats drain', async ({ page }) => {
  105 |     const now = new Date('2026-10-10T15:00:00Z');
  106 |     await page.clock.setFixedTime(now);
  107 |     await page.fill('input[type="time"]', '20:00');
  108 |     // Default vibe is TIRED. Hunger should be 60.
  109 |     await page.getByRole('button', { name: /START LAYOVER/i }).click();
  110 |     
  111 |     // Check hunger starts at 60
  112 |     await expect(page.locator('text=HUNGER').locator('..').locator('text=60')).toBeVisible();
  113 | 
  114 |     // Fast forward 10 minutes. Drain rate is 0.3/min => -3. Should be 57.
  115 |     await page.clock.fastForward(10 * 60000);
  116 |     await expect(page.locator('text=HUNGER').locator('..').locator('text=57')).toBeVisible();
  117 | 
  118 |     // Fast forward huge amount to clamp at 0
  119 |     await page.clock.fastForward(300 * 60000);
  120 |     await expect(page.locator('text=HUNGER').locator('..').locator('text=0')).toBeVisible();
  121 |   });
  122 | 
  123 |   test('6. Mission engine', async ({ page }) => {
  124 |     const now = new Date('2026-10-10T15:00:00Z');
  125 |     await page.clock.setFixedTime(now);
  126 |     
  127 |     // Departure at 15:55 => return by 45 mins prior => 15:10. That's 10 mins left!
  128 |     // Wait, 15:55 - 45m = 15:10 => 10m left.
  129 |     // If < 15 min left, it should show the go-to-gate mission!
  130 |     await page.fill('input[type="time"]', '15:55');
  131 |     await page.getByRole('button', { name: /START LAYOVER/i }).click();
  132 | 
  133 |     // Check for go-to-gate mission
  134 |     await expect(page.getByText(/head to your gate/i)).toBeVisible();
  135 |   });
  136 | 
  137 |   test('7. Complete adds boost and XP', async ({ page }) => {
  138 |     const now = new Date('2026-10-10T15:00:00Z');
  139 |     await page.clock.setFixedTime(now);
  140 |     await page.fill('input[type="time"]', '20:00');
  141 |     await page.getByRole('button', { name: /START LAYOVER/i }).click();
  142 |     
  143 |     // Check initial XP
  144 |     await expect(page.locator('text=XP').locator('..').getByText('0', { exact: true })).toBeVisible();
  145 | 
  146 |     // Click Complete
  147 |     await page.getByRole('button', { name: /COMPLETE/i }).click();
  148 |     
  149 |     // XP should increase
  150 |     await expect(page.locator('text=XP').locator('..').getByText('40', { exact: true })).toBeVisible();
  151 | 
  152 |     // Rapid taps on SKIP shouldn't break state (meaning no errors thrown, XP remains same)
  153 |     const skipBtn = page.getByRole('button', { name: /SKIP/i });
  154 |     for(let i=0; i<20; i++) {
  155 |       await skipBtn.click();
  156 |     }
  157 |     await expect(page.locator('text=XP').locator('..').getByText('40', { exact: true })).toBeVisible();
  158 |   });
  159 | 
  160 |   test('8. Refresh mid-session', async ({ page }) => {
  161 |     const now = new Date('2026-10-10T15:00:00Z');
  162 |     await page.clock.setFixedTime(now);
  163 |     await page.fill('input[type="time"]', '20:00');
  164 |     await page.getByRole('button', { name: /START LAYOVER/i }).click();
  165 | 
  166 |     await page.getByRole('button', { name: /COMPLETE/i }).click();
  167 |     await expect(page.locator('text=XP').locator('..').getByText('40', { exact: true })).toBeVisible();
  168 | 
  169 |     // Reload page
  170 |     await page.reload();
```