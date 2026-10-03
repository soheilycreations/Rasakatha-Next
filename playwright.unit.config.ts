import { defineConfig } from "@playwright/test";

// Unit tests for the pure logic (money, permissions, sessions, TOTP, audit rows, route coverage).
// No browser and no server: `npm run test:unit`.
try {
  process.loadEnvFile(".env.local");
} catch {
  // CI sets the variables itself
}

export default defineConfig({
  testDir: "tests/unit",
  timeout: 20_000,
  fullyParallel: true,
  reporter: [["list"]],
});
