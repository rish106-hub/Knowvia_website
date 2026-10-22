import { expect, test, type Page } from "@playwright/test";
import { FakeBff, PDF, PDF_FILE, alerts, docAt } from "./fake-bff";

const FILE_TOO_LARGE = "This file is over 15 MB. Try a smaller PDF.";
const PDF_ONLY = "Only PDF files can be added. Choose a PDF.";

async function open(page: Page, bff: FakeBff) {
  await bff.install(page);
  await page.goto("/app/documents");
  await expect(page.getByRole("heading", { level: 1, name: "Documents" })).toBeVisible();
}
const kind = (page: Page, name: string) => page.getByRole("radio", { name: new RegExp(`^${name}`) });
const choose = (page: Page, file: Parameters<ReturnType<Page["locator"]>["setInputFiles"]>[0]) => page.locator("#kva-file").setInputFiles(file);

test.describe("empty and consent", () => {
  test("empty: no documents, a PDF-only dropzone and a labelled file input", async ({ page }) => {
    const bff = new FakeBff({ documents: [] });
    await open(page, bff);
    await expect(page.getByTestId("empty-documents")).toContainText("No documents yet");
    await expect(page.getByText("PDF, up to 15 MB each")).toBeVisible();
    await expect(page.getByLabel("Choose a file")).toBeAttached();
    await expect(page.locator("#kva-file")).toHaveAttribute("accept", ".pdf,application/pdf");
    // No promise of email, sharing or invites anywhere on the screen.
    await expect(page.getByText(/email you|notify|invite|encrypted|JPG|PNG/i)).toHaveCount(0);
  });

  test("the collect notice comes from the BFF, is marked draft, and there is no bundled terms checkbox", async ({ page }) => {
    const bff = new FakeBff({ documents: [] });
    await open(page, bff);
    const notice = page.locator('[data-consent-scope="collect"]');
    await expect(notice.getByRole("heading", { name: "Store your PDF" })).toBeVisible();
    await expect(notice).toContainText("Draft: Knowvia keeps the PDF you add");
    await expect(notice.getByText("Draft wording, pending legal review")).toBeVisible();
    await expect(page.getByRole("checkbox")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Allow and add this PDF" })).toBeVisible();
    // Consent is never granted just by looking at the page.
    expect(bff.callsTo("POST /consents")).toHaveLength(0);
    expect(bff.callsTo("POST /cases")).toHaveLength(0);
  });

  test("when the wording cannot load, consent cannot be given", async ({ page }) => {
    const bff = new FakeBff({ documents: [] });
    // Dev runs effects twice (React StrictMode), so the page asks twice.
    bff.failNext("GET /consents/notices", { status: 503, code: "BACKEND_UNREACHABLE", retryable: true }, 2);
    await open(page, bff);
    await expect(page.getByText("Could not load the permission wording")).toBeVisible();
    await expect(page.getByRole("button", { name: "Allow and add this PDF" })).toBeDisabled();
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.locator('[data-consent-scope="collect"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Allow and add this PDF" })).toBeEnabled();
  });
});

test.describe("upload", () => {
  test("success path: case, collect consent, then the PDF with the contract headers", async ({ page }) => {
    const bff = new FakeBff({ documents: [] });
    await open(page, bff);
    await kind(page, "Policy schedule").check();
    await choose(page, PDF_FILE("Family floater schedule.pdf"));
    await expect(page.getByTestId("chosen-file")).toContainText("Family floater schedule.pdf");
    await page.getByRole("button", { name: "Allow and add this PDF" }).click();

    await expect(page.getByText("PDF added")).toBeVisible();
    const list = page.locator(".kva-docs");
    await expect(list.locator("li")).toHaveCount(1);
    await expect(list.locator("li").first()).toContainText("Policy schedule");
    await expect(list.locator("li").first()).toContainText("Family floater schedule.pdf");
    await expect(list.locator("li").first().locator(".kva-badge")).toContainText("Received");

    const keys = bff.calledKeys();
    expect(keys.indexOf("POST /cases")).toBeGreaterThan(-1);
    expect(keys.indexOf("POST /cases")).toBeLessThan(keys.indexOf("POST /consents"));
    expect(keys.indexOf("POST /consents")).toBeLessThan(keys.indexOf("POST /cases/:id/documents"));
    expect(JSON.parse(bff.callsTo("POST /consents")[0].body!.toString())).toEqual({ scope: "collect" });

    const upload = bff.callsTo("POST /cases/:id/documents")[0];
    expect(upload.path).toBe("/cases/case-1/documents");
    expect(upload.headers["content-type"]).toBe("application/pdf");
    expect(upload.headers["x-document-kind"]).toBe("policy_schedule");
    expect(upload.headers["x-consent-grant-id"]).toMatch(/^grant-collect-/);
    expect(upload.headers["x-filename"]).toBe(encodeURIComponent("Family floater schedule.pdf"));
    expect(upload.headers["idempotency-key"]).toMatch(/^kv-/);
    expect(upload.headers["x-knowvia-app"]).toBe("1");
    expect(upload.body!.subarray(0, 5).toString()).toBe("%PDF-");
  });

  test("a second upload reuses the stored permission: no new case, no new consent", async ({ page }) => {
    const bff = new FakeBff({
      documents: [docAt("readable")],
      consents: [{ scope: "collect", grantId: "grant-collect-0", documentIds: [], grantedAt: "2026-10-20T10:00:00.000Z", noticeStatus: "draft_needs_legal_review" }],
    });
    await open(page, bff);
    await expect(page.getByText("You have allowed Knowvia to store the PDFs you add.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add this PDF" })).toBeVisible();
    await kind(page, "Policy wording").check();
    await choose(page, PDF_FILE("wording.pdf"));
    await page.getByRole("button", { name: "Add this PDF" }).click();
    await expect(page.locator(".kva-docs li")).toHaveCount(2);
    expect(bff.callsTo("POST /cases")).toHaveLength(0);
    expect(bff.callsTo("POST /consents")).toHaveLength(0);
    expect(bff.callsTo("POST /cases/:id/documents")[0].headers["x-consent-grant-id"]).toBe("grant-collect-0");
  });

  test("retry after a retryable failure reuses the SAME Idempotency-Key", async ({ page }) => {
    const bff = new FakeBff({ documents: [] });
    bff.failNext("POST /cases/:id/documents", { status: 503, code: "BACKEND_UNREACHABLE", retryable: true });
    await open(page, bff);
    await kind(page, "Policy schedule").check();
    await choose(page, PDF_FILE());
    await page.getByRole("button", { name: "Allow and add this PDF" }).click();
    await expect(alerts(page)).toContainText("Knowvia could not be reached");
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByText("PDF added")).toBeVisible();
    const uploads = bff.callsTo("POST /cases/:id/documents");
    expect(uploads).toHaveLength(2);
    expect(uploads[0].headers["idempotency-key"]).toBeTruthy();
    expect(uploads[1].headers["idempotency-key"]).toBe(uploads[0].headers["idempotency-key"]);
    // The retry did not repeat setup that already succeeded as new work: consent was reused by the fake.
    expect(bff.callsTo("POST /cases")).toHaveLength(1);
  });

  test("choosing a different file gets a different Idempotency-Key", async ({ page }) => {
    const bff = new FakeBff({ documents: [] });
    bff.failNext("POST /cases/:id/documents", { status: 503, code: "BACKEND_UNREACHABLE", retryable: true });
    await open(page, bff);
    await kind(page, "Policy schedule").check();
    await choose(page, PDF_FILE("one.pdf"));
    await page.getByRole("button", { name: "Allow and add this PDF" }).click();
    await expect(alerts(page)).toContainText("could not be reached");
    await choose(page, PDF_FILE("two.pdf", 4096));
    await page.getByRole("button", { name: "Add this PDF" }).click();
    await expect(page.getByText("PDF added")).toBeVisible();
    const [first, second] = bff.callsTo("POST /cases/:id/documents");
    expect(second.headers["idempotency-key"]).not.toBe(first.headers["idempotency-key"]);
  });

  test("a JPG is stopped before upload with the PDF-only wording", async ({ page }) => {
    const bff = new FakeBff({ documents: [] });
    await open(page, bff);
    await choose(page, { name: "photo of policy.jpg", mimeType: "image/jpeg", buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]) });
    await expect(alerts(page)).toContainText(PDF_ONLY);
    await expect(alerts(page)).toContainText("photo of policy.jpg");
    await expect(page.getByTestId("chosen-file")).toHaveCount(0);
    expect(bff.callsTo("POST /cases/:id/documents")).toHaveLength(0);
  });

  test("a file named .pdf that is not a PDF is stopped before upload", async ({ page }) => {
    const bff = new FakeBff({ documents: [] });
    await open(page, bff);
    await choose(page, { name: "renamed.pdf", mimeType: "application/pdf", buffer: Buffer.from("GIF89a not a pdf") });
    await expect(alerts(page)).toContainText(PDF_ONLY);
  });

  test("an oversize PDF is stopped before upload with the over-15-MB wording", async ({ page }) => {
    const bff = new FakeBff({ documents: [] });
    await open(page, bff);
    await choose(page, { name: "Papa renewal scan.pdf", mimeType: "application/pdf", buffer: PDF(15 * 1024 * 1024 + 16) });
    await expect(alerts(page)).toContainText(FILE_TOO_LARGE);
    await expect(alerts(page)).toContainText("Papa renewal scan.pdf");
    expect(bff.callsTo("POST /cases/:id/documents")).toHaveLength(0);
  });

  test("the BFF's own PDF_ONLY and FILE_TOO_LARGE answers read the same as the pre-check", async ({ page }) => {
    const bff = new FakeBff({ documents: [] });
    bff.failNext("POST /cases/:id/documents", { status: 415, code: "PDF_ONLY" });
    bff.failNext("POST /cases/:id/documents", { status: 413, code: "FILE_TOO_LARGE" });
    await open(page, bff);
    await kind(page, "Policy schedule").check();
    await choose(page, PDF_FILE());
    await page.getByRole("button", { name: "Allow and add this PDF" }).click();
    await expect(alerts(page)).toContainText(PDF_ONLY);
    await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
    await choose(page, PDF_FILE("again.pdf"));
    await page.getByRole("button", { name: "Add this PDF" }).click();
    await expect(alerts(page)).toContainText(FILE_TOO_LARGE);
  });

  test("not choosing a kind or a file explains what is missing and sends nothing", async ({ page }) => {
    const bff = new FakeBff({ documents: [] });
    await open(page, bff);
    await page.getByRole("button", { name: "Allow and add this PDF" }).click();
    await expect(alerts(page)).toContainText("Choose what kind of document this is.");
    await kind(page, "Endorsement").check();
    await page.getByRole("button", { name: "Allow and add this PDF" }).click();
    await expect(alerts(page)).toContainText("Choose a PDF to add.");
    expect(bff.callsTo("POST /consents")).toHaveLength(0);
  });

  test("offline: a dropped connection becomes a retry, and the retry works", async ({ page }) => {
    const bff = new FakeBff({ documents: [] });
    bff.failNext("POST /cases/:id/documents", "abort");
    await open(page, bff);
    await kind(page, "Policy schedule").check();
    await choose(page, PDF_FILE());
    await page.getByRole("button", { name: "Allow and add this PDF" }).click();
    await expect(alerts(page)).toContainText("You look offline");
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByText("PDF added")).toBeVisible();
    const uploads = bff.callsTo("POST /cases/:id/documents");
    expect(uploads[1].headers["idempotency-key"]).toBe(uploads[0].headers["idempotency-key"]);
  });

  test("storage not configured is explained, with no retry that cannot help", async ({ page }) => {
    const bff = new FakeBff({ documents: [] });
    bff.failNext("POST /cases/:id/documents", { status: 503, code: "DOCUMENT_STORAGE_NOT_CONFIGURED" });
    await open(page, bff);
    await kind(page, "Policy schedule").check();
    await choose(page, PDF_FILE());
    await page.getByRole("button", { name: "Allow and add this PDF" }).click();
    await expect(alerts(page)).toContainText("Adding PDFs is not available yet");
    await expect(alerts(page)).toContainText("Nothing was uploaded");
    await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
  });

  test("consent missing at upload time (revoked elsewhere): says so and shows the permission again", async ({ page }) => {
    const bff = new FakeBff({
      documents: [docAt("readable")],
      consents: [{ scope: "collect", grantId: "grant-collect-0", documentIds: [], grantedAt: "2026-10-20T10:00:00.000Z", noticeStatus: "draft_needs_legal_review" }],
    });
    await open(page, bff);
    bff.consents = []; // revoked in another tab
    await kind(page, "Policy wording").check();
    await choose(page, PDF_FILE());
    await page.getByRole("button", { name: "Add this PDF" }).click();
    await expect(alerts(page)).toContainText("does not have your permission to store this PDF");
    await expect(page.locator('[data-consent-scope="collect"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Allow and add this PDF" })).toBeVisible();
  });
});

test.describe("stages", () => {
  const cases = [
    ["received", "Received", "Received. Security checks come next."],
    ["awaiting_checks", "Waiting for checks", "Waiting for security checks. This can take a while."],
    ["awaiting_ocr_consent", "Needs your permission", "needs your permission"],
    ["processing", "Reading", "Reading this PDF."],
    ["readable", "Readable", "Nothing has been checked or confirmed from it yet."],
    ["unreadable", "Could not read", "could not read the text in this PDF"],
    ["rejected", "Not accepted", "did not accept this file"],
    ["deleting", "Deleting", "Being deleted."],
    ["deleted", "Deleted", "This document was deleted."],
  ] as const;

  for (const [stage, label, text] of cases) {
    test(`stage ${stage} renders its badge, plain sentence and the right actions`, async ({ page }) => {
      const bff = new FakeBff({ documents: [docAt(stage)] });
      await open(page, bff);
      const row = page.locator(`[data-stage="${stage}"]`);
      await expect(row.locator(".kva-badge")).toContainText(label);
      await expect(row).toContainText(text);
      // Honest states: no percentage, no approval or cashless wording, no extraction claims.
      await expect(row).not.toContainText(/%|approved|cashless|extracted successfully/i);
      await expect(row.getByRole("progressbar")).toHaveCount(0);
      const deletable = stage !== "deleting" && stage !== "deleted";
      await expect(row.getByRole("button", { name: /^Delete/ })).toHaveCount(deletable ? 1 : 0);
      if (stage === "awaiting_ocr_consent") await expect(row.getByRole("button", { name: /^Allow reading/ })).toBeVisible();
      if (stage === "unreadable") await expect(row.getByRole("button", { name: /^Try reading again/ })).toBeVisible();
      if (stage === "awaiting_checks" || stage === "received") await expect(row.getByRole("button", { name: /^Check again/ })).toBeVisible();
    });
  }

  test("awaiting_checks has no ETA and Check again re-reads the overview", async ({ page }) => {
    const bff = new FakeBff({ documents: [docAt("awaiting_checks")] });
    await open(page, bff);
    const row = page.locator('[data-stage="awaiting_checks"]');
    await expect(row).not.toContainText(/\d+ ?(min|sec|hour)|soon|shortly/i);
    const before = bff.callsTo("GET /overview").length;
    await row.getByRole("button", { name: /^Check again/ }).click();
    await expect.poll(() => bff.callsTo("GET /overview").length).toBeGreaterThan(before);
  });

  test("an awaiting_ocr_consent document with consent already held offers Start reading", async ({ page }) => {
    const doc = docAt("awaiting_ocr_consent", { nextAction: "start_ocr" });
    const bff = new FakeBff({
      documents: [doc],
      consents: [{ scope: "ocr_sarvam", grantId: "grant-ocr-1", documentIds: [doc.id], grantedAt: "2026-10-20T10:00:00.000Z", noticeStatus: "draft_needs_legal_review" }],
    });
    await open(page, bff);
    await page.getByRole("button", { name: /^Start reading/ }).click();
    await expect(page.locator('[data-stage="processing"]')).toBeVisible();
    expect(bff.callsTo("POST /consents")).toHaveLength(0);
  });
});

test.describe("reading (OCR)", () => {
  test("allow reading: per-document consent, start, then polling refresh until readable", async ({ page }) => {
    await page.clock.install();
    const doc = docAt("awaiting_ocr_consent");
    const bff = new FakeBff({ documents: [doc], refreshScript: { [doc.id]: ["processing", "processing", "readable"] } });
    await bff.install(page);
    await page.goto("/app/documents");
    await page.getByRole("button", { name: /^Allow reading/ }).click();

    const dialog = page.getByRole("dialog", { name: "Let Knowvia read this PDF?" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Read this PDF with an outside service" })).toBeVisible();
    await expect(dialog.getByText("Draft wording, pending legal review")).toBeVisible();
    await expect(dialog.getByText("This permission covers this one PDF.")).toBeVisible();
    expect(bff.callsTo("POST /consents")).toHaveLength(0);
    await dialog.getByRole("button", { name: "Allow and read this PDF" }).click();

    await expect(dialog).toHaveCount(0);
    const row = page.locator(`[data-doc-id="${doc.id}"]`);
    await expect(row).toHaveAttribute("data-stage", "processing");
    await expect(row.locator(".kva-badge")).toContainText("Reading");
    expect(JSON.parse(bff.callsTo("POST /consents")[0].body!.toString())).toEqual({ scope: "ocr_sarvam", documentId: doc.id });
    expect(bff.callsTo("POST /documents/:id/ocr")).toHaveLength(1);

    // Backoff: nothing at 2 s, first poll after 3 s, then 4.8 s, then 7.68 s.
    await page.clock.runFor(2000);
    expect(bff.callsTo("POST /documents/:id/ocr/refresh")).toHaveLength(0);
    await page.clock.runFor(1100);
    await expect.poll(() => bff.callsTo("POST /documents/:id/ocr/refresh").length).toBe(1);
    await page.clock.runFor(4900);
    await expect.poll(() => bff.callsTo("POST /documents/:id/ocr/refresh").length).toBe(2);
    await page.clock.runFor(7800);
    await expect(row).toHaveAttribute("data-stage", "readable");
    await expect(row.locator(".kva-badge")).toContainText("Readable");
    // Terminal state stops polling.
    await page.clock.runFor(60_000);
    expect(bff.callsTo("POST /documents/:id/ocr/refresh")).toHaveLength(3);
  });

  test("Not now closes the dialog, returns focus and sends nothing", async ({ page }) => {
    const bff = new FakeBff({ documents: [docAt("awaiting_ocr_consent")] });
    await open(page, bff);
    const opener = page.getByRole("button", { name: /^Allow reading/ });
    await opener.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("button", { name: "Not now" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    expect(bff.callsTo("POST /consents")).toHaveLength(0);
  });

  test("OCR failure: unreadable, then Try reading again starts a new job", async ({ page }) => {
    const doc = docAt("unreadable", { nextAction: "retry_ocr" });
    const bff = new FakeBff({
      documents: [doc],
      consents: [{ scope: "ocr_sarvam", grantId: "grant-ocr-1", documentIds: [doc.id], grantedAt: "2026-10-20T10:00:00.000Z", noticeStatus: "draft_needs_legal_review" }],
    });
    await open(page, bff);
    const row = page.locator('[data-stage="unreadable"]');
    await expect(row.locator(".kva-badge")).toContainText("Could not read");
    await row.getByRole("button", { name: /^Try reading again/ }).click();
    await expect(page.locator('[data-stage="processing"]')).toBeVisible();
    expect(bff.callsTo("POST /documents/:id/ocr")).toHaveLength(1);
  });

  test("a failing start shows a Retry that works", async ({ page }) => {
    const doc = docAt("unreadable", { nextAction: "retry_ocr" });
    const bff = new FakeBff({
      documents: [doc],
      consents: [{ scope: "ocr_sarvam", grantId: "grant-ocr-1", documentIds: [doc.id], grantedAt: "2026-10-20T10:00:00.000Z", noticeStatus: "draft_needs_legal_review" }],
    });
    bff.failNext("POST /documents/:id/ocr", { status: 504, code: "BACKEND_TIMEOUT", retryable: true });
    await open(page, bff);
    await page.getByRole("button", { name: /^Try reading again/ }).click();
    await expect(alerts(page)).toContainText("That took too long");
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.locator('[data-stage="processing"]')).toBeVisible();
    expect(bff.callsTo("POST /documents/:id/ocr")).toHaveLength(2);
  });

  test("polling stalls after repeated failures and offers Check again", async ({ page }) => {
    await page.clock.install();
    const doc = docAt("processing");
    const bff = new FakeBff({ documents: [doc] });
    bff.failNext("POST /documents/:id/ocr/refresh", { status: 503, code: "BACKEND_UNREACHABLE", retryable: true }, 3);
    await bff.install(page);
    await page.goto("/app/documents");
    await expect(page.locator('[data-stage="processing"]')).toBeVisible();
    // Each poll schedules the next one only after its request settles, so wait for each before moving the clock on.
    for (const [delay, calls] of [[3100, 1], [4900, 2], [7800, 3]] as const) {
      await page.clock.runFor(delay);
      await expect.poll(() => bff.callsTo("POST /documents/:id/ocr/refresh").length).toBe(calls);
    }
    await expect(page.getByText("Could not check on this PDF")).toBeVisible();
    expect(bff.callsTo("POST /documents/:id/ocr/refresh")).toHaveLength(3);
    await page.getByRole("button", { name: "Check again" }).click();
    await page.clock.runFor(3100);
    await expect(page.locator('[data-stage="readable"]')).toBeVisible();
  });

  test("polling pauses while the tab is hidden", async ({ page }) => {
    await page.clock.install();
    const doc = docAt("processing");
    const bff = new FakeBff({ documents: [doc], refreshScript: { [doc.id]: ["processing"] } });
    await bff.install(page);
    await page.goto("/app/documents");
    await expect(page.locator('[data-stage="processing"]')).toBeVisible();
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    });
    await page.clock.runFor(30_000);
    expect(bff.callsTo("POST /documents/:id/ocr/refresh")).toHaveLength(0);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect.poll(() => bff.callsTo("POST /documents/:id/ocr/refresh").length).toBeGreaterThan(0);
  });
});

test.describe("delete and revoke", () => {
  test("delete asks first; Cancel changes nothing; confirm shows deleting", async ({ page }) => {
    const doc = docAt("readable");
    const bff = new FakeBff({ documents: [doc] });
    await open(page, bff);
    const trigger = page.getByRole("button", { name: /^Delete policy schedule/ });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Delete this PDF?" });
    await expect(dialog).toContainText("It cannot be undone.");
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(bff.callsTo("DELETE /documents/:id")).toHaveLength(0);

    await trigger.click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete PDF" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const row = page.locator(`[data-doc-id="${doc.id}"]`);
    await expect(row).toHaveAttribute("data-stage", "deleting");
    await expect(row.locator(".kva-badge")).toContainText("Deleting");
    await expect(row.getByRole("button", { name: /^Delete/ })).toHaveCount(0);
    expect(bff.callsTo("DELETE /documents/:id")).toHaveLength(1);
  });

  test("Escape closes the delete dialog", async ({ page }) => {
    const bff = new FakeBff({ documents: [docAt("readable")] });
    await open(page, bff);
    await page.getByRole("button", { name: /^Delete/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(bff.callsTo("DELETE /documents/:id")).toHaveLength(0);
  });

  test("a failed delete keeps the dialog open with the reason", async ({ page }) => {
    const bff = new FakeBff({ documents: [docAt("readable")] });
    bff.failNext("DELETE /documents/:id", { status: 403, code: "DOCUMENT_DELETE_FORBIDDEN" });
    await open(page, bff);
    await page.getByRole("button", { name: /^Delete/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete PDF" }).click();
    await expect(page.getByRole("dialog")).toContainText("You are not allowed to delete this document.");
  });

  test("dialog traps focus: Tab never leaves the dialog", async ({ page }) => {
    const bff = new FakeBff({ documents: [docAt("readable")] });
    await open(page, bff);
    await page.getByRole("button", { name: /^Delete/ }).click();
    const dialog = page.getByRole("dialog");
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
  });

  test("withdrawing a permission says what stops and that derived answers are erased, then updates the list", async ({ page }) => {
    const doc = docAt("readable");
    const bff = new FakeBff({
      documents: [doc],
      consents: [
        { scope: "collect", grantId: "grant-collect-0", documentIds: [], grantedAt: "2026-10-20T10:00:00.000Z", noticeStatus: "draft_needs_legal_review" },
        { scope: "ocr_sarvam", grantId: "grant-ocr-1", documentIds: [doc.id], grantedAt: "2026-10-20T10:05:00.000Z", noticeStatus: "draft_needs_legal_review" },
      ],
    });
    await bff.install(page);
    await page.goto("/app");
    const list = page.locator("#kva-permissions-h + p + p + p + ul, section[aria-labelledby='kva-permissions-h'] ul");
    await expect(list.locator("li")).toHaveCount(2);
    await expect(list.getByText("Draft wording, pending legal review").first()).toBeVisible();

    await page.getByRole("button", { name: /Withdraw permission: Read policy schedule/ }).click();
    const dialog = page.getByRole("dialog", { name: "Withdraw this permission?" });
    await expect(dialog).toContainText("stops sending this PDF to the reading service");
    await expect(dialog).toContainText("erases the text and answers Knowvia derived from this PDF");
    await dialog.getByRole("button", { name: "Withdraw permission" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(list.locator("li")).toHaveCount(1);
    expect(JSON.parse(bff.callsTo("POST /consents/revoke")[0].body!.toString())).toEqual({ scope: "ocr_sarvam", documentId: doc.id });

    // Revoked consent: the document asks for permission again.
    await page.getByRole("navigation", { name: "App" }).getByRole("link", { name: "Documents" }).click();
    await expect(page.locator('[data-stage="awaiting_ocr_consent"]')).toBeVisible();
  });

  test("with no permissions the list says nothing is stored or read", async ({ page }) => {
    const bff = new FakeBff();
    await bff.install(page);
    await page.goto("/app");
    await expect(page.getByText("No permissions given yet")).toBeVisible();
  });
});

test.describe("keyboard", () => {
  async function tabTo(page: Page, target: { selector: string } | { text: string }, max = 40) {
    for (let i = 0; i < max; i += 1) {
      const there = await page.evaluate((t) => {
        const el = document.activeElement;
        if (!el) return false;
        return "selector" in t ? el.matches(t.selector) : (el.textContent ?? "").includes(t.text) && el.tagName === "BUTTON";
      }, target);
      if (there) return;
      await page.keyboard.press("Tab");
    }
    throw new Error(`Never reached ${JSON.stringify(target)} by Tab`);
  }

  test("keyboard-only upload: radio, file input, add button, with a visible focus ring", async ({ page }) => {
    const bff = new FakeBff({ documents: [] });
    await open(page, bff);

    await tabTo(page, { selector: 'input[name="document-kind"]' });
    await page.keyboard.press("ArrowDown"); // radio group arrows pick Policy wording
    await expect(kind(page, "Policy wording")).toBeChecked();

    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("kva-file");
    const ring = await page.locator('label[for="kva-file"]').evaluate((el) => {
      const style = getComputedStyle(el);
      return { outline: style.outlineStyle, width: style.outlineWidth, shadow: style.boxShadow };
    });
    expect(ring.outline).toBe("solid");
    expect(ring.width).toBe("2px");
    expect(ring.shadow).not.toBe("none");

    // The native file chooser cannot be driven from the keyboard in automation: set the file on the focused input.
    await choose(page, PDF_FILE("keyboard.pdf"));
    await expect(page.getByTestId("chosen-file")).toContainText("keyboard.pdf");

    await tabTo(page, { text: "Allow and add this PDF" });
    await page.keyboard.press("Enter");
    await expect(page.getByText("PDF added")).toBeVisible();
    expect(bff.callsTo("POST /cases/:id/documents")[0].headers["x-document-kind"]).toBe("policy_wording");
  });

  test("touch targets are at least 44px and the page does not scroll sideways at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    const bff = new FakeBff({ documents: [docAt("awaiting_ocr_consent"), docAt("readable"), docAt("unreadable")] });
    await open(page, bff);
    const small = await page.evaluate(() => {
      const bad: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>(".kva-root button, .kva-root a, .kva-root label.kva-file-label, .kva-root .kva-choice, .kva-root input:not(.kva-file-input):not([type='radio'])")) {
        if (el.closest(".kva-skip") || el.matches(".kva-sr")) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width && rect.height && rect.height < 44 - 0.5) bad.push(`${el.tagName} ${el.textContent?.trim().slice(0, 30)} ${Math.round(rect.height)}`);
      }
      return bad;
    });
    expect(small).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
