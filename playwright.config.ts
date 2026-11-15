import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["junit", { outputFile: "test-results/e2e.xml" }],
  ],
  use: {
    baseURL: process.env.BASE_URL || "http://127.0.0.1:8793",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer:
    process.env.CI && !process.env.BASE_URL
      ? {
          command:
            "npm run db:local && npx wrangler dev --ip 127.0.0.1 --port 8793",
          url: "http://127.0.0.1:8793/api/health",
          reuseExistingServer: false,
          timeout: 120000,
        }
      : undefined,
});
