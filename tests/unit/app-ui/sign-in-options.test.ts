import { describe, expect, it } from "vitest";
import { signInOptions } from "@/components/app/shell/sign-in-options";

describe("signInOptions", () => {
  it("offers nothing while the connectors list is loading or after it failed (the dev form must not flash up)", () => {
    expect(signInOptions({ status: "loading" })).toEqual({ status: "loading" });
    expect(signInOptions({ status: "error" })).toEqual({ status: "error" });
  });

  it("reads Google and the dev form from the server's answer", () => {
    expect(signInOptions({ status: "ready", data: { signIn: { google: true, dev: false } } })).toEqual({ status: "ready", google: true, dev: false });
    expect(signInOptions({ status: "ready", data: { signIn: { google: false, dev: true } } })).toEqual({ status: "ready", google: false, dev: true });
  });

  it("a list with no sign-in block offers neither", () => {
    expect(signInOptions({ status: "ready", data: {} })).toEqual({ status: "ready", google: false, dev: false });
  });
});
