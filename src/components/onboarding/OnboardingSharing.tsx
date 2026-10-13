// Generated from the approved Claude Design artboard O4-Sharing.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import Link from "next/link";
import { type Any, css } from "@/lib/dc";
import { useDcModel } from "@/lib/use-dc-model";
import { Component as Model } from "./o4-sharing-model";

export function OnboardingSharing() {
  const v: Any = useDcModel(Model, {});
  return (
    <>
    <div style={{width: "100%", height: "auto", boxSizing: "border-box", background: "#F3F7F6", fontFamily: "var(--font-body), system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif", color: "#1A3034", display: "flex", flexDirection: "column", maxWidth: "480px", minHeight: "100dvh", margin: "0 auto", fontSize: "16px", lineHeight: "normal"}}>
      <div style={{height: "64px", padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "space-between"}}>
        <Link href="/onboarding/people" aria-label="Back" style={{width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", color: "#163F42"}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5"></path>
            <path d="M11 6l-6 6 6 6"></path>
          </svg>
        </Link>
        <span style={{fontSize: "15px", fontWeight: "600", letterSpacing: "0.01em", color: "#55696D", paddingRight: "8px"}}>
          {"Step 4 of 5"}
        </span>
      </div>
      <div style={{flex: "1 1 auto", padding: "12px 20px 0", display: "flex", flexDirection: "column", gap: "12px", overflow: "hidden"}}>
        <h1 style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "32px", lineHeight: "1.15", letterSpacing: "-0.01em", color: "#163F42"}}>
          {"Choose what you share."}
        </h1>
        <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5"}}>
          {"You decide for your own record. Each adult you added decides for theirs."}
        </p>
        <div style={{background: "#FFFFFF", border: "1px solid #CFDCDA", borderRadius: "16px", padding: "14px 16px", display: "flex", flexDirection: "column"}}>
          <span style={{fontSize: "19px", fontWeight: "600", color: "#163F42", paddingBottom: "4px"}}>
            {"You"}
          </span>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", minHeight: "52px", borderTop: "1px solid #CFDCDA"}}>
            <label htmlFor="o4-cover" style={{fontSize: "17px", fontWeight: "600"}}>
              {"Cover amount"}
            </label>
            <select id="o4-cover" style={{height: "44px", maxWidth: "180px", padding: "0 10px", border: "1px solid #7B918E", borderRadius: "10px", background: "#FFFFFF", font: "inherit", fontSize: "17px", color: "#1A3034"}}>
              <option>
                {"Shared with family"}
              </option>
              <option>
                {"Only me"}
              </option>
              <option>
                {"Choose people"}
              </option>
            </select>
          </div>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", minHeight: "52px", borderTop: "1px solid #CFDCDA"}}>
            <label htmlFor="o4-policy" style={{fontSize: "17px", fontWeight: "600"}}>
              {"Policy details"}
            </label>
            <select id="o4-policy" style={{height: "44px", maxWidth: "180px", padding: "0 10px", border: "1px solid #7B918E", borderRadius: "10px", background: "#FFFFFF", font: "inherit", fontSize: "17px", color: "#1A3034"}}>
              <option>
                {"Shared with family"}
              </option>
              <option>
                {"Only me"}
              </option>
              <option>
                {"Choose people"}
              </option>
            </select>
          </div>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", minHeight: "52px", borderTop: "1px solid #CFDCDA"}}>
            <label htmlFor="o4-med" style={{fontSize: "17px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#55696D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="5" y="11" width="14" height="9" rx="2"></rect>
                <path d="M8 11V8a4 4 0 0 1 8 0v3"></path>
              </svg>
              {"Medical details"}
            </label>
            <select id="o4-med" style={{height: "44px", maxWidth: "180px", padding: "0 10px", border: "1px solid #7B918E", borderRadius: "10px", background: "#FFFFFF", font: "inherit", fontSize: "17px", color: "#1A3034"}}>
              <option>
                {"Only me"}
              </option>
              <option>
                {"Choose people"}
              </option>
            </select>
          </div>
        </div>
        <div style={{background: "#FFFFFF", border: "1px solid #CFDCDA", borderRadius: "16px", padding: "12px 8px 12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px"}}>
          <div style={{display: "flex", flexDirection: "column", gap: "2px"}}>
            <span id="o4-emergency" style={{fontSize: "17px", fontWeight: "600", color: "#163F42"}}>
              {"Emergency access, set in advance"}
            </span>
            <span style={{fontSize: "17px", lineHeight: "1.45", color: "#55696D"}}>
              {"One person you choose sees everything if you cannot speak for yourself."}
            </span>
          </div>
          <button type="button" role="switch" onClick={v.toggle} aria-checked={v.onStr} aria-labelledby="o4-emergency" style={{flex: "0 0 auto", width: "60px", height: "44px", padding: "0", border: "0", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"}}>
            <span aria-hidden="true" style={css(v.trackStyle)}>
              <span style={css(v.knobStyle)}></span>
            </span>
          </button>
        </div>
        <div style={{background: "transparent", border: "1.5px dashed #7B918E", borderRadius: "16px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px"}}>
          <span style={{fontSize: "17px", fontWeight: "600", color: "#163F42"}}>
            {"Maa, Papa and your sister decide for themselves"}
          </span>
          <span style={{fontSize: "17px", lineHeight: "1.45", color: "#55696D"}}>
            {"Invites sent. Until they confirm, we suggest: cover amount shared, medical details private."}
          </span>
        </div>
      </div>
      <div style={{padding: "12px 20px 20px"}}>
        <Link href="/onboarding/add-policies" style={{display: "flex", alignItems: "center", justifyContent: "center", height: "56px", borderRadius: "999px", background: "#176F69", color: "#FFFFFF", fontSize: "17px", fontWeight: "600", textDecoration: "none"}}>
          {"Continue"}
        </Link>
      </div>
    </div>
    </>
  );
}
