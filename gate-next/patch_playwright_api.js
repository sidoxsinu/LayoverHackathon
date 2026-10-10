const fs = require('fs');
let code = fs.readFileSync('tests/main.spec.ts', 'utf8');

const apiMock = `
  test.beforeEach(async ({ page }) => {
    // Mock the AI mission API so tests are fast and deterministic
    await page.route('/api/mission', async route => {
      const json = {
        id: 'test_m',
        icon: 'MOVE',
        type: 'TEST',
        text: 'TEST MISSION FROM MOCK.',
        mins: 10,
        need: 'sanity',
        boost: 30
      };
      await route.fulfill({ json });
    });

    await page.clock.install();
`;

code = code.replace(/test\.beforeEach\(async \(\{ page \}\) => \{\n    await page\.clock\.install\(\);/, apiMock);

fs.writeFileSync('tests/main.spec.ts', code);
