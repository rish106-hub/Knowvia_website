"use client";

import type { CSSProperties } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteNav } from "@/components/layout/SiteNav";
import type { Any } from "@/lib/dc";
import { useDcModel } from "@/lib/use-dc-model";
import { ClauseBand } from "./ClauseBand";
import { ContrastSection } from "./ContrastSection";
import { EarlyListSection } from "./EarlyListSection";
import { FamilyQuote } from "./FamilyQuote";
import { HeroSection } from "./HeroSection";
import { HouseholdControl } from "./HouseholdControl";
import { HowItWorksSection } from "./HowItWorksSection";
import { IndustrySection } from "./IndustrySection";
import { LimitsSection } from "./LimitsSection";
import { PartnersSection } from "./PartnersSection";
import { QuestionsSection } from "./QuestionsSection";
import { StoriesSection } from "./StoriesSection";
import { Component as LandingModel } from "./landing-model";

/** The design's page wrapper: body text colour, ground and smoothing, with the browser's default type size. */
export const designRoot: CSSProperties = {
  fontFamily: "var(--font-body), system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
  color: "#1A3034",
  background: "#F3F7F6",
  WebkitFontSmoothing: "antialiased",
  fontSize: "16px",
  lineHeight: "normal",
};

const modelProps = { voiceEnabled: process.env.NEXT_PUBLIC_VOICE_NOTES_ENABLED === "true" };

export function LandingPage() {
  const v: Any = useDcModel(LandingModel, modelProps);
  return (
    <div style={designRoot}>
      <a className="kv-skip" href="#main">Skip to main content</a>
      <SiteNav />
      <main id="main">
        <HeroSection v={v} />
        <IndustrySection v={v} />
        <ClauseBand v={v} />
        <ContrastSection v={v} />
        <HowItWorksSection />
        <StoriesSection v={v} />
        <HouseholdControl />
        <LimitsSection v={v} />
        <FamilyQuote />
        <QuestionsSection v={v} />
        <PartnersSection />
        <EarlyListSection v={v} />
      </main>
      <SiteFooter />
    </div>
  );
}
