// Generated from the approved Claude Design artboard O7-Matrix-Mobile.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import { useDcModel } from "@/lib/use-dc-model";
import { Component as Model } from "./o7-matrix-mobile-model";

export function OnboardingCoverMobile() {
  useDcModel(Model, {});
  return (
    <>
    <div style={{width: "100%", minHeight: "100dvh", boxSizing: "border-box", background: "#F3F7F6", fontFamily: "var(--font-body), system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif", color: "#1A3034", display: "flex", flexDirection: "column", maxWidth: "480px", height: "auto", margin: "0 auto", fontSize: "16px", lineHeight: "normal"}}>
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
        <span style={{display: "inline-flex", alignItems: "center", height: "28px", padding: "0 10px", borderRadius: "6px", background: "#E6EFEC", color: "#163F42", fontSize: "15px", fontWeight: "600"}}>
          {"Example"}
        </span>
      </div>
      <div style={{padding: "24px 20px 32px", display: "flex", flexDirection: "column", gap: "16px"}}>
        <h1 style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "32px", lineHeight: "1.15", letterSpacing: "-0.01em", color: "#163F42"}}>
          {"Your family's cover"}
        </h1>
        <p style={{margin: "0", fontSize: "15px", color: "#55696D"}}>
          {"Read from 2 documents, 13 October 2026"}
        </p>
        <article style={{background: "#FFFFFF", border: "1px solid #CFDCDA", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px"}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px"}}>
            <h2 style={{margin: "0", fontSize: "20px", fontWeight: "600", color: "#163F42"}}>
              {"You, 33"}
            </h2>
            <span style={{fontSize: "15px", color: "#55696D"}}>
              {"Employer group policy"}
            </span>
          </div>
          <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
            <span style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px", height: "28px", padding: "0 10px", borderRadius: "6px", background: "#E3F0EE", color: "#163F42", fontSize: "15px", fontWeight: "600"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="5 12.5 10 17 19 7"></polyline>
              </svg>
              {"Known"}
            </span>
            <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5"}}>
              {"Sum insured ₹5,00,000"}
            </p>
            <p style={{margin: "0", fontSize: "15px", color: "#55696D"}}>
              {"Employer schedule, page 2"}
            </p>
          </div>
          <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
            <span style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px", height: "28px", padding: "0 10px", borderRadius: "6px", background: "#FBF1DD", color: "#7A5207", border: "1.5px dashed #7A5207", boxSizing: "border-box", fontSize: "15px", fontWeight: "600"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-0.7 0.3-1 0.8-1 1.5v0.4"></path>
                <circle cx="12" cy="17" r="0.6" fill="currentColor"></circle>
              </svg>
              {"Not confirmed"}
            </span>
            <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5"}}>
              {"Room-rent limit"}
            </p>
          </div>
          <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
            <span style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px", height: "28px", padding: "0 10px", borderRadius: "6px", background: "#163F42", color: "#FFFFFF", fontSize: "15px", fontWeight: "600"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14"></path>
                <path d="M13 6l6 6-6 6"></path>
              </svg>
              {"Next"}
            </span>
            <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5", fontWeight: "600", color: "#163F42"}}>
              {"Ask HR for the full benefits booklet"}
            </p>
            <p style={{margin: "0", fontSize: "15px", color: "#55696D"}}>
              {"You, this week"}
            </p>
          </div>
          <button type="button" style={{alignSelf: "flex-start", minHeight: "44px", padding: "0 4px", border: "0", background: "transparent", font: "inherit", fontSize: "17px", fontWeight: "600", color: "#176F69", textDecoration: "underline", textUnderlineOffset: "0.2em", cursor: "pointer"}}>
            {"Why?"}
          </button>
        </article>
        <article style={{background: "#FFFFFF", border: "1px solid #CFDCDA", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px"}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px"}}>
            <h2 style={{margin: "0", fontSize: "20px", fontWeight: "600", color: "#163F42"}}>
              {"Maa, 58"}
            </h2>
            <span style={{fontSize: "15px", color: "#55696D"}}>
              {"On your employer policy"}
            </span>
          </div>
          <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
            <span style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px", height: "28px", padding: "0 10px", borderRadius: "6px", background: "#E3F0EE", color: "#163F42", fontSize: "15px", fontWeight: "600"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="5 12.5 10 17 19 7"></polyline>
              </svg>
              {"Known"}
            </span>
            <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5"}}>
              {"Enrolled as a dependant"}
            </p>
            <p style={{margin: "0", fontSize: "15px", color: "#55696D"}}>
              {"Employer member list, page 4"}
            </p>
          </div>
          <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
            <span style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px", height: "28px", padding: "0 10px", borderRadius: "6px", background: "#FBF1DD", color: "#7A5207", border: "1.5px dashed #7A5207", boxSizing: "border-box", fontSize: "15px", fontWeight: "600"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-0.7 0.3-1 0.8-1 1.5v0.4"></path>
                <circle cx="12" cy="17" r="0.6" fill="currentColor"></circle>
              </svg>
              {"Not confirmed"}
            </span>
            <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5"}}>
              {"What happens if you change jobs"}
            </p>
          </div>
          <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
            <span style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px", height: "28px", padding: "0 10px", borderRadius: "6px", background: "#163F42", color: "#FFFFFF", fontSize: "15px", fontWeight: "600"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14"></path>
                <path d="M13 6l6 6-6 6"></path>
              </svg>
              {"Next"}
            </span>
            <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5", fontWeight: "600", color: "#163F42"}}>
              {"Note the date your cover would end"}
            </p>
            <p style={{margin: "0", fontSize: "15px", color: "#55696D"}}>
              {"You, before any job change"}
            </p>
          </div>
        </article>
        <article style={{background: "#FFFFFF", border: "1px solid #CFDCDA", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px"}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px"}}>
            <h2 style={{margin: "0", fontSize: "20px", fontWeight: "600", color: "#163F42"}}>
              {"Papa, 61"}
            </h2>
            <span style={{fontSize: "15px", color: "#55696D"}}>
              {"Family floater"}
            </span>
          </div>
          <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
            <span style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px", height: "28px", padding: "0 10px", borderRadius: "6px", background: "#E3F0EE", color: "#163F42", fontSize: "15px", fontWeight: "600"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="5 12.5 10 17 19 7"></polyline>
              </svg>
              {"Known"}
            </span>
            <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5"}}>
              {"Floater cover ₹3,00,000"}
            </p>
            <p style={{margin: "0", fontSize: "15px", color: "#55696D"}}>
              {"Floater schedule, page 1"}
            </p>
          </div>
          <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
            <span style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px", height: "28px", padding: "0 10px", borderRadius: "6px", background: "#FBF1DD", color: "#7A5207", border: "1.5px dashed #7A5207", boxSizing: "border-box", fontSize: "15px", fontWeight: "600"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-0.7 0.3-1 0.8-1 1.5v0.4"></path>
                <circle cx="12" cy="17" r="0.6" fill="currentColor"></circle>
              </svg>
              {"Not confirmed"}
            </span>
            <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5"}}>
              {"Renewal date"}
            </p>
          </div>
          <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
            <span style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px", height: "28px", padding: "0 10px", borderRadius: "6px", background: "#163F42", color: "#FFFFFF", fontSize: "15px", fontWeight: "600"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14"></path>
                <path d="M13 6l6 6-6 6"></path>
              </svg>
              {"Next"}
            </span>
            <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5", fontWeight: "600", color: "#163F42"}}>
              {"Ask Papa for his renewal notice"}
            </p>
            <p style={{margin: "0", fontSize: "15px", color: "#55696D"}}>
              {"You, this week"}
            </p>
          </div>
        </article>
        <article style={{background: "#FFFFFF", border: "1px solid #CFDCDA", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px"}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px"}}>
            <h2 style={{margin: "0", fontSize: "20px", fontWeight: "600", color: "#163F42"}}>
              {"Brother, 24"}
            </h2>
            <span style={{fontSize: "15px", color: "#55696D"}}>
              {"On Papa's floater"}
            </span>
          </div>
          <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
            <span style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px", height: "28px", padding: "0 10px", borderRadius: "6px", background: "#E3F0EE", color: "#163F42", fontSize: "15px", fontWeight: "600"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="5 12.5 10 17 19 7"></polyline>
              </svg>
              {"Known"}
            </span>
            <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5"}}>
              {"Enrolled"}
            </p>
            <p style={{margin: "0", fontSize: "15px", color: "#55696D"}}>
              {"Floater schedule, page 1"}
            </p>
          </div>
          <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
            <span style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px", height: "28px", padding: "0 10px", borderRadius: "6px", background: "#FBF1DD", color: "#7A5207", border: "1.5px dashed #7A5207", boxSizing: "border-box", fontSize: "15px", fontWeight: "600"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-0.7 0.3-1 0.8-1 1.5v0.4"></path>
                <circle cx="12" cy="17" r="0.6" fill="currentColor"></circle>
              </svg>
              {"Schedule and your answer disagree"}
            </span>
            <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5"}}>
              {"Date of birth: 2001 on the schedule, 2002 from you"}
            </p>
          </div>
          <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
            <span style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px", height: "28px", padding: "0 10px", borderRadius: "6px", background: "#163F42", color: "#FFFFFF", fontSize: "15px", fontWeight: "600"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14"></path>
                <path d="M13 6l6 6-6 6"></path>
              </svg>
              {"Next"}
            </span>
            <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5", fontWeight: "600", color: "#163F42"}}>
              {"Ask the insurer to correct the date of birth"}
            </p>
            <p style={{margin: "0", fontSize: "15px", color: "#55696D"}}>
              {"Papa, before the renewal"}
            </p>
          </div>
        </article>
      </div>
    </div>
    </>
  );
}
