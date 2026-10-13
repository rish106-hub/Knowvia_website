// Generated from the approved Claude Design artboard O1-Start.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import Link from "next/link";
import { useDcModel } from "@/lib/use-dc-model";
import { Component as Model } from "./o1-start-model";

export function OnboardingStart() {
  useDcModel(Model, {});
  return (
    <>
    <div style={{width: "100%", height: "auto", boxSizing: "border-box", background: "#F3F7F6", fontFamily: "var(--font-body), system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif", color: "#1A3034", display: "flex", flexDirection: "column", maxWidth: "480px", minHeight: "100dvh", margin: "0 auto", fontSize: "16px", lineHeight: "normal"}}>
      <div style={{height: "64px", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between"}}>
        <div style={{display: "flex", alignItems: "center", gap: "8px", color: "#163F42"}}>
          <svg width="28" height="28" viewBox="0 0 800 800" aria-hidden="true">
            <rect width="800" height="800" rx="144" fill="#163F42"></rect>
            <path d="M258 194v412M265 404l274 210" fill="none" stroke="#F3F7F6" strokeWidth="58" strokeLinecap="round"></path>
            <path d="M265 404l274-210" fill="none" stroke="#E0A02B" strokeWidth="58" strokeLinecap="round"></path>
            <path d="M557 150l46 46-46 46-46-46z" fill="#E0A02B"></path>
          </svg>
          <span style={{fontSize: "19px", fontWeight: "600"}}>
            {"Knowvia"}
          </span>
        </div>
        <span style={{fontSize: "15px", fontWeight: "600", letterSpacing: "0.01em", color: "#55696D"}}>
          {"Step 1 of 5"}
        </span>
      </div>
      <div style={{flex: "1 1 auto", padding: "32px 20px 0", display: "flex", flexDirection: "column", gap: "16px"}}>
        <h1 style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "32px", lineHeight: "1.15", letterSpacing: "-0.01em", color: "#163F42"}}>
          {"Start with your own cover."}
        </h1>
        <p style={{margin: "0", fontSize: "17px", lineHeight: "1.6"}}>
          {"Use your email or phone. We will send a one-time code, so there is no password to remember."}
        </p>
        <div style={{marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px"}}>
          <label htmlFor="o1-id" style={{fontSize: "15px", fontWeight: "600", letterSpacing: "0.01em"}}>
            {"Email or phone"}
          </label>
          <input id="o1-id" type="text" autoComplete="username" defaultValue="you@example.in" style={{height: "56px", boxSizing: "border-box", padding: "0 16px", border: "1px solid #7B918E", borderRadius: "10px", background: "#FFFFFF", font: "inherit", fontSize: "17px", color: "#1A3034"}} />
          <p style={{margin: "0", fontSize: "15px", lineHeight: "1.45", color: "#55696D"}}>
            {"If you use a phone number, enter the 10 digits without the country code."}
          </p>
        </div>
      </div>
      <div style={{padding: "20px", display: "flex", flexDirection: "column", gap: "12px"}}>
        <Link href="/onboarding/coming-up" style={{display: "flex", alignItems: "center", justifyContent: "center", height: "56px", borderRadius: "999px", background: "#176F69", color: "#FFFFFF", fontSize: "17px", fontWeight: "600", textDecoration: "none"}}>
          {"Send code"}
        </Link>
        <p style={{margin: "0", textAlign: "center", fontSize: "17px", lineHeight: "1.5", color: "#55696D"}}>
          {"By continuing you agree to the "}
          <Link href="/terms">
            {"terms"}
          </Link>
          {" and "}
          <Link href="/privacy">
            {"privacy notice"}
          </Link>
          {"."}
        </p>
      </div>
    </div>
    </>
  );
}
