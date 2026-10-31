import { describe, expect, it } from "vitest";
import { listConnectors } from "@/server/app/connectors";
import { loadAppConfig } from "@/server/app/env";
import { isDemoBuild } from "@/components/app/blocks/demo-env";
import { baseEnv, makeApp, request, signIn } from "./helpers";

const CONTRACT_ORDER = ["upload", "camera", "email_forward", "gmail", "outlook", "insurer_portal", "hr_portal", "digilocker", "whatsapp", "voice"];

const list = async (env = baseEnv()) => {
  const ctx = makeApp({ env });
  const response = await ctx.app.dispatch("connectors.list", request("/api/app/connectors"));
  return { ctx, response, body: await response.clone().json() };
};

describe("connectors.list", () => {
  it("demo on: all 10 in contract order, demo true", async () => {
    const { response, body } = await list(baseEnv({ APP_DEMO_DATA: "true" }));
    expect(response.status).toBe(200);
    expect(body.demo).toBe(true);
    expect(body.connectors.map((c: { id: string }) => c.id)).toEqual(CONTRACT_ORDER);
    expect(body.connectors.find((c: { id: string }) => c.id === "gmail")).toMatchObject({ availability: "later", noticeKey: "gmail-draft-legal-review" });
  });

  it("demo off: upload only, demo false", async () => {
    const { body } = await list();
    expect(body.demo).toBe(false);
    expect(body.connectors.map((c: { id: string }) => c.id)).toEqual(["upload"]);
    expect(body.connectors[0].availability).toBe("available");
  });

  it("needs no session and sets no cookie", async () => {
    const { response } = await list();
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it("every descriptor has a draft notice key and an intake channel equal to its id", () => {
    for (const connector of listConnectors(true)) {
      expect(connector.noticeKey).toMatch(/-draft-legal-review$/);
      expect(connector.intakeChannel).toBe(connector.id);
    }
  });

  it("APP_ENABLED unset: 404 APP_DISABLED", async () => {
    const { response, body } = await list(baseEnv({ APP_ENABLED: undefined }));
    expect(response.status).toBe(404);
    expect(body.error.code).toBe("APP_DISABLED");
  });
});

describe("connectors.grant", () => {
  const grant = (ctx: ReturnType<typeof makeApp>, id: string, jar: Map<string, string>, csrf = true) =>
    ctx.app.dispatch("connectors.grant", request(`/api/app/connectors/${id}/grant`, { method: "POST", json: {}, jar, csrf }), { connectorId: id });

  it("gmail: 501 CONNECTOR_NOT_AVAILABLE, not retryable, and nothing is called on the backend", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    const before = ctx.backend.calls.length;
    const response = await grant(ctx, "gmail", jar);
    expect(response.status).toBe(501);
    expect((await response.json()).error).toMatchObject({ code: "CONNECTOR_NOT_AVAILABLE", retryable: false });
    expect(ctx.backend.calls.length).toBe(before);
  });

  it("missing marker header: 403 CSRF_BLOCKED", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    const response = await grant(ctx, "gmail", jar, false);
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("CSRF_BLOCKED");
  });

  it("unknown id: 404 CONNECTOR_NOT_FOUND", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    const response = await grant(ctx, "carrier_pigeon", jar);
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("CONNECTOR_NOT_FOUND");
  });

  it("no session: 401 and no connector detail", async () => {
    const ctx = makeApp();
    const response = await grant(ctx, "gmail", new Map());
    expect(response.status).toBe(401);
  });

  it("a malformed id is refused before any lookup", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    const response = await grant(ctx, "..%2Fx", jar);
    expect(response.status).toBe(400);
  });
});

describe("voice.intake", () => {
  it("answers 501 VOICE_INTAKE_NOT_IMPLEMENTED and never touches the backend", async () => {
    const ctx = makeApp();
    const { jar } = await signIn(ctx);
    const before = ctx.backend.calls.length;
    const response = await ctx.app.dispatch("voice.intake", request("/api/app/voice-intake", { method: "POST", json: {}, jar }));
    expect(response.status).toBe(501);
    expect((await response.json()).error).toMatchObject({ code: "VOICE_INTAKE_NOT_IMPLEMENTED", retryable: false });
    expect(ctx.backend.calls.length).toBe(before);
  });

  it("missing marker header: 403 CSRF_BLOCKED", async () => {
    const ctx = makeApp();
    const response = await ctx.app.dispatch("voice.intake", request("/api/app/voice-intake", { method: "POST", json: {}, csrf: false }));
    expect(response.status).toBe(403);
  });
});

describe("stub sign-in providers", () => {
  it.each(["google", "microsoft", "apple", "phone_otp"])("%s: 501 IDENTITY_NOT_IMPLEMENTED and no household is created", async (provider) => {
    const ctx = makeApp();
    const response = await ctx.app.dispatch("session.create", request("/api/app/session", { method: "POST", json: { provider, email: "stub@example.test" } }));
    expect(response.status).toBe(501);
    expect((await response.json()).error.code).toBe("IDENTITY_NOT_IMPLEMENTED");
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(ctx.backend.calls.filter((call) => call.path === "/api/v1/households")).toEqual([]);
  });
});

describe("demo build rule used by the connect page", () => {
  it.each([
    [{ NODE_ENV: "development", APP_DEMO_DATA: "true" }],
    [{ NODE_ENV: "test", APP_DEMO_DATA: "1" }],
    [{ NODE_ENV: "test", APP_DEMO_DATA: "false" }],
    [{ NODE_ENV: "test" }],
    [{ NODE_ENV: "production", APP_DEMO_DATA: "true" }],
    [{ NODE_ENV: "", APP_DEMO_DATA: "true" }],
    [{ NODE_ENV: "staging", APP_DEMO_DATA: "true" }],
  ])("agrees with the BFF config for %j", (extra) => {
    const env = baseEnv({ ...extra, APP_DEV_IDENTITY: "false" });
    let demo = false;
    try {
      const config = loadAppConfig(env);
      demo = config.enabled && config.demoData;
    } catch {
      demo = false; // the BFF refuses to start with demo data in production
    }
    expect(isDemoBuild(env)).toBe(demo);
  });
});
