import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    channel: 'chrome', // Use system Chrome to avoid long Chromium downloads
  },
  projects: [
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'], channel: 'chrome' },
    },
  ],
});
