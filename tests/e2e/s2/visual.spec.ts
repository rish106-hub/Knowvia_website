// Screenshot baselines for the three screens that carry the most state. Written to
// tests/e2e/__screenshots__/s2/visual.spec.ts/ by the shared playwright.app.config.ts.
// Update with:  E2E_PORT=3101 NEXT_DIST_DIR=.next-s2 npx playwright test -c playwright.app.config.ts tests/e2e/s2/visual.spec.ts --update-snapshots
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { FakeBff, docAt } from "./fake-bff";

const STYLE = path.join(__dirname, "screenshot.css");
const WIDTHS = [320, 375, 768, 1024, 1440];

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
}

test.describe("baselines", () => {
  for (const width of WIDTHS) {
    test(`signed out at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const bff = new FakeBff({ signedIn: false });
      await bff.install(page);
      await page.goto("/app/sign-in");
      await expect(page.getByLabel("Email")).toBeVisible();
      await settle(page);
      await expect(page).toHaveScreenshot(`signed-out-${width}.png`, { fullPage: true, stylePath: STYLE });
    });

    test(`empty documents at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const bff = new FakeBff({ documents: [] });
      await bff.install(page);
      await page.goto("/app/documents");
      await expect(page.getByTestId("empty-documents")).toBeVisible();
      await expect(page.locator('[data-consent-scope="collect"]')).toBeVisible();
      await settle(page);
      await expect(page).toHaveScreenshot(`empty-documents-${width}.png`, { fullPage: true, stylePath: STYLE });
    });

    test(`mixed stages at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const docs = [
        docAt("awaiting_checks", { documentKind: "policy_schedule", uploadedAt: "2026-10-20T10:40:00.000Z" }),
        docAt("awaiting_ocr_consent", { documentKind: "policy_wording", uploadedAt: "2026-10-20T10:35:00.000Z", byteSize: 4_718_592 }),
        docAt("processing", { documentKind: "endorsement", uploadedAt: "2026-10-20T10:30:00.000Z", byteSize: 655_360 }),
        docAt("readable", { documentKind: "policy_schedule", uploadedAt: "2026-10-19T09:00:00.000Z" }),
        docAt("unreadable", { documentKind: "policy_wording", uploadedAt: "2026-10-18T09:00:00.000Z", byteSize: 9_437_184 }),
        docAt("rejected", { documentKind: "endorsement", uploadedAt: "2026-10-17T09:00:00.000Z", byteSize: 120_000 }),
      ];
      const bff = new FakeBff({
        documents: docs,
        consents: [{ scope: "collect", grantId: "grant-collect-0", documentIds: [], grantedAt: "2026-10-17T08:00:00.000Z", noticeStatus: "draft_needs_legal_review" }],
      });
      await bff.install(page);
      await page.goto("/app/documents");
      await expect(page.locator(".kva-docs li")).toHaveCount(6);
      await settle(page);
      await expect(page).toHaveScreenshot(`mixed-stages-${width}.png`, { fullPage: true, stylePath: STYLE });
    });
  }
});
