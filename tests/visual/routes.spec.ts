import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/onboarding",
  "/onboarding/coming-up",
  "/onboarding/people",
  "/onboarding/sharing",
  "/onboarding/add-policies",
  "/onboarding/reading",
  "/onboarding/your-cover",
  "/for-partners",
  "/privacy",
  "/terms",
];
const widths = [320, 375, 768, 1024, 1440];

for (const route of routes) {
  for (const width of widths) {
    const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
    test(`${route} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(`${slug}-${width}.png`, { fullPage: true });
    });
  }
}
