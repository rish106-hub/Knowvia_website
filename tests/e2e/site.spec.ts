import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const publicRoutes = [
  "/",
  "/for-families",
  "/for-employers",
  "/how-it-works",
  "/blog",
  "/blog/room-rent-limit",
  "/blog/employer-cover-after-leaving-a-job",
  "/blog/super-top-up-deductible",
  "/blog/cashless-vs-reimbursement",
  "/blog/family-policy-access",
  "/blog/planned-hospital-admission",
  "/about",
  "/trust",
  "/privacy",
  "/terms",
  "/cookies",
];

const THIRD_PARTY = /posthog\.com|googletagmanager\.com|google\.com|doubleclick\.net|googleadservices\.com/;

async function blockThirdParties(page: Page) {
  const contacted: string[] = [];
  await page.route(THIRD_PARTY, (route) => {
    contacted.push(new URL(route.request().url()).hostname);
    return route.abort();
  });
  return contacted;
}

async function decideConsent(page: Page, choice: "Accept all" | "Reject all") {
  await page.getByTestId("consent-banner").getByRole("button", { name: choice }).click();
  await expect(page.getByTestId("consent-banner")).toBeHidden();
}

test.describe("public pages", () => {
  for (const route of publicRoutes) {
    test(`${route} renders one h1, metadata, no script errors and passes axe`, async ({ page }) => {
      await blockThirdParties(page);
      const scriptErrors: string[] = [];
      page.on("pageerror", (error) => scriptErrors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error" && !message.text().includes("net::ERR_FAILED")) scriptErrors.push(message.text());
      });
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /localhost:3200/);
      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target).join(", ")}`)).toEqual([]);
      expect(scriptErrors).toEqual([]);
    });
  }

  test("articles publish valid Article structured data", async ({ page }) => {
    await page.goto("/blog/cashless-vs-reimbursement");
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const article = blocks.map((text) => JSON.parse(text)).find((data) => data["@type"] === "Article");
    expect(article).toMatchObject({ headline: "Cashless versus reimbursement claims", datePublished: "2026-10-02" });
    expect(article.citation.length).toBeGreaterThan(0);
  });

  test("non-production builds are not indexable", async ({ page, request }) => {
    await page.goto("/");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /");
    expect(await (await request.get("/sitemap.xml")).text()).toContain("/blog/room-rent-limit");
  });

  test("security headers are sent", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"]).toContain("object-src 'none'");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("the workspace placeholder is noindex", async ({ page }) => {
    const response = await page.goto("/workspace");
    expect(response?.headers()["x-robots-tag"]).toContain("noindex");
  });

  test("unknown pages return 404 with a way back", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("link", { name: "Go to the home page" })).toBeVisible();
  });
});

test.describe("consent", () => {
  test("no analytics or advertising request before consent, or after rejecting", async ({ page }) => {
    const contacted = await blockThirdParties(page);
    await page.goto("/");
    await page.getByRole("link", { name: "For my family" }).click();
    await page.waitForLoadState("networkidle");
    expect(contacted).toEqual([]);
    await decideConsent(page, "Reject all");
    await page.goto("/blog/room-rent-limit");
    await page.waitForLoadState("networkidle");
    expect(contacted).toEqual([]);
  });

  test("accepting loads analytics and advertising only after the click", async ({ page }) => {
    const contacted = await blockThirdParties(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(contacted).toEqual([]);
    await decideConsent(page, "Accept all");
    await expect.poll(() => contacted.some((host) => host.includes("googletagmanager.com"))).toBe(true);
  });

  test("banner choices have equal prominence", async ({ page }) => {
    await page.goto("/");
    const buttons = page.getByTestId("consent-banner").getByRole("button");
    await expect(buttons).toHaveCount(3);
    const boxes = await Promise.all((await buttons.all()).map((button) => button.boundingBox()));
    const widths = boxes.map((box) => Math.round(box!.width));
    const heights = boxes.map((box) => Math.round(box!.height));
    expect(new Set(heights).size).toBe(1);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(2);
  });

  test("cookie settings can be reopened and changed from the footer", async ({ page }) => {
    await page.goto("/");
    await decideConsent(page, "Reject all");
    await page.getByRole("button", { name: "Cookie settings" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Cookie settings" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("checkbox", { name: /Analytics/ }).check();
    await dialog.getByRole("button", { name: "Save choices" }).click();
    const cookie = (await page.context().cookies()).find((item) => item.name === "kv_consent");
    expect(JSON.parse(decodeURIComponent(cookie!.value))).toMatchObject({ analytics: true, advertising: false });
  });
});

test.describe("interaction", () => {
  test.beforeEach(async ({ page }) => {
    await blockThirdParties(page);
    await page.goto("/");
    await decideConsent(page, "Reject all");
  });

  test("skip link moves focus to main content", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard flow checked on desktop");
    await page.reload();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });

  test("walkthrough tabs work with arrow keys", async ({ page }) => {
    const tablist = page.getByRole("tablist", { name: "The Rao household steps" });
    await tablist.getByRole("tab", { name: /Household cover/ }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(tablist.getByRole("tab", { name: /Evidence status/ })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("Cataract sub-limit on the senior policy")).toBeVisible();
    await page.keyboard.press("End");
    await expect(tablist.getByRole("tab", { name: /Next steps/ })).toBeFocused();
  });

  test("cash scenario recalculates from the controls", async ({ page }) => {
    const tablist = page.getByRole("tablist", { name: "The Rao household steps" });
    await tablist.getByRole("tab", { name: /Cash scenario/ }).click();
    await expect(page.getByText("₹57,000")).toBeVisible();
    await page.getByRole("radio", { name: /Room within the limit/ }).check();
    await expect(page.getByText("₹0", { exact: true })).toBeVisible();
  });

  test("guide opens, offers fixed destinations only and closes with Escape", async ({ page }) => {
    await page.getByRole("button", { name: "Guide" }).click();
    const guide = page.getByRole("navigation", { name: "Knowvia guide" });
    await expect(guide.getByRole("link")).toHaveCount(4);
    await expect(guide.locator("input, textarea")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(guide).toBeHidden();
    await expect(page.getByRole("button", { name: "Guide" })).toBeFocused();
  });

  test("theme toggle switches and the stored theme applies before hydration", async ({ page, browser }) => {
    await page.getByRole("button", { name: /Switch to dark theme/ }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const storage = await page.context().storageState();
    // Same storage, JavaScript bundles blocked: only the inline head script can set the theme.
    const context = await browser.newContext({ storageState: storage });
    const fresh = await context.newPage();
    await fresh.route(/\/_next\/static\/chunks\/.*\.js/, (route) => route.abort());
    await fresh.goto("/");
    await expect(fresh.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(fresh.locator("html")).toHaveAttribute("data-consent", "set");
    await expect(fresh.getByTestId("consent-banner")).toBeHidden();
    await context.close();
  });
});

test.describe("responsive layout", () => {
  for (const width of [320, 360, 390, 412, 768, 1280]) {
    test(`no horizontal scroll or clipped hero CTA at ${width}px`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.route(THIRD_PARTY, (route) => route.abort());
      for (const route of ["/", "/for-families", "/blog/room-rent-limit"]) {
        await page.goto(route);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, route).toBeLessThanOrEqual(0);
      }
      await page.goto("/");
      const cta = page.locator(".hero").getByRole("link", { name: "Join early access" });
      const box = await cta.boundingBox();
      expect(box!.height).toBeLessThan(60); // label did not wrap
      await context.close();
    });
  }

  test("text stays usable at 200% zoom", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 640, height: 800 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.route(THIRD_PARTY, (route) => route.abort());
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await context.close();
  });
});
