// tools/capture-screenshots.mjs
// Real app screenshot capture and hero image composer for hackathon judging
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const appDir = path.resolve(rootDir, 'gate-next');
const assetsDir = path.resolve(rootDir, 'docs/assets');
const screensDir = path.resolve(assetsDir, 'screenshots');

fs.mkdirSync(screensDir, { recursive: true });

async function run() {
  console.log('[Screenshots] Loading Playwright from gate-next/node_modules...');
  const { chromium } = await import(path.join(appDir, 'node_modules/@playwright/test/index.mjs'));

  const port = 3008;
  console.log(`[Screenshots] Starting local production Next.js server on port ${port}...`);
  const server = spawn('npx', ['next', 'start', '-p', String(port)], {
    cwd: appDir,
    stdio: 'ignore',
    env: { ...process.env, PORT: String(port) }
  });

  // Wait for server to become responsive
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://localhost:${port}/`);
      if (res.status === 200) {
        ready = true;
        break;
      }
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  if (!ready) {
    server.kill();
    throw new Error('Production server failed to respond on port ' + port);
  }
  console.log('[Screenshots] Server ready. Launching headless browser (390x844)...');

  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 GATE-Judge',
  });

  const page = await context.newPage();

  try {
    // 1. SETUP SCREEN
    if (!fs.existsSync(path.join(screensDir, '01-setup.png'))) {
      console.log('[Screenshots] Capturing 01-setup.png...');
      await page.goto(`http://localhost:${port}/`);
      await page.waitForLoadState('networkidle');

      // If on Auth screen, click CONTINUE AS GUEST
      const guestBtn = page.getByRole('button', { name: /CONTINUE AS GUEST/i });
      if (await guestBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await guestBtn.click();
        await page.waitForTimeout(500);
      }

      // Dismiss tour if present
      const skipTourBtn = page.getByRole('button', { name: /SKIP TOUR/i });
      if (await skipTourBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await skipTourBtn.click();
        await page.waitForTimeout(300);
      }

      // Fill in realistic venue
      const venueInput = page.locator('input[placeholder*="VENUE"], [data-tour="setup-venue"] input').first();
      if (await venueInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await venueInput.fill('TINKERSPACE, CALICUT');
      }

      await page.screenshot({ path: path.join(screensDir, '01-setup.png') });
    }

    // 2. QUEST SCREEN
    if (!fs.existsSync(path.join(screensDir, '02-quest.png'))) {
      console.log('[Screenshots] Capturing 02-quest.png...');
      // Triple-tap wordmark for Demo Mode
      const wordmark = page.getByRole('button', { name: 'GATE' }).first();
      if (await wordmark.isVisible({ timeout: 2000 }).catch(() => false)) {
        await wordmark.click();
        await page.waitForTimeout(150);
        await wordmark.click();
        await page.waitForTimeout(150);
        await wordmark.click();
        await page.waitForTimeout(500);
      }

      // If not started yet, click START
      const startBtn = page.getByRole('button', { name: /START (LAYOVER|WAIT)/i });
      if (await startBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await startBtn.click();
        await page.waitForTimeout(1000);
      }

      await page.screenshot({ path: path.join(screensDir, '02-quest.png') });
    }

    // 3. URGENT BANNER
    if (!fs.existsSync(path.join(screensDir, '03-urgent.png'))) {
      console.log('[Screenshots] Waiting for urgent banner (03-urgent.png)...');
      await page.waitForSelector('text=WALK TO', { timeout: 65000 }).catch(() => {});
      await page.screenshot({ path: path.join(screensDir, '03-urgent.png') });
    }

    // 4. ALARM SCREEN
    if (!fs.existsSync(path.join(screensDir, '04-alarm.png'))) {
      console.log('[Screenshots] Waiting for alarm trigger (04-alarm.png)...');
      await page.waitForSelector('text=I AM AT THE', { timeout: 25000 }).catch(() => {});
      await page.screenshot({ path: path.join(screensDir, '04-alarm.png') });
    }

    // 5. SAFE TRAVELS SCREEN
    if (!fs.existsSync(path.join(screensDir, '05-safe-travels.png'))) {
      console.log('[Screenshots] Capturing 05-safe-travels.png...');
      const atGateBtn = page.getByRole('button', { name: /I AM AT THE/i });
      if (await atGateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await atGateBtn.click();
        await page.waitForTimeout(1000);
      }
      await page.screenshot({ path: path.join(screensDir, '05-safe-travels.png') });
    }

    // 6. PASSPORT SCREEN WITH RANK SHEET
    console.log('[Screenshots] Capturing 06-passport.png...');
    await page.goto(`http://localhost:${port}/passport`);
    await page.waitForLoadState('networkidle');

    // Dismiss tour if present
    const skipTourBtnPassport = page.getByRole('button', { name: /SKIP TOUR/i });
    if (await skipTourBtnPassport.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipTourBtnPassport.click();
      await page.waitForTimeout(300);
    }

    // Open "WHAT IS THIS?" rank explainer sheet
    const whatIsThisBtn = page.getByRole('button', { name: /WHAT IS THIS\?/i });
    if (await whatIsThisBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await whatIsThisBtn.click({ force: true });
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: path.join(screensDir, '06-passport.png') });

    // 7. TRIPS SCREEN
    console.log('[Screenshots] Capturing 07-trips.png...');
    await page.goto(`http://localhost:${port}/trips`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screensDir, '07-trips.png') });

    // 8. COMPOSITE HERO IMAGE
    console.log('[Screenshots] Building composite hero image (docs/assets/hero.png)...');
    const heroPage = await context.newPage();
    await heroPage.setViewportSize({ width: 1600, height: 900 });

    const s1 = fs.readFileSync(path.join(screensDir, '01-setup.png')).toString('base64');
    const s2 = fs.readFileSync(path.join(screensDir, '02-quest.png')).toString('base64');
    const s3 = fs.readFileSync(path.join(screensDir, '04-alarm.png')).toString('base64');
    const s4 = fs.readFileSync(path.join(screensDir, '05-safe-travels.png')).toString('base64');

    const heroHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background-color: #101010;
            color: #E6E1D3;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
            width: 1600px;
            height: 900px;
            display: flex;
            flex-direction: column;
            justifyContent: space-between;
            padding: 40px;
            overflow: hidden;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-bottom: 2px solid #34322C;
            padding-bottom: 20px;
          }
          .title {
            font-size: 42px;
            font-weight: 900;
            letter-spacing: 2px;
            color: #E6E1D3;
          }
          .subtitle {
            font-size: 18px;
            color: #F2A900;
            font-family: monospace;
            letter-spacing: 1px;
            margin-top: 6px;
          }
          .tag {
            background: #181816;
            border: 1px solid #34322C;
            padding: 8px 16px;
            font-family: monospace;
            font-size: 14px;
            color: #8C887C;
          }
          .gallery {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 28px;
            align-items: center;
            height: 680px;
          }
          .card {
            background: #181816;
            border: 1px solid #34322C;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .caption {
            background: #181816;
            border-top: 1px solid #34322C;
            padding: 10px 14px;
            font-family: monospace;
            font-size: 13px;
            color: #E6E1D3;
            display: flex;
            justify-content: space-between;
          }
          .caption span { color: #F2A900; }
          .img-frame {
            height: 600px;
            overflow: hidden;
            display: flex;
            justify-content: center;
            background: #000;
          }
          .img-frame img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: top;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">GATE // LAYOVER COMPANION</div>
            <div class="subtitle">TURNS TRANSIT WAITING TIME INTO A STRUCTURED SURVIVAL QUEST</div>
          </div>
          <div class="tag">HACKATHON BUILD · OCTOBER 2026</div>
        </div>
        <div class="gallery">
          <div class="card">
            <div class="img-frame"><img src="data:image/png;base64,${s1}" /></div>
            <div class="caption"><span>01</span> SETUP & VENUE PINPOINT</div>
          </div>
          <div class="card">
            <div class="img-frame"><img src="data:image/png;base64,${s2}" /></div>
            <div class="caption"><span>02</span> SURVIVAL QUEST & STATS</div>
          </div>
          <div class="card">
            <div class="img-frame"><img src="data:image/png;base64,${s3}" /></div>
            <div class="caption"><span>03</span> HARD-STEPPING ALARM</div>
          </div>
          <div class="card">
            <div class="img-frame"><img src="data:image/png;base64,${s4}" /></div>
            <div class="caption"><span>04</span> STAMPED SAFE TRAVELS</div>
          </div>
        </div>
      </body>
      </html>
    `;

    await heroPage.setContent(heroHtml);
    await heroPage.waitForTimeout(500);
    await heroPage.screenshot({ path: path.join(assetsDir, 'hero.png') });
    console.log('[Screenshots] hero.png generated successfully!');

  } finally {
    await browser.close();
    server.kill();
    console.log('[Screenshots] Done. Production server stopped.');
  }
}

run().catch(err => {
  console.error('[Screenshots] Error:', err);
  process.exit(1);
});
