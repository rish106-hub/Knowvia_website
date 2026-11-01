import { expect, test } from "@playwright/test";
import { FakeBff, docAt } from "../s2/fake-bff";

// W-B2: the sample dashboards, the topic page (S12), the readiness checklist (S14) and the keep-my-document screen (S04).
// Needs Playwright browsers (run with playwright.app.config.ts, which sets APP_DEMO_DATA=true for the dev server).
// The /app/demo/* pages are served by the real BFF route: they need no session and no backend.

test.describe("sample dashboards", () => {
  test("/app/demo/empty shows 'Add your e-card first'", async ({ page }) => {
    await page.goto("/app/demo/empty");
    await expect(page.getByText("Add your e-card first").first()).toBeVisible();
    await expect(page.getByTestId("demo-banner")).toContainText("Sample data");
  });

  test("/app/demo/conflicting shows 'Your documents disagree' with both values", async ({ page }) => {
    await page.goto("/app/demo/conflicting");
    await expect(page.getByText("Your documents disagree").first()).toBeVisible();
    await expect(page.getByText("1% of sum insured").first()).toBeVisible();
    await expect(page.getByText("No limit stated").first()).toBeVisible();
  });

  test("a passage card says it is not an answer", async ({ page }) => {
    await page.goto("/app/demo/full");
    await expect(page.getByText("Passage from your document, not an answer").first()).toBeVisible();
  });

  for (const scenario of ["empty", "partial", "full", "conflicting"]) {
    test(`/app/demo/${scenario} has no 'score' anywhere`, async ({ page }) => {
      await page.goto(`/app/demo/${scenario}`);
      await expect(page.getByRole("heading", { level: 1, name: "Your cover, in one place" })).toBeVisible();
      expect(await page.locator("body").innerText()).not.toMatch(/score/i);
    });
  }

  test("an unknown scenario is a 404", async ({ page }) => {
    const response = await page.goto("/app/demo/nope");
    expect(response?.status()).toBe(404);
  });
});

test.describe("topic page (S12)", () => {
  const doc = docAt("readable", { id: "doc-1", documentKind: "policy_schedule" });
  const readFacts = {
    status: "ok" as const,
    data: {
      label: "read_not_checked" as const,
      notice: "Read from your documents by a rule, not checked.",
      excluded: [],
      documents: [{ documentId: "doc-1", documentKind: "policy_schedule", fields: [{ field: "room_rent_limit", topic: null, value: "1% of sum insured", state: "extracted_unverified" as const, page: 2, quote: "Room rent: 1% of the sum insured per day." }] }],
    },
  };

  test("shows the explainer, the read value with its page, and a passage that is not an answer", async ({ page }) => {
    const bff = new FakeBff({ documents: [doc], readFacts });
    await bff.install(page);
    await page.goto("/app/policies/room_rent");
    await expect(page.getByRole("heading", { level: 1, name: "Room rent" })).toBeVisible();
    await expect(page.getByText("A limit the policy may set on the daily hospital room charge.")).toBeVisible();
    await expect(page.getByText("Read, not checked").first()).toBeVisible();
    await expect(page.getByText("1% of sum insured").first()).toBeVisible();
    await expect(page.getByText("Passage from your document, not an answer").first()).toBeVisible();
    expect(bff.callsTo("GET /cases/:id/passages")).toHaveLength(1);
  });

  test("any other topic is a 404", async ({ page }) => {
    await new FakeBff({ documents: [doc] }).install(page);
    const response = await page.goto("/app/policies/score");
    expect(response?.status()).toBe(404);
  });
});

test.describe("readiness checklist (S14)", () => {
  test("ticks are kept on the screen only and say so; nothing is sent", async ({ page }) => {
    const bff = new FakeBff();
    await bff.install(page);
    await page.goto("/app/ready");
    await expect(page.getByRole("heading", { level: 1, name: "Get ready for a hospital visit" })).toBeVisible();
    await expect(page.getByText("Claim form from the insurer")).toBeVisible();
    await expect(page.getByTestId("tick-count")).toHaveText("0 of 6 ticked");
    await page.getByLabel("Photo ID").check();
    await expect(page.getByTestId("tick-count")).toHaveText("1 of 6 ticked");
    const writes = bff.calls.filter((call) => call.method !== "GET");
    expect(writes).toEqual([]);
  });
});

test.describe("keep my documents (S04)", () => {
  test("asks once, creates the case and the 'collect' permission, then goes to Documents", async ({ page }) => {
    const bff = new FakeBff();
    await bff.install(page);
    await page.goto("/app/keep");
    await expect(page.getByRole("heading", { level: 1, name: "Keep my documents" })).toBeVisible();
    await expect(page.getByText("Draft wording, pending legal review")).toBeVisible();
    await page.getByRole("button", { name: "Allow and add documents" }).click();
    await expect(page).toHaveURL(/\/app\/documents$/);
    expect(bff.callsTo("POST /consents")).toHaveLength(1);
    expect(bff.callsTo("POST /consents")[0].headers["idempotency-key"]).toBeTruthy();
  });

  test("a new person's 'Add your e-card' goes to S04", async ({ page }) => {
    await new FakeBff().install(page);
    await page.goto("/app");
    await expect(page.getByRole("link", { name: "Add your e-card" })).toHaveAttribute("href", "/app/keep");
  });
});
