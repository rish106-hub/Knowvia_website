import { expect, test } from "@playwright/test";
import { FakeBff } from "../s2/fake-bff";

// W-A1: S00 start and S01 emergency. Needs Playwright browsers (run with playwright.app.config.ts).
test.describe("start and emergency", () => {
  test("signed out: /app goes to /app/start, the logo points there, and there are three tiles", async ({ page }) => {
    const bff = new FakeBff({ signedIn: false });
    await bff.install(page);
    await page.goto("/app");
    await expect(page).toHaveURL(/\/app\/start$/);
    await expect(page.getByRole("link", { name: "CoverSaath" }).first()).toHaveAttribute("href", "/app/start");
    await expect(page.getByTestId("entry-tile")).toHaveCount(3);
    await expect(page.getByRole("heading", { level: 1, name: "What do you need right now?" })).toBeVisible();
  });

  test("the emergency tile reaches S01 in one click, with no session request", async ({ page }) => {
    const bff = new FakeBff({ signedIn: false });
    await bff.install(page);
    await page.goto("/app/start");
    await page.getByRole("link", { name: /Someone needs care now/ }).click();
    await expect(page).toHaveURL(/\/app\/emergency$/);
    await expect(page.getByText(/Not medical advice/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Call 112/ })).toHaveAttribute("href", "tel:112");
    await expect(page.getByText("Call the helpline printed on your health card")).toBeVisible();
    expect(bff.calledKeys()).toEqual([]);
  });

  test("the other tiles go to sign-in with their mode", async ({ page }) => {
    const bff = new FakeBff({ signedIn: false });
    await bff.install(page);
    await page.goto("/app/start");
    await expect(page.getByRole("link", { name: /Care is coming up/ })).toHaveAttribute("href", "/app/sign-in?mode=planned");
    await expect(page.getByRole("link", { name: /Someone asked me to set this up/ })).toHaveAttribute("href", "/app/sign-in?mode=asked");
  });

  test("the sign-in heading says CoverSaath", async ({ page }) => {
    const bff = new FakeBff({ signedIn: false });
    await bff.install(page);
    await page.goto("/app/sign-in");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("CoverSaath");
  });

  test.describe("motion preference", () => {
    test.describe("no-preference", () => {
      test.use({ contextOptions: { reducedMotion: "no-preference" } });
      test("a tile has a real transition", async ({ page }) => {
        await new FakeBff({ signedIn: false }).install(page);
        await page.goto("/app/start");
        const duration = await page.getByTestId("entry-tile").first().evaluate((el) => getComputedStyle(el).transitionDuration);
        expect(duration).not.toBe("0s");
      });
    });
    test.describe("reduce", () => {
      test.use({ contextOptions: { reducedMotion: "reduce" } });
      test("a tile has no transition", async ({ page }) => {
        await new FakeBff({ signedIn: false }).install(page);
        await page.goto("/app/start");
        const duration = await page.getByTestId("entry-tile").first().evaluate((el) => getComputedStyle(el).transitionDuration);
        expect(duration.split(",").every((part) => part.trim() === "0s")).toBe(true);
      });
    });
  });
});
