import { expect, test } from "@playwright/test";
import { FakeBff, alerts } from "./fake-bff";

test.describe("signed out and sign-in", () => {
  test("signed out: /app goes to a sign-in that says what this sign-in is", async ({ page }) => {
    const bff = new FakeBff({ signedIn: false });
    await bff.install(page);
    await page.goto("/app");
    await expect(page).toHaveURL(/\/app\/sign-in$/);
    await expect(page.getByRole("heading", { level: 1, name: "Sign in to Knowvia" })).toBeVisible();
    await expect(page.getByText("Development sign-in", { exact: true })).toBeVisible();
    await expect(page.getByText(/does not check your email and does not send a code/)).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    // No pretend OTP: there is no "send code" or "verify" control anywhere.
    await expect(page.getByRole("button", { name: /send code|verify|otp/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Continue with development sign-in" })).toBeVisible();
    // Nothing that needs a session was requested.
    expect(bff.calledKeys()).toEqual(["GET /session"]);
  });

  test("dev sign-in succeeds, sends provider dev, and lands on documents", async ({ page }) => {
    const bff = new FakeBff({ signedIn: false });
    await bff.install(page);
    await page.goto("/app/sign-in");
    await page.getByLabel("Email").fill("asha@example.test");
    await page.getByLabel("Your name (optional)").fill("Asha Test");
    await page.getByRole("button", { name: "Continue with development sign-in" }).click();
    await expect(page).toHaveURL(/\/app\/documents$/);
    await expect(page.getByRole("heading", { level: 1, name: "Documents" })).toBeVisible();
    const post = bff.callsTo("POST /session")[0];
    expect(JSON.parse(post.body!.toString())).toEqual({ provider: "dev", email: "asha@example.test", displayName: "Asha Test" });
    expect(post.headers["x-knowvia-app"]).toBe("1");
    await expect(page.getByText("Development preview. This sign-in is not verified.")).toBeVisible();
  });

  test("an invalid email is stopped with a message before any request", async ({ page }) => {
    const bff = new FakeBff({ signedIn: false });
    await bff.install(page);
    await page.goto("/app/sign-in");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByRole("button", { name: "Continue with development sign-in" }).click();
    await expect(alerts(page)).toContainText("Enter an email address");
    expect(bff.callsTo("POST /session")).toHaveLength(0);
  });

  for (const [mode, status] of [["not_implemented", 501], ["disabled", 404]] as const) {
    test(`sign-in not available (${status}) renders a clear state and never pretends to send a code`, async ({ page }) => {
      const bff = new FakeBff({ signedIn: false, signIn: mode });
      await bff.install(page);
      await page.goto("/app/sign-in");
      await page.getByLabel("Email").fill("asha@example.test");
      await page.getByRole("button", { name: "Continue with development sign-in" }).click();
      const state = page.getByTestId("sign-in-unavailable");
      await expect(state.getByText("Sign-in is not available yet")).toBeVisible();
      await expect(state).toContainText("No code was sent");
      await expect(page.getByLabel("Email")).toHaveCount(0);
      await expect(page).toHaveURL(/\/app\/sign-in$/);
    });
  }

  test("rate limited sign-in shows recoverable copy and keeps the form", async ({ page }) => {
    const bff = new FakeBff({ signedIn: false, signIn: "rate_limited" });
    await bff.install(page);
    await page.goto("/app/sign-in");
    await page.getByLabel("Email").fill("asha@example.test");
    await page.getByRole("button", { name: "Continue with development sign-in" }).click();
    await expect(alerts(page)).toContainText("Too many attempts");
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("expired session on arrival: says the session ended and does not promise recovery", async ({ page }) => {
    const bff = new FakeBff({ signedIn: false, sessionReason: "expired" });
    await bff.install(page);
    await page.goto("/app/documents");
    await expect(page).toHaveURL(/\/app\/sign-in\?reason=expired$/);
    await expect(page.getByRole("heading", { level: 1, name: "Your session ended" })).toBeVisible();
    await expect(page.getByText("Getting back into the same household is not available yet")).toBeVisible();
    await expect(page.getByText(/new, empty household/)).toBeVisible();
  });

  test("session that expires mid-use sends you to the expired state", async ({ page }) => {
    const bff = new FakeBff({ documents: [] });
    await bff.install(page);
    await page.goto("/app/documents");
    await expect(page.getByRole("heading", { level: 1, name: "Documents" })).toBeVisible();
    bff.expired = true;
    await page.getByRole("link", { name: "Home" }).click();
    await page.getByRole("link", { name: "Documents" }).click();
    await page.reload();
    await expect(page).toHaveURL(/\/app\/sign-in\?reason=expired$/);
    await expect(page.getByRole("heading", { level: 1, name: "Your session ended" })).toBeVisible();
  });

  test("sign out clears the session and shows the signed-out state", async ({ page }) => {
    const bff = new FakeBff();
    await bff.install(page);
    await page.goto("/app");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/app\/sign-in\?reason=signed_out$/);
    await expect(page.getByRole("heading", { level: 1, name: "You have signed out" })).toBeVisible();
    expect(bff.callsTo("DELETE /session")).toHaveLength(1);
    expect(bff.callsTo("DELETE /session")[0].headers["x-knowvia-app"]).toBe("1");
  });

  test("home lists household members read-only, with no add, invite or edit control", async ({ page }) => {
    const bff = new FakeBff();
    await bff.install(page);
    await page.goto("/app");
    const people = page.getByTestId("people");
    await expect(people.getByText("Asha Test")).toBeVisible();
    await expect(people).toContainText("You, account owner");
    await expect(page.getByText(/Adding family members and sharing are not available yet/)).toBeVisible();
    await expect(page.getByRole("button", { name: /add|invite|edit|share/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /add person|invite/i })).toHaveCount(0);
  });

  test("the session check failing offline shows a retry, not a blank page", async ({ page }) => {
    const bff = new FakeBff();
    bff.failNext("GET /session", "abort");
    await bff.install(page);
    await page.goto("/app");
    await expect(page.getByText("You look offline")).toBeVisible();
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Your household" })).toBeVisible();
  });
});
