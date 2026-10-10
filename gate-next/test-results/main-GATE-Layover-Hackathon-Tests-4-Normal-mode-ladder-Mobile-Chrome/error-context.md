# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: main.spec.ts >> GATE Layover Hackathon Tests >> 4. Normal mode ladder
- Location: tests/main.spec.ts:120:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'IN X H Y M' })

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
  29  |   });
  30  | 
  31  |   await page.goto('/');
  32  |   await page.evaluate(() => window.localStorage.clear());
  33  | });
  34  | 
  35  |   test('1. Setup validation', async ({ page }) => {
  36  |     
  37  |     // 1a. Departure in the past with rollover shows "tomorrow"
  38  |     await page.fill('input[type="time"]', await page.evaluate(() => { const d = new Date(Date.now() - 120 * 60000); return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`; }));
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
> 129 |     await page.getByRole('button', { name: 'IN X H Y M' }).click();
      |                                                            ^ Error: locator.click: Test timeout of 30000ms exceeded.
  130 |     await page.fill('input[placeholder="H"]', '1');
  131 |     await page.fill('input[placeholder="M"]', '30'); 
  132 |     
  133 |     
  134 |     await page.getByRole('button', { name: /START LAYOVER/i }).click();
  135 |     await expect(page.getByRole('button', { name: /SKIP/i })).toBeVisible();
  136 | 
  137 |     
  138 | 
  139 |     // free > 15 min
  140 |     await expect(page.getByText(/START WRAPPING UP/i)).not.toBeVisible();
  141 |     await expect(page.getByText(/WALK TO GATE NOW/i)).not.toBeVisible();
  142 | 
  143 |     // fast forward to 14 min left (31 min forward)
  144 |     
  145 |         
  146 |     await page.evaluate((ms) => { window.fakeTime += ms; }, 31 * 60000);
  147 |     await page.clock.fastForward(31 * 60000);
  148 |   
  149 |   
  150 |     console.log("Test 4 state at 31m:", await page.locator('body').innerText());
  151 |     await expect(page.getByText(/START WRAPPING UP/i)).toBeVisible();
  152 | 
  153 |     // fast forward to 4 min left (10 min forward)
  154 |     
  155 |         
  156 |     await page.evaluate((ms) => { window.fakeTime += ms; }, 10 * 60000);
  157 |     await page.clock.fastForward(10 * 60000);
  158 |   
  159 |   
  160 |     await expect(page.getByText(/WALK TO GATE NOW/i)).toBeVisible();
  161 | 
  162 |     // fast forward to past 0
  163 |     
  164 |         
  165 |     await page.evaluate((ms) => { window.fakeTime += ms; }, 5 * 60000);
  166 |     await page.clock.fastForward(5 * 60000);
  167 |   
  168 |   
  169 |     await expect(page.getByRole('button', { name: 'I AM AT THE GATE' })).toBeVisible();
  170 |   });
  171 | 
  172 |   test('5. Stats drain', async ({ page }) => {
  173 | 
  174 |     page.on('console', msg => console.log('BROWSER LOG:', msg.text()));        await page.getByRole('button', { name: 'IN X H Y M' }).click();
  175 |     await page.fill('input[placeholder="H"]', '5');
  176 |     await page.fill('input[placeholder="M"]', '0');
  177 |     
  178 |     
  179 |     await page.getByRole('button', { name: /START LAYOVER/i }).click();
  180 |     await expect(page.getByRole('button', { name: /SKIP/i })).toBeVisible();
  181 | 
  182 |     
  183 |     
  184 |     // Check hunger starts at 60 (vibe tired => hunger 60)
  185 |     console.log("Test 5 state at start:", await page.locator('body').innerText());
  186 |     await expect(page.locator('div').filter({ hasText: 'HUNGER' }).getByText('70', { exact: true })).toBeVisible();
  187 | 
  188 |     // Fast forward 10 minutes. Drain rate is 0.3/min => -3. Should be 57.
  189 |     
  190 |         
  191 |     await page.evaluate((ms) => { window.fakeTime += ms; }, 10 * 60000);
  192 |     await page.clock.fastForward(10 * 60000);
  193 |   
  194 |   
  195 |     console.log('Test 5 state after fast forward:', await page.locator('body').innerText());
  196 |     await expect(page.locator('div').filter({ hasText: 'HUNGER' }).getByText('66', { exact: true })).toBeVisible();
  197 | 
  198 |     // Fast forward huge amount to clamp at 0
  199 |     
  200 |         
  201 |     await page.evaluate((ms) => { window.fakeTime += ms; }, 60 * 60000);
  202 |     await page.clock.fastForward(60 * 60000);
  203 |   
  204 |   
  205 |     console.log('Test 5 state at end:', await page.locator('body').innerText());
  206 |     await expect(page.locator('div').filter({ hasText: 'HUNGER' }).getByText('48', { exact: true })).toBeVisible();
  207 |   });
  208 | 
  209 |   test('6. Mission engine', async ({ page }) => {
  210 |         
  211 |     await page.getByRole('button', { name: 'IN X H Y M' }).click();
  212 |     await page.fill('input[placeholder="H"]', '0');
  213 |     await page.fill('input[placeholder="M"]', '55');
  214 |     
  215 |     
  216 |     await page.getByRole('button', { name: /START LAYOVER/i }).click();
  217 |     await expect(page.getByRole('button', { name: /SKIP/i })).toBeVisible();
  218 | 
  219 |     
  220 | 
  221 |     // Check we got a mission card
  222 |     const skipBtn = page.getByRole('button', { name: /SKIP/i });
  223 |     await expect(skipBtn).toBeVisible();
  224 |     
  225 |     // Clicking skip should generate a new mission or fallback.
  226 |     // It shouldn't crash.
  227 |     await skipBtn.click();
  228 |     await expect(skipBtn).toBeVisible();
  229 |   });
```