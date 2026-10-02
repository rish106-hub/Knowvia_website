import { expect, test, type Page } from "@playwright/test";

// Browser-level form behaviour. The API is stubbed here; its real behaviour is covered by the
// contract tests in tests/unit/leads.test.ts. Turnstile is replaced by a stub that issues a token.

// Like the real widget, reset() runs a new challenge and issues a fresh token.
const TURNSTILE_STUB = `(function(){var opts;var n=0;function issue(){setTimeout(function(){n+=1;opts.callback("stub-token-"+n)},10)}window.turnstile={render:function(el,o){opts=o;issue();return "w1"},reset:function(){issue()},remove:function(){}};})();`;

async function prepare(page: Page) {
  await page.route(/posthog\.com|google/, (route) => route.abort());
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: TURNSTILE_STUB }),
  );
  await page.goto("/");
  await page.getByTestId("consent-banner").getByRole("button", { name: "Reject all" }).click();
  const section = page.locator("#early-access");
  await section.getByRole("button", { name: "Join early access" }).click();
  return section;
}

async function fill(section: ReturnType<Page["locator"]>) {
  await section.getByLabel("Email", { exact: true }).fill("person@example.com");
  await section.getByRole("checkbox", { name: /Email me about Knowvia/ }).check();
  await section.getByRole("checkbox", { name: /18 or older/ }).check();
}

test("opening the form focuses email and asks for no health or policy data", async ({ page }) => {
  const section = await prepare(page);
  await expect(section.getByLabel("Email", { exact: true })).toBeFocused();
  const labels = await section.locator("label").allTextContents();
  expect(labels.join(" ")).not.toMatch(/policy number|diagnosis|phone|date of birth/i);
});

test("client-side validation names the missing fields without a network call", async ({ page }) => {
  let posted = false;
  await page.route("**/api/public/v1/leads", (route) => {
    posted = true;
    return route.fulfill({ status: 202, body: "{}" });
  });
  const section = await prepare(page);
  await section.getByRole("button", { name: "Send confirmation link" }).click();
  await expect(section.getByText("Enter a valid email address")).toBeVisible();
  await expect(section.getByText("Tick the box to agree")).toBeVisible();
  expect(posted).toBe(false);
});

test("success shows the double opt-in message and sends an idempotency key", async ({ page }) => {
  let idempotencyKey: string | null = null;
  let body: Record<string, unknown> = {};
  await page.route("**/api/public/v1/leads", (route) => {
    idempotencyKey = route.request().headers()["idempotency-key"] ?? null;
    body = route.request().postDataJSON();
    return route.fulfill({ status: 202, contentType: "application/json", body: '{"status":"verification_pending"}' });
  });
  const section = await prepare(page);
  await fill(section);
  await section.getByRole("button", { name: "Send confirmation link" }).click();
  await expect(section.getByText("Check your inbox.")).toBeVisible();
  expect(idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
  expect(body).toMatchObject({ email: "person@example.com", marketingConsent: true, ageConfirmed: true, turnstileToken: "stub-token-1" });
  expect(Object.keys(body).sort()).toEqual(
    ["ageConfirmed", "audience", "email", "intent", "marketingConsent", "noticeVersion", "source", "turnstileToken"].sort(),
  );
});

test("a timeout or outage shows a retry message, and the retry reuses the idempotency key", async ({ page }) => {
  const keys: string[] = [];
  let attempt = 0;
  await page.route("**/api/public/v1/leads", (route) => {
    keys.push(route.request().headers()["idempotency-key"]);
    attempt += 1;
    if (attempt === 1) return route.abort("timedout");
    return route.fulfill({ status: 202, contentType: "application/json", body: '{"status":"verification_pending"}' });
  });
  const section = await prepare(page);
  await fill(section);
  await section.getByRole("button", { name: "Send confirmation link" }).click();
  await expect(section.locator(".form-status[role=alert]")).toContainText("could not reach Knowvia");
  await section.getByRole("button", { name: "Send confirmation link" }).click();
  await expect(section.getByText("Check your inbox.")).toBeVisible();
  expect(keys[0]).toBe(keys[1]);
});

test("server-side outages and bot failures are explained", async ({ page }) => {
  let status = 503;
  await page.route("**/api/public/v1/leads", (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(status === 503 ? { error: "temporarily_unavailable" } : { error: "verification_failed" }),
    }),
  );
  const section = await prepare(page);
  await fill(section);
  await section.getByRole("button", { name: "Send confirmation link" }).click();
  await expect(section.locator(".form-status[role=alert]")).toContainText("unavailable right now");
  status = 400;
  await section.getByRole("button", { name: "Send confirmation link" }).click();
  await expect(section.locator(".form-status[role=alert]")).toContainText("could not verify this browser");
});

test("the lead API refuses cross-site posts and reports missing configuration safely", async ({ request }) => {
  const crossSite = await request.post("/api/public/v1/leads", { headers: { Origin: "https://evil.example" }, data: {} });
  expect(crossSite.status()).toBe(403);
  const sameSite = await request.post("/api/public/v1/leads", {
    headers: { Origin: "http://localhost:3200", "Content-Type": "application/json" },
    data: {},
  });
  // This test server has no database or provider keys, so lead capture is disabled (fail closed).
  expect(sameSite.status()).toBe(503);
  expect(await sameSite.json()).toEqual({ error: "temporarily_unavailable" });
});

test("confirmation requires a click and handles an invalid link", async ({ page }) => {
  await page.route("**/api/public/v1/leads/confirm", (route) =>
    route.fulfill({ status: 400, contentType: "application/json", body: '{"error":"invalid_or_expired"}' }),
  );
  const response = await page.goto(`/confirm?token=${"a".repeat(43)}`);
  expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
  await page.getByRole("button", { name: "Confirm my email" }).click();
  await expect(page.locator(".form-status[role=alert]")).toContainText("expired or was already used");
});
