import { defineConfig } from "@playwright/test";

// Visual baselines for the static routes. Run `npm run test:visual` (compares) or
// `npm run test:visual -- --update-snapshots` (rewrites). Baselines are per platform (darwin here).
// The browser is the one already in the Playwright cache (chromium headless shell); nothing is downloaded.
// The server is a production build (`next build` then `next start`) on its own port so it never clashes with `npm run dev`.
const PORT = 3100;

export default defineConfig({
  testDir: "tests/visual",
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
    command: `npm run build && npm run start -- --hostname 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/onboarding`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
