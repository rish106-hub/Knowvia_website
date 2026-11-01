// Demo scenarios (run W-B2): synthetic data only, built by the real buildDashboardView, served only while demo data is on.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildDemoDashboard, DEMO_PERSON, DEMO_SCENARIOS, isDemoScenario } from "@/server/app/demo-data";
import { dashboardViewSchema } from "@/server/app/contract";
import { DEMO_SCENARIO_IDS } from "@/components/app/demo/demo-scenarios";
import { isDemoBuild } from "@/components/app/blocks/demo-env";
import { baseEnv, makeApp, request } from "../app-bff/helpers";

// The reserved-domain rule of src/server/app/identity.ts (RESERVED_DOMAIN), applied to every email-shaped string.
const RESERVED_DOMAIN = /(^|\.)(test|invalid|example|localhost)$|(^|\.)example\.(com|org|net)$/i;
const EMAIL = /[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
const json = (scenario: (typeof DEMO_SCENARIOS)[number]) => JSON.stringify(buildDemoDashboard(scenario));

describe("demo scenarios", () => {
  it("are exactly empty, partial, full and conflicting, and the client mirror agrees", () => {
    expect([...DEMO_SCENARIOS]).toEqual(["empty", "partial", "full", "conflicting"]);
    expect([...DEMO_SCENARIO_IDS]).toEqual([...DEMO_SCENARIOS]);
    expect(isDemoScenario("full")).toBe(true);
    for (const bad of ["", "Full", "constructor", "__proto__", "../full", undefined, null, 3]) expect(isDemoScenario(bad)).toBe(false);
  });

  it("every view matches the dashboard contract", () => {
    for (const scenario of DEMO_SCENARIOS) expect(dashboardViewSchema.safeParse(buildDemoDashboard(scenario)).success, scenario).toBe(true);
  });

  it("every email is on a reserved domain, and the demo person is example.test", () => {
    expect(DEMO_PERSON.email).toMatch(/@example\.test$/);
    for (const scenario of DEMO_SCENARIOS) {
      for (const match of json(scenario).matchAll(EMAIL)) expect(match[1], `${scenario}: ${match[0]}`).toMatch(RESERVED_DOMAIN);
    }
    const source = readFileSync(join(__dirname, "..", "..", "..", "src/server/app/demo-data.ts"), "utf8");
    for (const match of source.matchAll(EMAIL)) expect(match[1], match[0]).toMatch(RESERVED_DOMAIN);
  });

  it("holds no run of ten digits, in the views or in the source", () => {
    for (const scenario of DEMO_SCENARIOS) expect(json(scenario), scenario).not.toMatch(/\d{10}/);
    const source = readFileSync(join(__dirname, "..", "..", "..", "src/server/app/demo-data.ts"), "utf8");
    expect(source.replace(/_/g, "")).not.toMatch(/\d{10}/);
  });

  it("never says score, streak or countdown, and never produces a confirmed state", () => {
    for (const scenario of DEMO_SCENARIOS) {
      const text = json(scenario).toLowerCase();
      for (const word of ["score", "streak", "countdown", "\"state\":\"verified\""]) expect(text, `${scenario}: ${word}`).not.toContain(word);
      expect(text).not.toContain("confirmed in your documents");
    }
  });

  it("empty shows 'Add your e-card first'; partial and full are read, not checked; conflicting disagrees", () => {
    const empty = buildDemoDashboard("empty");
    expect(empty.caseId).toBeNull();
    expect(empty.widgets.w01.state).toBe("empty");
    expect(empty.widgets.w01.data.emptyLabel).toBe("Add your e-card first");
    expect(empty.widgets.w17.state).toBe("empty");

    const partial = buildDemoDashboard("partial");
    expect(partial.widgets.w01.state).toBe("partial");
    expect(partial.widgets.w17.state).toBe("partial");

    const full = buildDemoDashboard("full");
    expect(full.widgets.w01.state).toBe("full");
    expect(full.widgets.w04.state).toBe("full");
    expect(full.widgets.w04.data.stored).toBe(false);
    expect(full.widgets.w14.data.eCard.saved).toBe(true);
    for (const topic of full.widgets.w17.data.topics) expect(["extracted_unverified", "unknown"]).toContain(topic.chip?.state);

    const conflicting = buildDemoDashboard("conflicting");
    expect(conflicting.widgets.w17.state).toBe("conflicting");
    const room = conflicting.widgets.w17.data.topics.find((topic) => topic.topic === "room_rent")!;
    expect(room.chip?.label).toBe("Your documents disagree");
    expect(room.values.map((value) => value.value).sort()).toEqual(["1% of sum insured", "No limit stated"]);
    expect(conflicting.widgets.w04.state).toBe("conflicting");
  });

  it("is deterministic", () => {
    for (const scenario of DEMO_SCENARIOS) expect(json(scenario)).toBe(json(scenario));
  });
});

describe("demo gate", () => {
  it("the page rule: demo flag on and NODE_ENV development or test; never production", () => {
    expect(isDemoBuild({ APP_DEMO_DATA: "true", NODE_ENV: "development" })).toBe(true);
    expect(isDemoBuild({ APP_DEMO_DATA: "true", NODE_ENV: "test" })).toBe(true);
    expect(isDemoBuild({ APP_DEMO_DATA: "true", NODE_ENV: "production" })).toBe(false);
    expect(isDemoBuild({ APP_DEMO_DATA: "true" })).toBe(false);
    expect(isDemoBuild({ NODE_ENV: "development" })).toBe(false);
    expect(isDemoBuild({ APP_DEMO_DATA: "false", NODE_ENV: "development" })).toBe(false);
  });

  it("the route serves each scenario with no session and no backend call while demo data is on", async () => {
    const ctx = makeApp({ env: baseEnv({ APP_DEMO_DATA: "true" }) });
    for (const scenario of DEMO_SCENARIOS) {
      const response = await ctx.app.dispatch("demo.get", request(`/api/app/demo/${scenario}`, { csrf: false }), { scenario });
      expect(response.status, scenario).toBe(200);
      expect(await response.json()).toEqual(JSON.parse(json(scenario)));
      expect(response.headers.getSetCookie()).toEqual([]);
    }
    expect(ctx.backend.calls).toEqual([]);
  });

  it("is a 404 when demo data is off, and for an unknown scenario", async () => {
    const off = makeApp({ env: baseEnv() });
    const response = await off.app.dispatch("demo.get", request("/api/app/demo/full", { csrf: false }), { scenario: "full" });
    expect(response.status).toBe(404);
    const on = makeApp({ env: baseEnv({ APP_DEMO_DATA: "true" }) });
    for (const scenario of ["nope", "constructor", "FULL"]) {
      const bad = await on.app.dispatch("demo.get", request(`/api/app/demo/${scenario}`, { csrf: false }), { scenario });
      expect(bad.status, scenario).toBe(404);
    }
  });

  it("refuses to run in production: demo data there is a misconfiguration, never a page", async () => {
    const prod = makeApp({ env: baseEnv({ APP_DEMO_DATA: "true", NODE_ENV: "production" }) });
    const response = await prod.app.dispatch("demo.get", request("/api/app/demo/full", { csrf: false }), { scenario: "full" });
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("Rs 5,00,000");
  });

  it("is a 404 while the BFF itself is off", async () => {
    const ctx = makeApp({ env: { NODE_ENV: "test", APP_DEMO_DATA: "true" } });
    const response = await ctx.app.dispatch("demo.get", request("/api/app/demo/full", { csrf: false }), { scenario: "full" });
    expect(response.status).toBe(404);
  });
});
