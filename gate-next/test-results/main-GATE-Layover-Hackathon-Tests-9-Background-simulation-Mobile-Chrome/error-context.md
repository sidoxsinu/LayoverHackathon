# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: main.spec.ts >> GATE Layover Hackathon Tests >> 9. Background simulation
- Location: tests/main.spec.ts:188:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/START WRAPPING UP/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText(/START WRAPPING UP/i) with timeout 5000ms
  - waiting for getByText(/START WRAPPING UP/i)

```

```yaml
- alert
- text: GATE 00:00:00 RETURN TO GATE TBA
- button "I AM AT THE GATE"
```

# Test source

```ts
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
  175 |     // Reload page
  176 |     await page.reload();
  177 |     
  178 |     // XP should still be 40
  179 |     await expect(page.locator('div').filter({ hasText: 'TOTAL XP' }).getByText('40', { exact: true }).first()).toBeVisible();
  180 | 
  181 |     // Advance time past returnBy (which is 19:15)
  182 |     await page.clock.fastForward(5 * 3600 * 1000);
  183 |     await page.reload();
  184 |     // Should go straight to alarm
  185 |     await expect(page.getByRole('button', { name: 'I AM AT THE GATE' })).toBeVisible();
  186 |   });
  187 | 
  188 |   test('9. Background simulation', async ({ page }) => {
  189 |     const now = new Date('2026-10-10T15:00:00Z');
  190 |     await page.clock.install({ time: now });
  191 |     
  192 |     // Return by in 16 mins
  193 |     await page.fill('input[type="time"]', '16:01');
  194 |     await page.getByRole('button', { name: /START LAYOVER/i }).click();
  195 |     
  196 |     // No heads up
  197 |     await expect(page.getByText(/START WRAPPING UP/i)).not.toBeVisible();
  198 | 
  199 |     // Pause clock 120s, resume (simulate suspend/resume). Time left is 14 mins.
  200 |     await page.clock.fastForward(120000); 
  201 |     // Usually visibilitychange or focus triggers useNow to update
  202 |     await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  203 |     
  204 |     // Now it should be 14 mins left -> HEADS UP
> 205 |     await expect(page.getByText(/START WRAPPING UP/i)).toBeVisible();
      |                                                        ^ Error: expect(locator).toBeVisible() failed
  206 |   });
  207 | 
  208 |   test('10. Departure past midnight computes correctly', async ({ page }) => {
  209 |     const now = new Date('2026-10-10T23:50:00Z');
  210 |     await page.clock.install({ time: now });
  211 | 
  212 |     await page.fill('input[type="time"]', '00:40');
  213 |     // Departure is tomorrow 00:40
  214 |     await expect(page.getByText(/TOMORROW/i)).toBeVisible();
  215 | 
  216 |     // Return by is 45 mins before 00:40 => 23:55.
  217 |     // 23:55 is in the future.
  218 |     const startBtn = page.getByRole('button', { name: /START LAYOVER/i });
  219 |     await expect(startBtn).toBeEnabled();
  220 |   });
  221 | });
  222 | 
```