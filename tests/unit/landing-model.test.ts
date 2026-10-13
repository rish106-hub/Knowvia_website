import { describe, expect, it } from "vitest";
import { Component as LandingModel } from "@/components/home/landing-model";
import type { Any } from "@/lib/dc";

describe("landing model ported from the approved design", () => {
  it("keeps every content set from the canvas", () => {
    const view = new LandingModel({}).renderVals();
    expect(view.faqs).toHaveLength(10);
    expect(view.promises).toHaveLength(5);
    expect(view.promises[0].num).toBe("01");
    expect(view.termsLoop).toHaveLength(24);
    expect(view.oldWay).toHaveLength(5);
    expect(view.newWay).toHaveLength(5);
    expect(view.policies).toHaveLength(5);
    expect(view.events).toHaveLength(5);
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
});
