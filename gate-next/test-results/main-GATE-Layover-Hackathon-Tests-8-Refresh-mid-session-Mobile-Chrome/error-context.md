# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: main.spec.ts >> GATE Layover Hackathon Tests >> 8. Refresh mid-session
- Location: tests/main.spec.ts:160:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=XP').locator('..').getByText('40', { exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=XP').locator('..').getByText('40', { exact: true }) with timeout 5000ms
  - waiting for locator('text=XP').locator('..').getByText('40', { exact: true })

```

```yaml
- alert
- text: GATE 00:00:00 RETURN TO GATE TBA
- button "I AM AT THE GATE"
```

# Test source

```ts
  67  |     await dismissBtn.click();
  68  | 
  69  |     // Safe Travels
  70  |     await expect(page.getByText(/SAFE TRAVELS/i)).toBeVisible();
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
> 167 |     await expect(page.locator('text=XP').locator('..').getByText('40', { exact: true })).toBeVisible();
      |                                                                                          ^ Error: expect(locator).toBeVisible() failed
  168 | 
  169 |     // Reload page
  170 |     await page.reload();
  171 |     
  172 |     // XP should still be 40
  173 |     await expect(page.locator('text=XP').locator('..').getByText('40', { exact: true })).toBeVisible();
  174 | 
  175 |     // Advance time past returnBy (which is 19:15)
  176 |     await page.clock.fastForward(5 * 3600 * 1000);
  177 |     await page.reload();
  178 |     // Should go straight to alarm
  179 |     await expect(page.getByRole('button', { name: 'I AM AT THE GATE' })).toBeVisible();
  180 |   });
  181 | 
  182 |   test('9. Background simulation', async ({ page }) => {
  183 |     const now = new Date('2026-10-10T15:00:00Z');
  184 |     await page.clock.setFixedTime(now);
  185 |     
  186 |     // Return by in 16 mins
  187 |     await page.fill('input[type="time"]', '16:01');
  188 |     await page.getByRole('button', { name: /START LAYOVER/i }).click();
  189 |     
  190 |     // No heads up
  191 |     await expect(page.getByText(/HEADS UP/i)).not.toBeVisible();
  192 | 
  193 |     // Pause clock 60s, resume (simulate suspend/resume).
  194 |     await page.clock.fastForward(60000); 
  195 |     // Usually visibilitychange or focus triggers useNow to update
  196 |     await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  197 |     
  198 |     // Now it should be 15 mins left -> HEADS UP
  199 |     await expect(page.getByText(/HEADS UP/i)).toBeVisible();
  200 |   });
  201 | 
  202 |   test('10. Departure past midnight computes correctly', async ({ page }) => {
  203 |     const now = new Date('2026-10-10T23:50:00Z');
  204 |     await page.clock.setFixedTime(now);
  205 | 
  206 |     await page.fill('input[type="time"]', '00:40');
  207 |     // Departure is tomorrow 00:40
  208 |     await expect(page.getByText(/TOMORROW/i)).toBeVisible();
  209 | 
  210 |     // Return by is 45 mins before 00:40 => 23:55.
  211 |     // 23:55 is in the future.
  212 |     const startBtn = page.getByRole('button', { name: /START LAYOVER/i });
  213 |     await expect(startBtn).toBeEnabled();
  214 |   });
  215 | });
  216 | 
```