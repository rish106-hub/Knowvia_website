// S3: the evidence / unknown / citation view. Every /api/app call is mocked (see fake-cover.ts). Synthetic data only.
import { expect, test, type Page } from "@playwright/test";
import { ANSWER_ID, CASE_ID, DOC_ID, FakeCover, consentedOverview, docSetFor, handoffEverything, noDocsOverview, processingOverview, seedAnswer } from "./fake-cover";
import { answerEnvelope, handoffUnverified, overviewFixture } from "../../unit/app-evidence/fixtures";

async function open(page: Page, fake: FakeCover, path = "/app/cover") {
  await fake.install(page);
  await page.goto(path);
}
const main = (page: Page) => page.locator("#kva-main");

test.describe("empty and consent", () => {
  test("no document: an empty state that links to the documents page", async ({ page }) => {
    const fake = new FakeCover(noDocsOverview());
    await open(page, fake);
    await expect(page.getByRole("heading", { name: "There is nothing to read yet" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to your documents" })).toHaveAttribute("href", "/app/documents");
    expect(fake.count("POST /cases/:id/questions")).toBe(0);
    expect(fake.count("POST /consents")).toBe(0);
  });

  test("a document that is still being prepared is not read", async ({ page }) => {
    const fake = new FakeCover(processingOverview());
    await open(page, fake);
    await expect(page.getByText("Your document is not ready to read yet.")).toBeVisible();
    await expect(page.getByText("Reading your PDF")).toBeVisible();
    expect(fake.count("POST /cases/:id/questions")).toBe(0);
  });

  test("consent missing: draft notice with the review marker, plain statement, then grant and read", async ({ page }) => {
    const fake = new FakeCover();
    await open(page, fake);
    await expect(page.getByRole("heading", { name: "Before we read your document" })).toBeVisible();
    await expect(page.locator("[data-draft-mark]").first()).toHaveText(/Draft wording, pending legal review/);
    await expect(main(page)).toContainText("text from it to Gemini");
    await expect(main(page)).toContainText("the answer made from your document is erased");
    await expect(main(page)).toContainText("Answer questions from these documents");
    expect(fake.count("POST /cases/:id/questions")).toBe(0);
    await page.getByRole("button", { name: "I agree, read my document" }).click();
    await expect(page.getByRole("heading", { name: "What we found" })).toBeVisible();
    expect(fake.last("POST /consents")?.body).toEqual({ scope: "question_gemini", documentIds: [DOC_ID] });
    expect(fake.count("POST /cases/:id/questions")).toBe(1);
  });

  test("the grant button is unavailable until the notice has loaded", async ({ page }) => {
    const fake = new FakeCover();
    fake.failNext("GET /consents/notices", { status: 503, code: "BACKEND_UNREACHABLE" });
    await open(page, fake);
    await expect(page.getByText("We could not load the permission notice")).toBeVisible();
    await expect(page.getByRole("button", { name: "I agree, read my document" })).toHaveAttribute("aria-disabled", "true");
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByText("Answer questions from these documents")).toBeVisible();
    await expect(page.getByRole("button", { name: "I agree, read my document" })).not.toHaveAttribute("aria-disabled", "true");
  });
});

test.describe("reading", () => {
  test("slow answer: an honest waiting state with no percentage, then the result", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.askDelayMs = 1500;
    await open(page, fake);
    const waiting = page.locator("[data-waiting]");
    await expect(waiting).toBeVisible();
    await expect(waiting).toContainText("Reading your document");
    await expect(waiting).not.toContainText("%");
    await expect(page.getByRole("heading", { name: "What we found" })).toBeVisible();
    await expect(waiting).toHaveCount(0);
  });

  test("the question uses a stable Idempotency-Key, and a reload replays the same key", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    await open(page, fake);
    await expect(page.getByRole("heading", { name: "What we found" })).toBeVisible();
    const first = fake.last("POST /cases/:id/questions")!;
    expect(first.headers["idempotency-key"]).toMatch(/^kv-q-[0-9a-f]{48}$/);
    expect((first.body as { documentIds: string[] }).documentIds).toEqual([DOC_ID]);
    // Reload with the stored answer id: no new question, the stored answer is fetched instead.
    await page.reload();
    await expect(page.getByRole("heading", { name: "What we found" })).toBeVisible();
    expect(fake.count("POST /cases/:id/questions")).toBe(1);
    expect(fake.count("GET /cases/:id/answers/:aid")).toBe(1);
    // Without sessionStorage the same question is asked again with the SAME key (the backend replays it at no cost).
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await expect(page.getByRole("heading", { name: "What we found" })).toBeVisible();
    expect(fake.count("POST /cases/:id/questions")).toBe(2);
    expect(fake.last("POST /cases/:id/questions")!.headers["idempotency-key"]).toBe(first.headers["idempotency-key"]);
  });

  test("model failure: a plain message with retry, never the backend text", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.failNext("POST /cases/:id/questions", { status: 502, code: "BACKEND_BAD_RESPONSE" });
    await open(page, fake);
    await expect(page.getByText("Reading took too long or failed")).toBeVisible();
    await expect(main(page)).not.toContainText("backend text must never be shown");
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("heading", { name: "What we found" })).toBeVisible();
    expect(fake.count("POST /cases/:id/questions")).toBe(2);
    const keys = fake.calls.filter((c) => c.path === "/cases/:id/questions").map((c) => c.headers["idempotency-key"]);
    expect(new Set(keys).size).toBe(1);
  });

  test("network failure while reading, then retry", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.failNext("POST /cases/:id/questions", "abort");
    await open(page, fake);
    await expect(page.getByText("We could not reach Knowvia")).toBeVisible();
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("heading", { name: "What we found" })).toBeVisible();
  });

  test("signed out while reading: a sign-in link", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.failNext("POST /cases/:id/questions", { status: 401, code: "SESSION_EXPIRED" });
    await open(page, fake);
    await expect(page.getByText("You are signed out")).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/app/sign-in");
  });
});

test.describe("evidence states", () => {
  test("known, unverified, conflicting, not confirmed and not checked differ by label, and an unverified fact is never 'Known'", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.handoff = handoffEverything();
    await open(page, fake);
    await expect(page.getByRole("heading", { name: "What we found" })).toBeVisible();
    const known = main(page).locator('[data-fact-state="known"]');
    await expect(known.filter({ hasText: "Sum insured ₹5,00,000" })).toBeVisible();
    await expect(known.filter({ hasText: "not cash" })).toHaveCount(1);
    await expect(main(page).locator('[data-fact-state="conflicting"]').first()).toContainText("Documents disagree");
    await expect(main(page).locator('[data-fact-state="not_confirmed"]').first()).toContainText("Not confirmed");
    await expect(main(page).locator('[data-fact-state="not_confirmed"]').first()).toContainText("does not mean it is excluded");
    await expect(main(page).locator('[data-fact-state="not_checked"]').first()).toContainText("Confirm it with your insurer or hospital");
    const fromDoc = main(page).locator('[data-fact-state="from_document"]');
    await expect(fromDoc.first()).toContainText("From the document, not yet confirmed");
    for (const card of await fromDoc.all()) await expect(card.locator('[data-state="known"]')).toHaveCount(0);
    // Different icons: every state badge has an svg and visible words.
    for (const badge of await main(page).locator("[data-state]").all()) {
      await expect(badge.locator("svg")).toHaveCount(1);
      expect((await badge.innerText()).trim().length).toBeGreaterThan(3);
    }
    await expect(main(page)).not.toContainText(/line \d/i);
  });

  test("the realistic case today: nothing is known, extractions are labelled, quotes and pages are shown", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    await open(page, fake);
    await expect(page.getByRole("heading", { name: "What we found" })).toBeVisible();
    await expect(main(page).locator("[data-summary]")).toContainText("None is confirmed yet.");
    await expect(main(page).locator('[data-state="known"]')).toHaveCount(0);
    const room = main(page).locator("[data-fact-state]").filter({ hasText: "The document describes a limit" }).filter({ hasText: "1% of the sum insured" });
    await expect(room).toContainText("Policy wording, Page 4");
    await expect(main(page)).toContainText("We have not confirmed which policy your document belongs to.");
    await expect(main(page)).toContainText("No clause labelled endorsement");
    await expect(main(page)).toContainText("not a claim decision");
    await expect(main(page)).toContainText("Some personal details in this text are hidden for privacy.");
  });

  test("the review status cannot be read: everything stays unconfirmed and says so", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.handoff = { handoffVersion: "decision-handoff/v9", policies: [] };
    await open(page, fake);
    await expect(main(page)).toContainText("none of them is shown as confirmed");
    await expect(main(page).locator('[data-fact-state]:not([data-fact-state="from_document"])')).toHaveCount(0);
    await expect(main(page).getByRole("button", { name: "Confirm this from the document" })).toHaveCount(0);
  });

  test("the review status fails to load: a retry, with items shown as unconfirmed meanwhile", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.failNext("GET /cases/:id/decision-catalogue", { status: 503, code: "BACKEND_UNREACHABLE" });
    await open(page, fake);
    await expect(page.getByText("We could not check what has been confirmed")).toBeVisible();
    await expect(main(page).locator('[data-fact-state="known"]')).toHaveCount(0);
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByText("We could not check what has been confirmed")).toHaveCount(0);
    await expect(main(page).getByRole("button", { name: "Confirm this from the document" }).first()).toBeVisible();
  });

  test("an insufficient-evidence answer says it is not an exclusion", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.answer = answerEnvelope({ state: "insufficient_evidence", covered: [], limited_or_excluded: [], sources: [] });
    fake.handoff = handoffUnverified({ openEndedFindings: [] });
    await open(page, fake);
    await expect(main(page)).toContainText("We could not find text in your document that answers this.");
    await expect(main(page)).toContainText("should be read as an exclusion");
  });
});

test.describe("citation sheet", () => {
  test("opens with the quote and page, traps and restores focus, closes with Escape, never links to a file", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    await open(page, fake);
    const trigger = main(page).getByRole("button", { name: /Policy wording, Page 4/ }).first();
    await trigger.focus();
    await trigger.press("Enter");
    const dialog = page.getByRole("dialog", { name: "From your document" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Policy wording, Page 4");
    await expect(dialog).toContainText("Room rent is limited to 1% of the sum insured per day");
    await expect(dialog).toContainText("Reference: cl-room");
    await expect(dialog).toContainText("We cannot open the original file here");
    expect(await dialog.locator("a").count()).toBe(0);
    // focus is inside the dialog and stays there when tabbing
    for (let i = 0; i < 4; i += 1) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest("dialog"))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe("self-confirmation", () => {
  test("designates the owner once, records the review with its own Idempotency-Key, then shows 'Confirmed by you'", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    await open(page, fake);
    const card = main(page).locator("[data-fact-state]").filter({ hasText: "The document describes a limit" }).filter({ hasText: "Page 4" }).first();
    await card.getByRole("button", { name: "Confirm this from the document" }).click();
    await expect(card).toContainText("It does not make this verified by Knowvia or your insurer");
    await card.getByRole("button", { name: "Yes, the text says this" }).click();
    await expect(main(page)).toContainText("Saved. That item now shows as confirmed by you.");
    const confirmed = main(page).locator('[data-fact-state="confirmed_by_you"]');
    await expect(confirmed).toHaveCount(1);
    await expect(confirmed).toContainText("Confirmed by you");
    await expect(confirmed).toContainText("It is not verified by Knowvia or your insurer");
    await expect(confirmed.locator('[data-state="known"]')).toHaveCount(0);
    expect(fake.last("POST /catalogue-confirmers")?.body).toEqual({ adultUserId: "adult-synth-owner" });
    const review = fake.last("POST /cases/:id/catalogue-reviews")!;
    expect(review.body).toEqual({ answerId: ANSWER_ID, factId: "fact-room", decision: "accepted", reasonCode: "matches_clause" });
    expect(review.headers["idempotency-key"]).toMatch(/^kv-r-[0-9a-f]{48}$/);
    // A second confirmation does not designate again.
    const other = main(page).locator("[data-fact-state='from_document']").filter({ hasText: "Cosmetic procedures" }).first();
    await other.getByRole("button", { name: "Confirm this from the document" }).click();
    await other.getByRole("button", { name: "Yes, the text says this" }).click();
    await expect(main(page).locator('[data-fact-state="confirmed_by_you"]')).toHaveCount(2);
    expect(fake.count("POST /catalogue-confirmers")).toBe(1);
  });

  test("'No, this is not right' removes the item from the list", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    await open(page, fake);
    const card = main(page).locator("[data-fact-state]").filter({ hasText: "Cosmetic procedures" }).first();
    await card.getByRole("button", { name: "Confirm this from the document" }).click();
    await card.getByRole("button", { name: "No, this is not right" }).click();
    await expect(main(page)).toContainText("You marked that item as not matching");
    await expect(main(page).locator("[data-fact-state]").filter({ hasText: "Cosmetic procedures" })).toHaveCount(0);
    expect(fake.last("POST /cases/:id/catalogue-reviews")?.body).toMatchObject({ decision: "rejected", reasonCode: "does_not_match_clause" });
  });

  test("not allowed to confirm: a plain message, nothing is shown as confirmed", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.failNext("POST /cases/:id/catalogue-reviews", { status: 404, code: "NOT_FOUND", retryable: false });
    await open(page, fake);
    const card = main(page).locator("[data-fact-state]").filter({ hasText: "The document describes a limit" }).filter({ hasText: "Page 4" }).first();
    await card.getByRole("button", { name: "Confirm this from the document" }).click();
    await card.getByRole("button", { name: "Yes, the text says this" }).click();
    await expect(card.getByRole("alert")).toContainText("You cannot confirm this here");
    await expect(main(page).locator('[data-fact-state="confirmed_by_you"]')).toHaveCount(0);
  });
});

test.describe("revoked and stale", () => {
  test("consent revoked: the stored answer is gone, nothing is shown from it, and consent is asked again", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    await seedAnswer(page, docSetFor(CASE_ID, [DOC_ID]));
    fake.failNext("GET /cases/:id/answers/:aid", { status: 403, code: "CONSENT_REQUIRED", retryable: false });
    await open(page, fake);
    await expect(page.getByText("Your earlier answer is gone")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Before we read your document" })).toBeVisible();
    await expect(main(page)).not.toContainText("Room rent");
    expect(await page.evaluate((c) => sessionStorage.getItem(`kv.cover.answer.${c}`), CASE_ID)).toBeNull();
    expect(fake.count("POST /cases/:id/questions")).toBe(0);
  });

  test("the decision catalogue says the answer is gone: a recovery that reads the document again", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.failNext("GET /cases/:id/decision-catalogue", { status: 404, code: "POLICY_EVIDENCE_NOT_FOUND", retryable: false });
    await open(page, fake);
    await expect(page.getByText("This answer is no longer stored")).toBeVisible();
    await expect(main(page)).not.toContainText("Room rent");
    await page.getByRole("button", { name: "Read my document again" }).click();
    await expect(page.getByRole("heading", { name: "What we found" })).toBeVisible();
  });

  test("a document changed since: read again uses a new key", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.failNext("POST /cases/:id/questions", { status: 409, code: "POLICY_EVIDENCE_ANSWER_STALE", retryable: false });
    await open(page, fake);
    await expect(page.getByText("A document has changed")).toBeVisible();
    await page.getByRole("button", { name: "Read my document again" }).click();
    await expect(page.getByRole("heading", { name: "What we found" })).toBeVisible();
    const keys = fake.calls.filter((c) => c.path === "/cases/:id/questions").map((c) => c.headers["idempotency-key"]);
    expect(keys).toHaveLength(2);
    expect(keys[0]).not.toBe(keys[1]);
  });
});

test("320px: no horizontal scroll on the evidence view, and touch targets are at least 44px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const fake = new FakeCover(consentedOverview());
  fake.handoff = handoffEverything();
  await open(page, fake);
  await expect(page.getByRole("heading", { name: "What we found" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  for (const b of await main(page).getByRole("button").all()) {
    const box = await b.boundingBox();
    expect(box && box.height >= 43.5).toBe(true);
  }
  const levels = await page.evaluate(() => [...document.querySelectorAll("h1,h2,h3,h4")].map((h) => Number(h.tagName[1])));
  expect(levels[0]).toBe(1);
  levels.forEach((l, i) => {
    if (i > 0) expect(l - levels[i - 1]).toBeLessThanOrEqual(1);
  });
});

void overviewFixture;
