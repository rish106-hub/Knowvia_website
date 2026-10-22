// S4: household coverage preview with adaptive questions. Every /api/app call is mocked. Synthetic data only.
import { expect, test, type Page } from "@playwright/test";
import { ANSWER_ID, CASE_ID, DOC_ID, FakeCover, consentedOverview, docSetFor, seedAnswer } from "./fake-cover";
import { previewBase, previewConditional, previewConflicting, previewStale, qDate, qMember, qSchedule } from "../../unit/app-evidence/fixtures";

async function open(page: Page, fake: FakeCover) {
  await seedAnswer(page, docSetFor(CASE_ID, [DOC_ID]));
  await fake.install(page);
  await page.goto("/app/cover/preview");
}
const main = (page: Page) => page.locator("#kva-main");
const previewBodies = (fake: FakeCover) => fake.calls.filter((c) => c.path === "/coverage-preview").map((c) => c.body as { contractVersion: string; sources: unknown[]; scenario: { scenarioType: string; answers: Record<string, string> } });

test("without a stored answer there is nothing to preview: a pointer back to the cover screen", async ({ page }) => {
  const fake = new FakeCover(consentedOverview());
  await fake.install(page);
  await page.goto("/app/cover/preview");
  await expect(page.getByRole("heading", { name: "Read your document first" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to your cover" })).toHaveAttribute("href", "/app/cover");
  expect(fake.count("POST /coverage-preview")).toBe(0);
});

test.describe("insufficient evidence", () => {
  test("states what is not settled, shows ONE next action and at most two questions", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.previewFor = () => previewBase({ nextQuestions: [qMember, qDate, qSchedule] });
    await open(page, fake);
    await expect(page.getByText("Your documents do not settle this yet")).toBeVisible();
    await expect(main(page)).toContainText("not the same as being excluded");
    await expect(main(page).locator("[data-next-action]")).toHaveCount(1);
    await expect(main(page).locator("[data-next-action]")).toContainText("Answer a short question");
    await expect(main(page).locator("[data-next-action]")).toContainText("Not done yet");
    // 3 returned, 2 shown
    await expect(main(page).locator("[data-question]")).toHaveCount(2);
    await expect(main(page).locator('[data-question="Q_POLICY_SCHEDULE"]')).toHaveCount(0);
    for (const q of await main(page).locator("[data-question]").all()) {
      await expect(q.getByRole("button", { name: "Skip" })).toBeVisible();
      await expect(q.getByRole("button", { name: "I do not know" })).toBeVisible();
    }
    await expect(main(page).locator("[data-budget]")).toContainText("0 of up to 5 questions used");
    // contract version and closed fields only
    const [first] = previewBodies(fake);
    expect(first).toEqual({ contractVersion: "household-scenario/v1", sources: [{ caseId: CASE_ID, answerId: ANSWER_ID }], scenario: { scenarioType: "general_benefit", answers: {} } });
    // nothing established
    await expect(main(page).locator('[data-fact-state="known"]')).toHaveCount(0);
    await expect(main(page).locator('[data-fact-state="from_document"]').first()).toContainText("Room rent limit");
    await expect(main(page).locator('[data-fact-state="not_confirmed"]').first()).toContainText("Not confirmed");
  });

  test("dynamic checks are 'Not checked', never complete, even if the server calls them performed", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.previewFor = () => {
      const p = previewBase() as ReturnType<typeof previewBase>;
      (p.externalChecks[0] as Record<string, unknown>).status = "completed";
      return p;
    };
    await open(page, fake);
    const notChecked = main(page).locator('[data-fact-state="not_checked"]');
    await expect(notChecked.first()).toContainText("Not checked");
    await expect(notChecked.first()).toContainText("Confirm with your insurer or hospital");
    await expect(main(page)).toContainText("Not checked. Needs current confirmation");
    await expect(main(page)).not.toContainText(/hospital network.*(confirmed|completed|available)/i);
  });
});

test.describe("adaptive questions", () => {
  test("answers accumulate in client state and are re-sent every time; skip and 'I do not know' use the wire sentinels", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.previewFor = ({ scenario }) => {
      const a = scenario.answers;
      const qs = [qMember, qDate, qSchedule].filter((q) => !(q.questionKey in a));
      return previewBase({ nextQuestions: qs.slice(0, 2), completeness: { questionBudget: { perTurnLimit: 2, journeyLimit: 5, usedInJourney: Object.keys(a).length, remainingInJourney: 5 - Object.keys(a).length, exhausted: false }, openBlockingGaps: 1 } });
    };
    await open(page, fake);
    await expect(main(page).locator("[data-question]")).toHaveCount(2);
    // 1. pick a person
    await main(page).locator('[data-question="Q_MEMBER"] select').selectOption({ label: "Asha (example)" });
    await main(page).locator('[data-question="Q_MEMBER"]').getByRole("button", { name: "Save answer" }).click();
    await expect(main(page).locator('[data-question="Q_MEMBER"]')).toHaveCount(0);
    // 2. skip the date
    await main(page).locator('[data-question="Q_EXACT_DATE"]').getByRole("button", { name: "Skip" }).click();
    await expect(main(page).locator('[data-question="Q_EXACT_DATE"]')).toHaveCount(0);
    // 3. I do not know for the schedule
    await main(page).locator('[data-question="Q_POLICY_SCHEDULE"]').getByRole("button", { name: "I do not know" }).click();
    await expect(main(page).locator("[data-question]")).toHaveCount(0);
    await expect(main(page).locator("[data-no-questions]")).toBeVisible();
    const bodies = previewBodies(fake);
    expect(bodies.at(-2)!.scenario.answers).toEqual({ member_id: "mem-synth-owner", exact_date: "SKIPPED" });
    expect(bodies.at(-1)!.scenario.answers).toEqual({ member_id: "mem-synth-owner", exact_date: "SKIPPED", policy_schedule_available: "I_DO_NOT_KNOW" });
    for (const b of bodies) expect(Object.keys(b.scenario).sort()).toEqual(["answers", "scenarioType"]);
    // the scenario survives a reload (sessionStorage) and is re-sent in full
    await page.reload();
    await expect(main(page).locator("[data-no-questions]")).toBeVisible();
    expect(previewBodies(fake).at(-1)!.scenario.answers).toEqual({ member_id: "mem-synth-owner", exact_date: "SKIPPED", policy_schedule_available: "I_DO_NOT_KNOW" });
  });

  test("invalid input is explained and never sent", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.previewFor = () => previewBase({ nextQuestions: [qDate] });
    await open(page, fake);
    const q = main(page).locator('[data-question="Q_EXACT_DATE"]');
    await q.getByRole("button", { name: "Save answer" }).click();
    await expect(q.getByRole("alert")).toContainText("Type an answer");
    expect(previewBodies(fake)).toHaveLength(1);
    await q.getByLabel(/exact planned date/).fill("2026-12-01");
    await q.getByRole("button", { name: "Save answer" }).click();
    await expect.poll(() => previewBodies(fake).length).toBe(2);
    expect(previewBodies(fake)[1].scenario.answers).toEqual({ exact_date: "2026-12-01" });
  });

  test("the journey budget ends the questions", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.previewFor = () => previewBase({ nextQuestions: [qSchedule], completeness: { questionBudget: { perTurnLimit: 2, journeyLimit: 5, usedInJourney: 5, remainingInJourney: 0, exhausted: true }, openBlockingGaps: 2 } });
    await open(page, fake);
    await expect(main(page).locator("[data-question]")).toHaveCount(0);
    await expect(main(page).locator("[data-no-questions]")).toContainText("That is all we will ask");
  });

  test("changing what you are checking re-asks with the new scenario and keeps the answers", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.previewFor = () => previewBase({ nextQuestions: [qDate] });
    await open(page, fake);
    await main(page).locator('[data-question="Q_EXACT_DATE"]').getByRole("button", { name: "Skip" }).click();
    await page.getByLabel("What are you checking?").selectOption("planned_procedure");
    await expect.poll(() => previewBodies(fake).at(-1)?.scenario.scenarioType).toBe("planned_procedure");
    expect(previewBodies(fake).at(-1)!.scenario.answers).toEqual({ exact_date: "SKIPPED" });
  });
});

test.describe("states", () => {
  test("conditional: documented terms with citations, the person, and the limit-is-not-cash note", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.previewFor = () => previewConditional();
    await open(page, fake);
    await expect(page.getByText("Some of it is documented, some is still open")).toBeVisible();
    await expect(page.getByRole("heading", { name: "For Asha (example)" })).toBeVisible();
    const sum = main(page).locator('[data-fact-state="known"]').filter({ hasText: "Sum insured ₹5,00,000" });
    await expect(sum).toContainText("not cash");
    await expect(sum).toContainText("Policy wording, Page 4");
    await expect(main(page).locator('[data-fact-state="known"]').filter({ hasText: "Waiting period 36 months" })).toContainText("Documented limit or condition in this policy");
    await expect(main(page).locator('[data-fact-state="known"]').filter({ hasText: "listed as insured" })).toBeVisible();
    await expect(main(page)).not.toContainText(/will be (approved|paid)|you will receive/i);
    // the citation sheet works from the preview, with the quote from the stored answer
    await sum.getByRole("button", { name: /Policy wording, Page 4/ }).click();
    await expect(page.getByRole("dialog")).toContainText("Room rent is limited to 1%");
    await page.keyboard.press("Escape");
  });

  test("conflicting evidence is shown as a conflict and asks for a review, not a choice", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.previewFor = () => previewConflicting();
    await open(page, fake);
    await expect(page.getByText("Your documents disagree on something that matters")).toBeVisible();
    await expect(main(page).locator('[data-fact-state="conflicting"]').first()).toContainText("Documents disagree");
    await expect(main(page).locator("[data-next-action]")).toContainText("No reviewer is assigned yet");
  });

  test("a stale source: recovery path, no questions and no next action", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.previewFor = () => previewStale();
    await open(page, fake);
    await expect(page.getByText("This needs your document read again")).toBeVisible();
    await expect(page.getByRole("link", { name: "Read my document again" })).toHaveAttribute("href", "/app/cover");
    await expect(main(page).locator("[data-question]")).toHaveCount(0);
    await expect(main(page).locator("[data-next-action]")).toHaveCount(0);
    await expect(main(page)).toContainText("No policy could be built from your documents yet.");
  });

  test("no family member chosen: says so instead of guessing", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    await open(page, fake);
    await expect(page.getByRole("heading", { name: "No family member chosen yet" })).toBeVisible();
    await expect(main(page)).toContainText("nothing here is tied to a person");
    await expect(main(page).locator('[data-fact-state="not_confirmed"]').filter({ hasText: "Which family member this is about" })).toBeVisible();
  });
});

test.describe("failures", () => {
  test("network failure on the preview: a retry that works", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.failNext("POST /coverage-preview", "abort");
    await open(page, fake);
    await expect(page.getByText("We could not reach Knowvia")).toBeVisible();
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByText("Your documents do not settle this yet")).toBeVisible();
  });

  test("contradictory answers: a plain explanation and a way to undo the last one", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.previewFor = () => previewBase({ nextQuestions: [qDate] });
    await open(page, fake);
    await expect(main(page).locator('[data-question="Q_EXACT_DATE"]')).toBeVisible();
    fake.failNext("POST /coverage-preview", { status: 400, code: "HOUSEHOLD_SCENARIO_CONTRADICTORY", retryable: false });
    await main(page).locator('[data-question="Q_EXACT_DATE"]').getByRole("button", { name: "Skip" }).click();
    await expect(page.getByText("Two of your answers do not fit together")).toBeVisible();
    await page.getByRole("button", { name: "Remove my last answer" }).click();
    await expect.poll(() => previewBodies(fake).at(-1)?.scenario.answers).toEqual({});
    await expect(page.getByText("Two of your answers do not fit together")).toHaveCount(0);
  });

  test("consent revoked while previewing: the answer is gone and the recovery path reads again", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.failNext("POST /coverage-preview", { status: 404, code: "POLICY_EVIDENCE_NOT_FOUND", retryable: false });
    await open(page, fake);
    await expect(page.getByText("This answer is no longer stored")).toBeVisible();
    await expect(page.getByRole("link", { name: "Read my document again" })).toHaveAttribute("href", "/app/cover");
    await expect(main(page)).not.toContainText("Your documents do not settle");
    expect(await page.evaluate((c) => sessionStorage.getItem(`kv.cover.answer.${c}`), CASE_ID)).toBeNull();
  });

  test("signed out: a sign-in link", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.failNext("POST /coverage-preview", { status: 401, code: "SESSION_EXPIRED" });
    await open(page, fake);
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  test("an unreadable preview payload is refused, nothing is guessed", async ({ page }) => {
    const fake = new FakeCover(consentedOverview());
    fake.previewFor = () => ({ contractVersion: "household-coverage-preview/v2", assessmentState: "covered" });
    await open(page, fake);
    await expect(page.getByText("Something went wrong")).toBeVisible();
    await expect(main(page).locator("[data-fact-state]")).toHaveCount(0);
  });
});

test("320px: no horizontal scroll with questions open; controls are at least 44px; focus moves to the questions after an answer", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const fake = new FakeCover(consentedOverview());
  fake.previewFor = ({ scenario }) => previewBase({ nextQuestions: [qMember, qDate].filter((q) => !(q.questionKey in scenario.answers)) });
  await open(page, fake);
  await expect(main(page).locator("[data-question]")).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  for (const el of await main(page).locator("[data-question] button, [data-question] input, [data-question] select").all()) {
    const box = await el.boundingBox();
    expect(box && box.height >= 43.5).toBe(true);
  }
  await main(page).locator('[data-question="Q_EXACT_DATE"]').getByRole("button", { name: "Skip" }).click();
  await expect(main(page).locator('[data-question="Q_EXACT_DATE"]')).toHaveCount(0);
  await expect(page.locator("#kve-q-h")).toBeFocused();
  const levels = await page.evaluate(() => [...document.querySelectorAll("h1,h2,h3,h4")].map((h) => Number(h.tagName[1])));
  expect(levels[0]).toBe(1);
  levels.forEach((l, i) => {
    if (i > 0) expect(l - levels[i - 1]).toBeLessThanOrEqual(1);
  });
});
