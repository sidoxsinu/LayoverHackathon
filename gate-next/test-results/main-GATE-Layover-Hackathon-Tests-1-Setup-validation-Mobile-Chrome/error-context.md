# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: main.spec.ts >> GATE Layover Hackathon Tests >> 1. Setup validation
- Location: tests/main.spec.ts:35:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="time"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]: 12:00
        - generic [ref=e6]: OCT 10, 2026
      - button "Mute Audio" [ref=e7] [cursor=pointer]
    - generic [ref=e12]:
      - generic [ref=e13]: GATE
      - generic [ref=e14]: LAYOVER SURVIVAL COMPANION
    - generic [ref=e15]:
      - button "SIGN IN WITH GOOGLE" [ref=e16] [cursor=pointer]
      - button "CONTINUE AS GUEST" [ref=e17] [cursor=pointer]
      - generic [ref=e18]: Guests can run layovers. Sign in to save trips and your Passport.
  - button "Open Next.js Dev Tools" [ref=e24] [cursor=pointer]
  - alert [ref=e28]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | 
  4   | 
  5   | function getOffsetTimeStr(now, offsetMins) {
  6   |   const d = new Date(now.getTime() + offsetMins * 60000);
  7   |   const h = d.getUTCHours().toString().padStart(2, '0');
  8   |   const m = d.getUTCMinutes().toString().padStart(2, '0');
  9   |   return `${h}:${m}`;
  10  | }
  11  | 
  12  | test.describe('GATE Layover Hackathon Tests', () => {
  13  |   
  14  | 
  15  | test.beforeEach(async ({ page }) => {
  16  |   
  17  |   await page.clock.install({ time: new Date('2026-10-10T12:00:00Z') });
  18  |   await page.evaluate(() => {
  19  |     window.fakeTime = new Date('2026-10-10T12:00:00Z').getTime();
  20  |     const OriginalDate = window.Date;
  21  |     class MockDate extends OriginalDate {
  22  |       constructor(...args) {
  23  |         if (args.length === 0) super(window.fakeTime);
  24  |         else super(...args);
  25  |       }
  26  |       static now() { return window.fakeTime; }
  27  |     }
  28  |     window.Date = MockDate;
  29  |   });
  30  | 
  31  |   await page.goto('/');
  32  |   await page.evaluate(() => window.localStorage.clear());
  33  | });
  34  | 
  35  |   test('1. Setup validation', async ({ page }) => {
  36  |     
  37  |     // 1a. Departure in the past with rollover shows "tomorrow"
> 38  |     await page.fill('input[type="time"]', await page.evaluate(() => { const d = new Date(Date.now() - 120 * 60000); return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`; }));
      |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  39  |     
  40  |     // 1b. Safe time <= 0 blocks START with a message
  41  |     await page.fill('input[type="time"]', await page.evaluate(() => { const d = new Date(Date.now() + 10 * 60000); return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`; }));
  42  |     await expect(page.getByText('HEAD TO GATE NOW')).toBeVisible();
  43  |     const startBtn = page.getByRole('button', { name: /START LAYOVER/i });
  44  |     await expect(startBtn).toBeDisabled();
  45  | 
  46  |     // 1c. Empty gate handled (defaults to TBA)
  47  |     await page.fill('input[placeholder="B14 OR TBA"]', '');
  48  |     await page.fill('input[type="time"]', await page.evaluate(() => { const d = new Date(Date.now() + 180 * 60000); return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`; })); 
  49  |     await expect(startBtn).toBeEnabled();
  50  |     await startBtn.click();
  51  |     await expect(page.getByText('TBA')).toBeVisible(); 
  52  |   });
  53  | 
  54  |   test('2. Demo Mode', async ({ page }) => {
  55  |     
  56  |     const wordmark = page.locator('span:has-text("GATE")').first();
  57  |     await wordmark.click(); await page.waitForTimeout(100);
  58  |     await wordmark.click(); await page.waitForTimeout(100);
  59  |     await wordmark.click();
  60  | 
  61  |     // Quest screen shown with DEMO chip
  62  |     await expect(page.getByText('DEMO')).toBeVisible();
  63  | 
  64  |     // Advance 45s (15s left) - heads-up
  65  |     
  66  |         
  67  |     await page.evaluate((ms) => { window.fakeTime += ms; }, 45000);
  68  |     await page.clock.fastForward(45000);
  69  |   
  70  |   
  71  |     // Usually banner + chime, let's look for START WRAPPING UP
  72  |     await expect(page.getByText(/START WRAPPING UP/i)).toBeVisible();
  73  | 
  74  |     // Advance 10s (5s left) - urgent
  75  |     
  76  |         
  77  |     await page.evaluate((ms) => { window.fakeTime += ms; }, 10000);
  78  |     await page.clock.fastForward(10000);
  79  |   
  80  |   
  81  |     await expect(page.getByText(/WALK TO GATE NOW/i)).toBeVisible();
  82  | 
  83  |     // Advance 10s (-5s left) - alarm
  84  |     
  85  |         
  86  |     await page.evaluate((ms) => { window.fakeTime += ms; }, 10000);
  87  |     await page.clock.fastForward(10000);
  88  |   
  89  |   
  90  |     await expect(page.getByRole('button', { name: 'I AM AT THE GATE' })).toBeVisible();
  91  |   });
  92  | 
  93  |   test('3. Alarm', async ({ page }) => {
  94  |     
  95  |     const wordmark = page.locator('span:has-text("GATE")').first();
  96  |     await wordmark.click(); await page.waitForTimeout(100);
  97  |     await wordmark.click(); await page.waitForTimeout(100);
  98  |     await wordmark.click();
  99  |     
  100 |         
  101 |     await page.evaluate((ms) => { window.fakeTime += ms; }, 60000);
  102 |     await page.clock.fastForward(60000);
  103 |   
  104 |   
  105 |     
  106 |     // Check alarm UI
  107 |     const dismissBtn = page.getByRole('button', { name: 'I AM AT THE GATE' });
  108 |     await expect(dismissBtn).toBeVisible();
  109 |     await dismissBtn.click();
  110 | 
  111 |     // Safe Travels
  112 |     await expect(page.getByText(/LAYOVER COMPLETE/i)).toBeVisible();
  113 | 
  114 |     // Reset
  115 |     await page.getByRole('button', { name: /START NEW/i }).click();
  116 |     await expect(page.getByText('LAYOVER COMPANION')).toBeVisible();
  117 |   });
  118 | 
  119 |   
  120 |   test('4. Normal mode ladder', async ({ page }) => {
  121 |     const errors = [];
  122 |     page.on('pageerror', err => errors.push(err.message));
  123 |     page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  124 | 
  125 |     
  126 |     // departure 1.5 hours away => 90 min
  127 |     // buffer 30 + walk 10 + margin 5 = 45 min
  128 |     // returnBy = 45 min away
  129 |     await page.getByRole('button', { name: 'IN X H Y M' }).click();
  130 |     await page.fill('input[placeholder="H"]', '1');
  131 |     await page.fill('input[placeholder="M"]', '30'); 
  132 |     
  133 |     
  134 |     await page.getByRole('button', { name: /START LAYOVER/i }).click();
  135 |     await expect(page.getByRole('button', { name: /SKIP/i })).toBeVisible();
  136 | 
  137 |     
  138 | 
```