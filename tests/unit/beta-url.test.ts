import { afterEach, describe, expect, it, vi } from "vitest";
import { betaDemoUrl, DEFAULT_BETA_URL } from "@/lib/beta-url";

describe("betaDemoUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("defaults to the shared beta origin", () => {
    vi.stubEnv("NEXT_PUBLIC_BETA_URL", "");
    expect(betaDemoUrl()).toBe(DEFAULT_BETA_URL + "signin?demo=1");
  });

  it("uses the env override", () => {
    vi.stubEnv("NEXT_PUBLIC_BETA_URL", "https://beta.example.test/");
    expect(betaDemoUrl()).toBe("https://beta.example.test/signin?demo=1");
  });

  it("adds a missing trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_BETA_URL", "https://beta.example.test");
    expect(betaDemoUrl()).toBe("https://beta.example.test/signin?demo=1");
  });
});
