"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { type CSSProperties, useEffect } from "react";
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
import { ResearchSegment } from "./ResearchSegment";
import { RoomTestSection } from "./RoomTestSection";
import { StoriesSection } from "./StoriesSection";
import { Component as LandingModel } from "./landing-model";

/** The design's page wrapper: body text colour, ground and smoothing, with the browser's default type size. */
export const designRoot: CSSProperties = {
  fontFamily: "var(--font-body), system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
  color: "#1A3034",
  background: "#F3F7F6",
  WebkitFontSmoothing: "antialiased",
  overflowX: "clip",
  fontSize: "16px",
  lineHeight: "normal",
};

const modelProps = { voiceEnabled: process.env.NEXT_PUBLIC_VOICE_NOTES_ENABLED === "true" };

/** Smooth scroll for the landing page, off when the visitor prefers reduced motion. It pauses while the dock panel locks the page. */
function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, anchors: true });
    const root = document.documentElement;
    let locked = false;
    const lock = new MutationObserver(() => {
      const next = root.classList.contains("kv-lock");
      if (next === locked) return;
      locked = next;
      if (locked) lenis.stop();
      else lenis.start();
    });
    lock.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => {
      lock.disconnect();
      lenis.destroy();
    };
  }, []);
}

export function LandingPage() {
  const v: Any = useDcModel(LandingModel, modelProps);
  useSmoothScroll();
  return (
    <div style={designRoot}>
      <a className="kv-skip" href="#main">Skip to main content</a>
      <SiteNav />
      <main id="main">
        <div className="kv-curtain">
          <HeroSection v={v} />
          <HowItWorksSection v={v} />
        </div>
        <ClauseBand v={v} />
        <ContrastSection v={v} />
        <RoomTestSection v={v} />
        <HouseholdControl v={v} />
        <LimitsSection v={v} />
        <FamilyQuote />
        <QuestionsSection v={v} />
        <ResearchSegment>
          <IndustrySection v={v} />
          <StoriesSection v={v} />
        </ResearchSegment>
        <PartnersSection v={v} />
        <EarlyListSection v={v} />
      </main>
      <SiteFooter />
    </div>
  );
}
