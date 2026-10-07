/**
 * Record the synthetic walkthrough assets:
 *   npm run build && npx next start -p 3200
 *   node scripts/record-walkthroughs.mjs
 */
import { copyFile, mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3200";
const outputDirectory = path.join(process.cwd(), "public", "walkthroughs");
const viewportSize = { width: 960, height: 600 };
// Recording and page viewport are identical so the capture has no padded right or bottom edge.
const videoSize = viewportSize;

const journeys = [
  {
    name: "family",
    path: "/for-families",
    labels: ["Household cover", "What we know", "Hospital cost", "Next steps"],
  },
  {
    name: "team",
    path: "/for-employers",
    labels: ["Enrolment status", "Employee questions", "Who does what"],
  },
];

function consentCookie() {
  return encodeURIComponent(
    JSON.stringify({
      analytics: false,
      advertising: false,
      version: 1,
      updatedAt: new Date().toISOString(),
    }),
  );
}

function roundSeconds(milliseconds) {
  return Math.round((milliseconds / 1000) * 10) / 10;
}

async function moveFile(source, destination) {
  try {
    await rename(source, destination);
  } catch (error) {
    if (error?.code !== "EXDEV") throw error;
    await copyFile(source, destination);
    await rm(source, { force: true });
  }
}

async function installRecordingStage(page) {
  await page.addStyleTag({
    content: `
      html, body { width: 100%; height: 100%; overflow: hidden !important; background: var(--bg) !important; }
      body > * { visibility: hidden !important; }
      .walkthrough, .walkthrough * { visibility: visible !important; }
      .walkthrough {
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        width: min(880px, calc(100vw - 48px)) !important;
        max-width: 880px !important;
        transform: translate(-50%, -50%) !important;
        z-index: 1 !important;
      }
      .site-header, .site-footer, .guide, .consent-banner, .consent-dialog { display: none !important; }
    `,
  });
}

async function recordJourney(browser, journey, theme, videoDirectory) {
  const context = await browser.newContext({
    recordVideo: { dir: videoDirectory, size: videoSize },
    viewport: viewportSize,
    deviceScaleFactor: 2,
    reducedMotion: "no-preference",
  });

  try {
    const page = await context.newPage();
    const video = page.video();
    const recordingStartedAt = performance.now();
    const origin = new URL(baseUrl).origin;

    await context.addCookies([
      {
        name: "kv_consent",
        value: consentCookie(),
        url: origin,
        sameSite: "Lax",
        expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 180,
      },
    ]);
    // This is deliberately the same pre-paint storage/data attribute contract as init-scripts.ts.
    await page.addInitScript((selectedTheme) => {
      try {
        localStorage.setItem("kv-theme", selectedTheme);
        document.documentElement.dataset.theme = selectedTheme;
      } catch {}
    }, theme);

    // Paint only the page background until the stage is installed, so the recording never
    // flashes the full page. The player starts its loop at the first chapter, after this lead-in.
    await page.addInitScript(() => {
      const style = document.createElement("style");
      style.id = "walkthrough-recording-preload";
      style.textContent = "body > * { visibility: hidden !important; }";
      document.documentElement.append(style);
    });

    await page.goto(new URL(journey.path, baseUrl).toString(), { waitUntil: "domcontentloaded" });
    const developmentPortals = page.locator("nextjs-portal, [data-nextjs-toast], [data-next-badge-root]");
    if ((await developmentPortals.count()) > 0) {
      throw new Error("Next.js development UI is present. Record only from next build plus next start.");
    }
    const walkthrough = page.locator(`.walkthrough[data-journey="${journey.name}"]`);
    await walkthrough.waitFor({ state: "visible" });
    await installRecordingStage(page);
    await walkthrough.waitFor({ state: "visible" });

    // Video capture starts with the context. Leave a small lead-in after page creation,
    // while recording chapter times against that same initial instant.
    const elapsed = () => performance.now() - recordingStartedAt;
    await page.waitForTimeout(Math.max(0, 300 - elapsed()));

    const chapters = [];
    const markChapter = (label) => chapters.push({ label, start: elapsed() });
    const tabs = walkthrough.getByRole("tab");

    markChapter(journey.labels[0]);
    await page.waitForTimeout(2200);

    for (let index = 1; index < journey.labels.length; index += 1) {
      const tab = tabs.nth(index);
      await tab.click();
      await page.locator('.walkthrough-tab[aria-selected="true"]').waitFor({ state: "visible" });
      markChapter(journey.labels[index]);

      if (journey.name === "family" && journey.labels[index] === "Hospital cost") {
        await page.waitForTimeout(1400);
        await walkthrough.getByLabel("Room within the limit (₹5,000 a day)").check();
        await page.waitForTimeout(1200);
        await walkthrough.getByLabel("Larger single room (₹8,000 a day)").check();
        await page.waitForTimeout(200);
      } else {
        await page.waitForTimeout(2800);
      }
    }

    await tabs.nth(0).click();
    await page.locator('.walkthrough-tab[aria-selected="true"]').waitFor({ state: "visible" });
    await page.waitForTimeout(1200);
    const duration = elapsed();

    await page.screenshot({
      path: path.join(outputDirectory, `${journey.name}-${theme}.jpg`),
      type: "jpeg",
      quality: 80,
    });
    await context.close();

    if (!video) throw new Error("Playwright did not attach a video to the recording page.");
    await moveFile(await video.path(), path.join(outputDirectory, `${journey.name}-${theme}.webm`));
    return { chapters, duration };
  } catch (error) {
    await context.close();
    throw error;
  }
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  const videoDirectory = await mkdtemp(path.join(os.tmpdir(), "knowvia-walkthroughs-"));
  const browser = await chromium.launch();
  const timings = {};

  try {
    for (const journey of journeys) {
      for (const theme of ["light", "dark"]) {
        const result = await recordJourney(browser, journey, theme, videoDirectory);
        if (theme === "light") timings[journey.name] = result;
      }
    }
  } finally {
    await browser.close();
    await rm(videoDirectory, { recursive: true, force: true });
  }

  const output = Object.fromEntries(
    journeys.map(({ name }) => [
      name,
      {
        chapters: timings[name].chapters.map(({ label, start }) => ({ label, start: roundSeconds(start) })),
        duration: roundSeconds(timings[name].duration),
      },
    ]),
  );
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
