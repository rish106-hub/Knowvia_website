import { defineConfig } from "@playwright/test";

// E2E for the /app screens. The BFF is NOT started against a real backend: specs mock `/api/app/*` with page.route.
// The Next dev server runs with APP_ENABLED=true so the /app pages render. Parallel slices use their own port and
// build dir:  E2E_PORT=3101 NEXT_DIST_DIR=.next-s2 npx playwright test -c playwright.app.config.ts tests/e2e/s2
const PORT = Number(process.env.E2E_PORT ?? 3101);
const DIST = process.env.NEXT_DIST_DIR ?? `.next-e2e-${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}-{platform}{ext}",
  fullyParallel: true,
  workers: 4,
  retries: 0,
  reporter: [["list"]],
  expect: { toHaveScreenshot: { animations: "disabled", caret: "hide", scale: "css", maxDiffPixelRatio: 0 } },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    contextOptions: { reducedMotion: "reduce" },
    colorScheme: "light",
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
    deviceScaleFactor: 1,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: {
    command: `npx next dev --hostname 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/onboarding`,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
    env: {
      NEXT_DIST_DIR: DIST,
      APP_ENABLED: "true",
      APP_DEV_IDENTITY: "true",
      COVERSAATH_API_URL: "http://127.0.0.1:9",
      COVERSAATH_BOOTSTRAP_TOKEN: "e2e-fake-bootstrap-token-not-real",
      APP_SESSION_SECRET: "e2e-fake-session-secret-0123456789abcdef",
    },
  },
});
