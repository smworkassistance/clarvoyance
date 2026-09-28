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
  use: { baseURL: `http://127.0.0.1:${PORT}`, serviceWorkers: 'block', trace: 'off'},
  webServer: { command: 'node serve.js', url: `http://127.0.0.1:${PORT}/`, reuseExistingServer: false, timeout: 30000, env: { QA_TARGET: process.env.QA_TARGET || 'index.html', QA_PORT: String(PORT) } },
  // Local gate = Chromium/Android. WebKit (iPhone engine) runs on CI (Linux/macOS), where it is stable: Playwright's WebKit build for Windows is
  // known to hang on browserContext.newPage (microsoft/playwright #18953, #3939). Force it locally with QA_WEBKIT=1 if you want to try.
  projects: [
    { name: 'chromium-android', use: { ...devices['Pixel 7'] } },
    ...((process.env.CI || process.env.QA_WEBKIT) ? [{ name: 'webkit-iphone', use: { ...devices['iPhone 14'] } }] : [])
  ],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.03 } },
  snapshotPathTemplate: '{testDir}/__snapshots__/{platform}/{projectName}/{arg}{ext}' // per-OS baselines (font rendering differs between Windows and Linux)
});
