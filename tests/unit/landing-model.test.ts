import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { Component as LandingModel } from "@/components/home/landing-model";
import type { Any } from "@/lib/dc";

const generated = (name: string) =>
  readFileSync(new URL(`../../src/components/home/${name}`, import.meta.url), "utf8");

describe("landing model ported from the approved design", () => {
  it("keeps the interactive content sets from the canvas", () => {
    const view = new LandingModel({}).renderVals();
    expect(view.faqs).toHaveLength(10);
    expect(view.promises).toHaveLength(5);
    expect(view.promises[0].num).toBe("01");
    expect(view.oldWay).toHaveLength(5);
    expect(view.newWay).toHaveLength(5);
  });

  it("shows final industry numbers before any animation runs", () => {
    const view = new LandingModel({}).renderVals();
    expect(view.n.claims).toBe("44%");
    expect(view.n.crore).toBe("₹26,037 cr");
  });

  it("hides the voice tab unless voice notes are enabled", () => {
    expect(new LandingModel({}).renderVals().cm.showTabs).toBe(false);
    expect(new LandingModel({ closingMode: "voice" }).renderVals().cm.isWrite).toBe(true);
    const voice = new LandingModel({ voiceEnabled: true, closingMode: "voice", closingVoiceState: "recorded" }).renderVals();
    expect(voice.cm.showTabs).toBe(true);
    expect(voice.cm.buttonLabel).toBe("Send voice note and join");
  });

  it("validates the email before calling the API", () => {
    const model: Any = new LandingModel({});
    model.formModel("close", "default").submit({ preventDefault() {} });
    expect(model.state.closeState).toBe("empty");
    model.state.closeEmail = "not-an-email";
    model.formModel("close", "default").submit({ preventDefault() {} });
    expect(model.state.closeState).toBe("invalid");
  });

  it("renders four research findings without the repeated top-up story", () => {
    const source = generated("StoriesSection.tsx");
    for (const finding of ["₹80,000", "7 hours", "17 days", "7 of 19"]) {
      expect(source).toContain(finding);
    }
    expect(source).not.toContain("₹2,00,000");
  });

  it("renders three static policy-term groups", () => {
    const source = generated("ClauseBand.tsx");
    expect(source).toContain("Costs");
    expect(source).toContain("Eligibility");
    expect(source).toContain("Claims and continuity");
    expect(source).not.toContain("termsLoop");
    expect(source).not.toContain("kv-marquee");
  });

  it("keeps the closing form email-only and sends the simplified payload", () => {
    const form = generated("EarlyListSection.tsx");
    const model = generated("landing-model.js");
    expect(form.match(/<input/g)).toHaveLength(1);
    expect(form).not.toContain("voice");
    expect(form).not.toContain("First name");
    expect(model).toContain("var payload = { email: email, location: key === 'hero' ? 'hero' : 'closing' };");
    expect(model).not.toContain("payload.events");
    expect(model).not.toContain("payload.policies");
  });

  it("submits a dummy signup and reports server failure without changing the payload", async () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", { location: { search: "" }, dispatchEvent });
    vi.stubGlobal("CustomEvent", class CustomEventMock {});
    const fetchMock = vi.fn().mockResolvedValueOnce({ status: 201, ok: true }).mockResolvedValueOnce({ status: 503, ok: false });
    vi.stubGlobal("fetch", fetchMock);

    const success: Any = new LandingModel({});
    success.sendSignup("close", "dummy@example.com");
    await vi.waitFor(() => expect(success.state.closeState).toBe("success"));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ email: "dummy@example.com", location: "closing" });
    expect(dispatchEvent).toHaveBeenCalledOnce();

    const failure: Any = new LandingModel({});
    failure.sendSignup("hero", "dummy@example.com");
    await vi.waitFor(() => expect(failure.state.heroState).toBe("server"));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ email: "dummy@example.com", location: "hero" });
    vi.unstubAllGlobals();
  });
});
