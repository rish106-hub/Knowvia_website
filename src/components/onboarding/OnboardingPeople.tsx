// Generated from the approved Claude Design artboard O3-People.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import Link from "next/link";
import { useDcModel } from "@/lib/use-dc-model";
import { Component as Model } from "./o3-people-model";

export function OnboardingPeople() {
  useDcModel(Model, {});
  return (
    <>
    <div style={{width: "100%", height: "auto", boxSizing: "border-box", background: "#F3F7F6", fontFamily: "var(--font-body), system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif", color: "#1A3034", display: "flex", flexDirection: "column", maxWidth: "480px", minHeight: "100dvh", margin: "0 auto", fontSize: "16px", lineHeight: "normal"}}>
      <div style={{height: "64px", padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "space-between"}}>
        <Link href="/onboarding/coming-up" aria-label="Back" style={{width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", color: "#163F42"}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5"></path>
            <path d="M11 6l-6 6 6 6"></path>
          </svg>
        </Link>
        <span style={{fontSize: "15px", fontWeight: "600", letterSpacing: "0.01em", color: "#55696D", paddingRight: "8px"}}>
          {"Step 3 of 5"}
        </span>
      </div>
      <div style={{flex: "1 1 auto", padding: "24px 20px 0", display: "flex", flexDirection: "column", gap: "16px"}}>
        <h1 style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "32px", lineHeight: "1.15", letterSpacing: "-0.01em", color: "#163F42"}}>
          {"Who is in your family's cover?"}
        </h1>
        <p style={{margin: "0", fontSize: "17px", lineHeight: "1.6"}}>
          {"Add anyone whose policy you help with: a partner, children, parents or a sibling."}
        </p>
        <ul style={{listStyle: "none", margin: "8px 0 0", padding: "0", display: "flex", flexDirection: "column", gap: "10px"}}>
          <li style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", minHeight: "64px", padding: "8px 8px 8px 16px", background: "#FFFFFF", border: "1px solid #CFDCDA", borderRadius: "10px"}}>
            <div style={{display: "flex", flexDirection: "column"}}>
              <span style={{fontSize: "17px", fontWeight: "600", color: "#163F42"}}>
                {"You"}
              </span>
              <span style={{fontSize: "15px", color: "#55696D"}}>
                {"33"}
              </span>
            </div>
            <button type="button" aria-label="Edit You" style={{width: "44px", height: "44px", border: "0", background: "transparent", color: "#55696D", cursor: "pointer"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 20h4L19 9l-4-4L4 16z"></path>
                <path d="M13.5 6.5l4 4"></path>
              </svg>
            </button>
          </li>
          <li style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", minHeight: "64px", padding: "8px 8px 8px 16px", background: "#FFFFFF", border: "1px solid #CFDCDA", borderRadius: "10px"}}>
            <div style={{display: "flex", flexDirection: "column"}}>
              <span style={{fontSize: "17px", fontWeight: "600", color: "#163F42"}}>
                {"Maa"}
              </span>
              <span style={{fontSize: "15px", color: "#55696D"}}>
                {"Mother, 58"}
              </span>
            </div>
            <button type="button" aria-label="Edit Maa" style={{width: "44px", height: "44px", border: "0", background: "transparent", color: "#55696D", cursor: "pointer"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 20h4L19 9l-4-4L4 16z"></path>
                <path d="M13.5 6.5l4 4"></path>
              </svg>
            </button>
          </li>
          <li style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", minHeight: "64px", padding: "8px 8px 8px 16px", background: "#FFFFFF", border: "1px solid #CFDCDA", borderRadius: "10px"}}>
            <div style={{display: "flex", flexDirection: "column"}}>
              <span style={{fontSize: "17px", fontWeight: "600", color: "#163F42"}}>
                {"Papa"}
              </span>
              <span style={{fontSize: "15px", color: "#55696D"}}>
                {"Father, 61"}
              </span>
            </div>
            <button type="button" aria-label="Edit Papa" style={{width: "44px", height: "44px", border: "0", background: "transparent", color: "#55696D", cursor: "pointer"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 20h4L19 9l-4-4L4 16z"></path>
                <path d="M13.5 6.5l4 4"></path>
              </svg>
            </button>
          </li>
          <li style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", minHeight: "64px", padding: "8px 8px 8px 16px", background: "#FFFFFF", border: "1px solid #CFDCDA", borderRadius: "10px"}}>
            <div style={{display: "flex", flexDirection: "column"}}>
              <span style={{fontSize: "17px", fontWeight: "600", color: "#163F42"}}>
                {"Brother"}
              </span>
              <span style={{fontSize: "15px", color: "#55696D"}}>
                {"24"}
              </span>
            </div>
            <button type="button" aria-label="Edit Brother" style={{width: "44px", height: "44px", border: "0", background: "transparent", color: "#55696D", cursor: "pointer"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 20h4L19 9l-4-4L4 16z"></path>
                <path d="M13.5 6.5l4 4"></path>
              </svg>
            </button>
          </li>
        </ul>
        <button type="button" style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "8px", height: "52px", padding: "0 22px", borderRadius: "999px", border: "2px solid #176F69", background: "transparent", color: "#176F69", font: "inherit", fontSize: "17px", fontWeight: "600", cursor: "pointer"}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          {"Add a person"}
        </button>
        <p style={{margin: "0", fontSize: "15px", lineHeight: "1.45", color: "#55696D"}}>
          {"Adults you add get an invite to confirm what they share."}
        </p>
      </div>
      <div style={{padding: "20px"}}>
        <Link href="/onboarding/sharing" style={{display: "flex", alignItems: "center", justifyContent: "center", height: "56px", borderRadius: "999px", background: "#176F69", color: "#FFFFFF", fontSize: "17px", fontWeight: "600", textDecoration: "none"}}>
          {"Continue"}
        </Link>
      </div>
    </div>
    </>
  );
}
