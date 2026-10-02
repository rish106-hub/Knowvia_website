import { describe, expect, it } from "vitest";
import { isSensitivePath, pathOnly, validateAnalyticsEvent } from "@/lib/analytics/events";
import {
  CONSENT_COOKIE,
  createConsentRecord,
  googleConsentSignals,
  parseConsentCookie,
  serializeConsentCookie,
} from "@/lib/consent/consent";

describe("consent cookie", () => {
  it("round-trips a choice", () => {
    const record = createConsentRecord({ analytics: true, advertising: false }, new Date("2026-10-02T00:00:00Z"));
    const header = serializeConsentCookie(record, true).split(";")[0];
    expect(parseConsentCookie(`other=1; ${header}`)).toEqual(record);
  });

  it("is first-party, lax and secure on https", () => {
    const cookie = serializeConsentCookie(createConsentRecord({ analytics: false, advertising: false }), true);
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("Path=/");
  });

  it.each([
    ["missing", "theme=dark"],
    ["malformed json", `${CONSENT_COOKIE}=%7Bnope`],
    ["old version", `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify({ analytics: true, advertising: true, version: 0, updatedAt: "2026-01-01" }))}`],
    ["non-boolean", `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify({ analytics: "yes", advertising: false, version: 1, updatedAt: "2026-01-01" }))}`],
  ])("treats a %s cookie as undecided", (_label, header) => {
    expect(parseConsentCookie(header)).toBeNull();
  });

  it("maps advertising and analytics to Google consent signals", () => {
    expect(googleConsentSignals({ analytics: false, advertising: false })).toEqual({
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
    expect(googleConsentSignals({ analytics: true, advertising: true }).ad_user_data).toBe("granted");
  });
});

describe("analytics allowlist", () => {
  it("accepts allowlisted events with valid properties", () => {
    expect(validateAnalyticsEvent("article_opened", { slug: "room-rent-limit" })).toEqual({ slug: "room-rent-limit" });
    expect(validateAnalyticsEvent("guide_opened", {})).toEqual({});
  });

  it("rejects extra properties so form content or identifiers cannot leak", () => {
    expect(validateAnalyticsEvent("lead_form_started", { placement: "hero", email: "a@example.com" })).toBeNull();
    expect(validateAnalyticsEvent("guide_opened", { text: "my policy number is 123" })).toBeNull();
  });

  it("rejects values outside the enums and free-text slugs", () => {
    expect(validateAnalyticsEvent("audience_selected", { audience: "insurer", surface: "hero" })).toBeNull();
    expect(validateAnalyticsEvent("article_opened", { slug: "Room Rent Limit!" })).toBeNull();
  });

  it("strips query strings and fragments from URLs", () => {
    expect(pathOnly("https://knowvia.example/confirm?token=abc#x")).toBe("https://knowvia.example/confirm");
    expect(pathOnly("/blog?utm_source=x")).toBe("/blog");
  });

  it("marks token-bearing pages as sensitive", () => {
    expect(isSensitivePath("/confirm")).toBe(true);
    expect(isSensitivePath("/unsubscribe")).toBe(true);
    expect(isSensitivePath("/blog")).toBe(false);
  });
});
