// Screenshot baselines (evidence view, preview with questions, empty state) at five widths. Mocked data only.
// Update with:  E2E_PORT=3102 NEXT_DIST_DIR=.next-s34 npx playwright test -c playwright.app.config.ts tests/e2e/s34/visual.spec.ts --update-snapshots
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { CASE_ID, DOC_ID, FakeCover, consentedOverview, docSetFor, handoffEverything, noDocsOverview, seedAnswer } from "./fake-cover";
import { previewBase, qDate, qMember } from "../../unit/app-evidence/fixtures";

const STYLE = path.join(__dirname, "screenshot.css");
const WIDTHS = [320, 375, 768, 1024, 1440];

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
}

for (const width of WIDTHS) {
  test.describe(`baselines at ${width}`, () => {
    test(`evidence view at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const fake = new FakeCover(consentedOverview());
      fake.handoff = handoffEverything();
      await fake.install(page);
      await page.goto("/app/cover");
      await expect(page.getByRole("heading", { name: "What we found" })).toBeVisible();
      await settle(page);
      await expect(page).toHaveScreenshot(`evidence-${width}.png`, { fullPage: true, stylePath: STYLE });
    });

    test(`preview with questions at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const fake = new FakeCover(consentedOverview());
      fake.previewFor = () => previewBase({ nextQuestions: [qMember, qDate] });
      await seedAnswer(page, docSetFor(CASE_ID, [DOC_ID]));
      await fake.install(page);
      await page.goto("/app/cover/preview");
      await expect(page.locator("[data-question]")).toHaveCount(2);
      await settle(page);
      await expect(page).toHaveScreenshot(`preview-${width}.png`, { fullPage: true, stylePath: STYLE });
    });

    test(`empty state at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const fake = new FakeCover(noDocsOverview());
      await fake.install(page);
      await page.goto("/app/cover");
      await expect(page.locator("[data-empty-state]")).toBeVisible();
      await settle(page);
      await expect(page).toHaveScreenshot(`empty-${width}.png`, { fullPage: true, stylePath: STYLE });
    });
  });
}
