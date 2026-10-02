import { defineConfig } from "@playwright/test";

// Tests run against a production build:  npm run build && npm run test:e2e
// (uses the Supabase from .env.local, read-only; no test creates an order).
// Browser: the Microsoft Edge/Chrome already on the machine, so no browser download is needed.
// In CI set PLAYWRIGHT_CHANNEL=chromium after `npx playwright install chromium`.
const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`,
    channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge",
    trace: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npx next start -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
