import { afterEach, describe, expect, it, vi } from "vitest";
import { appAddCoverUrl, betaDemoUrl, DEFAULT_BETA_URL } from "@/lib/beta-url";

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

describe("appAddCoverUrl", () => {
  afterEach(() => vi.unstubAllEnvs());
  const url = (v: string) => {
    vi.stubEnv("NEXT_PUBLIC_BETA_URL", v);
    return appAddCoverUrl();
  };

  it("is null when unset", () => expect(url("")).toBeNull());
  it("builds from https", () => expect(url("https://app.example.test")).toBe("https://app.example.test/covers/add"));
  it("handles trailing slash", () => expect(url("https://app.example.test/")).toBe("https://app.example.test/covers/add"));
  it("allows http for localhost", () => expect(url("http://localhost:3000")).toBe("http://localhost:3000/covers/add"));
  it("rejects http on other hosts", () => expect(url("http://app.example.test")).toBeNull());
  it("rejects invalid values", () => {
    expect(url("not a url")).toBeNull();
    expect(url("javascript:alert(1)")).toBeNull();
  });
});
