import { defineConfig, devices } from "@playwright/test";

// Run `npm run test:e2e`, which builds with test-only public analytics IDs so the consent tests
// can prove those providers are not contacted before consent. All third-party traffic is intercepted.
const port = 3200;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "phone", use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 780 }, hasTouch: true, isMobile: true } },
  ],
  webServer: {
    command: `npx next start -p ${port}`,
    url: `http://localhost:${port}/api/health`,
    reuseExistingServer: false,
    env: { SITE_URL: `http://localhost:${port}`, TRUSTED_PROXY_HOPS: "1" },
  },
});
