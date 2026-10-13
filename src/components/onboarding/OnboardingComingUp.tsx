// Generated from the approved Claude Design artboard O2-Event.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import { Fragment } from "react";
import Link from "next/link";
import { type Any, css, truthy } from "@/lib/dc";
import { useDcModel } from "@/lib/use-dc-model";
import { Component as Model } from "./o2-event-model";

export function OnboardingComingUp() {
  const v: Any = useDcModel(Model, {});
  return (
    <>
    <div style={{width: "100%", height: "auto", boxSizing: "border-box", background: "#F3F7F6", fontFamily: "var(--font-body), system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif", color: "#1A3034", display: "flex", flexDirection: "column", maxWidth: "480px", minHeight: "100dvh", margin: "0 auto", fontSize: "16px", lineHeight: "normal"}}>
      <div style={{height: "64px", padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "space-between"}}>
        <Link href="/onboarding" aria-label="Back" style={{width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", color: "#163F42"}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5"></path>
            <path d="M11 6l-6 6 6 6"></path>
          </svg>
        </Link>
        <span style={{fontSize: "15px", fontWeight: "600", letterSpacing: "0.01em", color: "#55696D", paddingRight: "8px"}}>
          {"Step 2 of 5"}
        </span>
      </div>
      <div style={{flex: "1 1 auto", padding: "24px 20px 0", display: "flex", flexDirection: "column", gap: "16px"}}>
        <h1 style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "32px", lineHeight: "1.15", letterSpacing: "-0.01em", color: "#163F42"}}>
          {"What is coming up?"}
        </h1>
        <p style={{margin: "0", fontSize: "17px", lineHeight: "1.6"}}>
          {"This tells us what to read first."}
        </p>
        <fieldset style={{margin: "8px 0 0", padding: "0", border: "0", display: "flex", flexDirection: "column", gap: "10px"}}>
          <legend style={{position: "absolute", left: "-9999px"}}>
            {"What is coming up"}
          </legend>
          {(v.options ?? []).map((o: Any, i1: number) => (
            <Fragment key={i1}>
              <button type="button" onClick={o.pick} aria-pressed={o.on} style={css(o.style)}>
                <span>
                  {o.label}
                </span>
                {truthy(o.selected) && (
                  <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="5 12.5 10 17 19 7"></polyline>
                  </svg>
                  </>
                )}
              </button>
            </Fragment>
          ))}
        </fieldset>
      </div>
      <div style={{padding: "20px"}}>
        <Link href="/onboarding/people" style={{display: "flex", alignItems: "center", justifyContent: "center", height: "56px", borderRadius: "999px", background: "#176F69", color: "#FFFFFF", fontSize: "17px", fontWeight: "600", textDecoration: "none"}}>
          {"Continue"}
        </Link>
      </div>
    </div>
    </>
  );
}
