// Generated from the approved Claude Design artboard O6-Reading.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import Link from "next/link";
import { useDcModel } from "@/lib/use-dc-model";
import { Component as Model } from "./o6-reading-model";

export function OnboardingReading() {
  useDcModel(Model, {});
  return (
    <>
    <div style={{width: "100%", height: "auto", boxSizing: "border-box", background: "#F3F7F6", fontFamily: "var(--font-body), system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif", color: "#1A3034", display: "flex", flexDirection: "column", maxWidth: "480px", minHeight: "100dvh", margin: "0 auto", fontSize: "16px", lineHeight: "normal"}}>
      <div style={{height: "64px", padding: "0 20px", display: "flex", alignItems: "center"}}>
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
      </div>
      <div style={{flex: "1 1 auto", padding: "32px 20px 0", display: "flex", flexDirection: "column", gap: "20px"}}>
        <h1 style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "32px", lineHeight: "1.15", letterSpacing: "-0.01em", color: "#163F42"}}>
          {"Reading your documents"}
        </h1>
        <div aria-hidden="true" style={{height: "3px", borderRadius: "3px", background: "linear-gradient(90deg,#E6EFEC,#176F69,#E6EFEC)", backgroundSize: "200% 100%", animation: "kvLoad 1.2s linear 2,kvOut 300ms ease-out 2.6s forwards"}}></div>
        <ul aria-live="polite" style={{listStyle: "none", margin: "0", padding: "0", display: "flex", flexDirection: "column", gap: "10px"}}>
          <li style={{display: "flex", gap: "12px", alignItems: "center", minHeight: "52px", padding: "0 14px", background: "#FFFFFF", borderRadius: "10px", border: "1px solid #CFDCDA", animation: "kvIn 420ms cubic-bezier(0.165,0.84,0.44,1) 200ms both"}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#163F42" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="5 12.5 10 17 19 7"></polyline>
            </svg>
            <span style={{fontSize: "17px"}}>
              {"Found: 2 policy schedules"}
            </span>
          </li>
          <li style={{display: "flex", gap: "12px", alignItems: "center", minHeight: "52px", padding: "0 14px", background: "#FFFFFF", borderRadius: "10px", border: "1px solid #CFDCDA", animation: "kvIn 420ms cubic-bezier(0.165,0.84,0.44,1) 800ms both"}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#163F42" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="5 12.5 10 17 19 7"></polyline>
            </svg>
            <span style={{fontSize: "17px"}}>
              {"Found: 4 members across both"}
            </span>
          </li>
          <li style={{display: "flex", gap: "12px", alignItems: "center", minHeight: "52px", padding: "0 14px", background: "#FFFFFF", borderRadius: "10px", border: "1px solid #CFDCDA", animation: "kvIn 420ms cubic-bezier(0.165,0.84,0.44,1) 1400ms both"}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#163F42" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="5 12.5 10 17 19 7"></polyline>
            </svg>
            <span style={{fontSize: "17px"}}>
              {"Found: sum insured ₹5,00,000"}
            </span>
          </li>
          <li style={{display: "flex", gap: "12px", alignItems: "center", minHeight: "52px", padding: "0 14px", background: "#FBF1DD", borderRadius: "10px", border: "1.5px dashed #7A5207", color: "#7A5207", animation: "kvIn 420ms cubic-bezier(0.165,0.84,0.44,1) 2000ms both"}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-0.7 0.3-1 0.8-1 1.5v0.4"></path>
              <circle cx="12" cy="17" r="0.6" fill="currentColor"></circle>
            </svg>
            <span style={{fontSize: "17px", fontWeight: "600"}}>
              {"Not found: room-rent clause"}
            </span>
          </li>
        </ul>
        <p style={{margin: "0", fontSize: "17px", lineHeight: "1.6"}}>
          {"You can leave this page. We will email you when it is ready."}
        </p>
      </div>
      <div style={{padding: "20px", animation: "kvIn 420ms cubic-bezier(0.165,0.84,0.44,1) 2700ms both"}}>
        <Link href="/onboarding/your-cover" style={{display: "flex", alignItems: "center", justifyContent: "center", height: "56px", borderRadius: "999px", background: "#176F69", color: "#FFFFFF", fontSize: "17px", fontWeight: "600", textDecoration: "none"}}>
          {"See what we found"}
        </Link>
      </div>
    </div>
    </>
  );
}
