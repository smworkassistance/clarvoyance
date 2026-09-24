const { defineConfig, devices } = require('@playwright/test');
const path = require('path');
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(__dirname, '.browsers');
const PORT = Number(process.env.QA_PORT || 4173);
module.exports = defineConfig({
  testDir: './tests',
  timeout: 120000,
  retries: 1,            // one retry absorbs a flaky network moment; a real regression fails twice
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/report.json' }]],
  use: { baseURL: `http://127.0.0.1:${PORT}`, serviceWorkers: 'block', trace: 'off', locale: 'en-IN', timezoneId: 'Asia/Kolkata' },
  webServer: { command: 'node serve.js', url: `http://127.0.0.1:${PORT}/`, reuseExistingServer: false, timeout: 30000, env: { QA_TARGET: process.env.QA_TARGET || 'index.html', QA_PORT: String(PORT) } },
  projects: [
    { name: 'chromium-android', use: { ...devices['Pixel 7'] } },
    { name: 'webkit-iphone', use: { ...devices['iPhone 14'] } }
  ],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.03 } },
  snapshotPathTemplate: '{testDir}/__snapshots__/{projectName}/{arg}{ext}'
});
