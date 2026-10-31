import { describe, expect, it } from "vitest";
import { AppConfigError, loadAppConfig } from "@/server/app/env";
import { baseEnv } from "./helpers";

describe("APP_DEMO_DATA", () => {
  it("is refused in production, naming the variable and no values", () => {
    const env = baseEnv({ NODE_ENV: "production", APP_DEV_IDENTITY: "false", APP_DEMO_DATA: "true" });
    let caught: unknown;
    try {
      loadAppConfig(env);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(AppConfigError);
    const message = (caught as AppConfigError).message;
    expect(message).toMatch(/APP_DEMO_DATA/);
    expect(message).not.toContain(env.APP_SESSION_SECRET as string);
    expect(message).not.toContain(env.COVERSAATH_BOOTSTRAP_TOKEN as string);
  });

  it.each(["", "staging", "prod"])("treats NODE_ENV=%j as production and refuses it", (nodeEnv) => {
    expect(() => loadAppConfig(baseEnv({ NODE_ENV: nodeEnv, APP_DEV_IDENTITY: "false", APP_DEMO_DATA: "true" }))).toThrow(/APP_DEMO_DATA/);
  });

  it("is on when NODE_ENV=test and the flag is set", () => {
    expect(loadAppConfig(baseEnv({ APP_DEMO_DATA: "true" }))).toMatchObject({ demoData: true });
  });

  it.each([undefined, "", "false", "0"])("is off when the flag is %j", (value) => {
    expect(loadAppConfig(baseEnv({ APP_DEMO_DATA: value }))).toMatchObject({ demoData: false });
  });

  it("is allowed to be off in production", () => {
    expect(loadAppConfig(baseEnv({ NODE_ENV: "production", APP_DEV_IDENTITY: "false", APP_DEMO_DATA: "false" }))).toMatchObject({ demoData: false, production: true });
  });
});
