import { afterEach, describe, expect, it, vi } from "vitest";
import { appAddCoverUrl, betaDemoUrl, betaTargetUrl, DEFAULT_BETA_URL } from "@/lib/beta-url";

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

describe("betaTargetUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("keeps email and name on the add-cover target", () => {
    vi.stubEnv("NEXT_PUBLIC_BETA_URL", "https://app.example.test");
    expect(betaTargetUrl("a+b@x.test", "Ann Lee")).toBe("https://app.example.test/covers/add?email=a%2Bb%40x.test&name=Ann%20Lee");
  });

  it("omits query without email", () => {
    vi.stubEnv("NEXT_PUBLIC_BETA_URL", "https://app.example.test");
    expect(betaTargetUrl("", "Ann")).toBe("https://app.example.test/covers/add");
  });

  it("keeps the old target and query when env is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_BETA_URL", "");
    expect(betaTargetUrl("a@x.test", "")).toBe(DEFAULT_BETA_URL + "?email=a%40x.test");
    expect(betaTargetUrl("a@x.test", "Ann")).toBe(DEFAULT_BETA_URL + "?email=a%40x.test&name=Ann");
  });
});
