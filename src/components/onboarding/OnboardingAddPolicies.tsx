// Generated from the approved Claude Design artboard O5-Upload.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import Link from "next/link";
import { useDcModel } from "@/lib/use-dc-model";
import { Component as Model } from "./o5-upload-model";

export function OnboardingAddPolicies() {
  useDcModel(Model, {});
  return (
    <>
    <div style={{width: "100%", height: "auto", boxSizing: "border-box", background: "#F3F7F6", fontFamily: "var(--font-body), system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif", color: "#1A3034", display: "flex", flexDirection: "column", maxWidth: "480px", minHeight: "100dvh", margin: "0 auto", fontSize: "16px", lineHeight: "normal"}}>
      <div style={{height: "64px", padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "space-between"}}>
        <Link href="/onboarding/sharing" aria-label="Back" style={{width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", color: "#163F42"}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5"></path>
            <path d="M11 6l-6 6 6 6"></path>
          </svg>
        </Link>
        <span style={{fontSize: "15px", fontWeight: "600", letterSpacing: "0.01em", color: "#55696D", paddingRight: "8px"}}>
          {"Step 5 of 5"}
        </span>
      </div>
      <div style={{flex: "1 1 auto", padding: "8px 20px 0", display: "flex", flexDirection: "column", gap: "12px", overflow: "hidden"}}>
        <h1 style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "32px", lineHeight: "1.15", letterSpacing: "-0.01em", color: "#163F42"}}>
          {"Add the policies you have."}
        </h1>
        <div style={{border: "2px dashed #7B918E", borderRadius: "16px", background: "#FFFFFF", minHeight: "150px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "16px", textAlign: "center"}}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#163F42" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path>
            <path d="M14 3v5h5"></path>
            <path d="M12 17v-6M9.5 13.5L12 11l2.5 2.5"></path>
          </svg>
          <p style={{margin: "0", fontSize: "17px", lineHeight: "1.4", fontWeight: "600", color: "#163F42"}}>
            {"Drop a PDF here, or choose a file"}
          </p>
          <p style={{margin: "0", fontSize: "15px", color: "#55696D"}}>
            {"PDF, up to 15 MB each"}
          </p>
          <label className="kv-file" htmlFor="o5-file" style={{display: "inline-flex", alignItems: "center", height: "44px", padding: "0 20px", borderRadius: "999px", border: "2px solid #176F69", color: "#176F69", fontSize: "16px", fontWeight: "600", cursor: "pointer"}}>
            {"Choose a file"}
          </label>
          <input id="o5-file" type="file" accept=".pdf,application/pdf" multiple style={{position: "absolute", width: "1px", height: "1px", opacity: "0"}} />
        </div>
        <div style={{display: "flex", flexWrap: "wrap", gap: "6px"}} aria-label="Documents that help">
          <span style={{display: "inline-flex", alignItems: "center", height: "30px", padding: "0 12px", borderRadius: "999px", background: "#E6EFEC", fontSize: "15px", fontWeight: "600", color: "#163F42"}}>
            {"Policy schedule"}
          </span>
          <span style={{display: "inline-flex", alignItems: "center", height: "30px", padding: "0 12px", borderRadius: "999px", background: "#E6EFEC", fontSize: "15px", fontWeight: "600", color: "#163F42"}}>
            {"Policy wording"}
          </span>
          <span style={{display: "inline-flex", alignItems: "center", height: "30px", padding: "0 12px", borderRadius: "999px", background: "#E6EFEC", fontSize: "15px", fontWeight: "600", color: "#163F42"}}>
            {"Employer benefits booklet"}
          </span>
          <span style={{display: "inline-flex", alignItems: "center", height: "30px", padding: "0 12px", borderRadius: "999px", background: "#E6EFEC", fontSize: "15px", fontWeight: "600", color: "#163F42"}}>
            {"Renewal notice"}
          </span>
          <span style={{display: "inline-flex", alignItems: "center", height: "30px", padding: "0 12px", borderRadius: "999px", background: "#E6EFEC", fontSize: "15px", fontWeight: "600", color: "#163F42"}}>
            {"Quote"}
          </span>
        </div>
        <ul style={{listStyle: "none", margin: "0", padding: "0", display: "flex", flexDirection: "column", gap: "8px"}}>
          <li style={{display: "flex", alignItems: "center", gap: "12px", minHeight: "52px", padding: "4px 4px 4px 14px", background: "#FFFFFF", border: "1px solid #CFDCDA", borderRadius: "10px"}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#163F42" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Added">
              <polyline points="5 12.5 10 17 19 7"></polyline>
            </svg>
            <div style={{flex: "1 1 auto", display: "flex", flexDirection: "column", minWidth: "0"}}>
              <span style={{fontSize: "16px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>
                {"Employer group schedule.pdf"}
              </span>
              <span style={{fontSize: "15px", color: "#55696D"}}>
                {"1.2 MB"}
              </span>
            </div>
            <button type="button" aria-label="Remove Employer group schedule.pdf" style={{width: "44px", height: "44px", border: "0", background: "transparent", color: "#55696D", cursor: "pointer"}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18"></path>
              </svg>
            </button>
          </li>
          <li style={{display: "flex", alignItems: "center", gap: "12px", minHeight: "52px", padding: "4px 4px 4px 14px", background: "#FFFFFF", border: "1px solid #CFDCDA", borderRadius: "10px"}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#163F42" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Added">
              <polyline points="5 12.5 10 17 19 7"></polyline>
            </svg>
            <div style={{flex: "1 1 auto", display: "flex", flexDirection: "column", minWidth: "0"}}>
              <span style={{fontSize: "16px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>
                {"Papa family floater schedule.pdf"}
              </span>
              <span style={{fontSize: "15px", color: "#55696D"}}>
                {"640 KB"}
              </span>
            </div>
            <button type="button" aria-label="Remove Papa family floater schedule.pdf" style={{width: "44px", height: "44px", border: "0", background: "transparent", color: "#55696D", cursor: "pointer"}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18"></path>
              </svg>
            </button>
          </li>
          <li style={{display: "flex", flexDirection: "column", gap: "4px", padding: "6px 4px 8px 14px", background: "#FFFFFF", border: "2px solid #A74335", borderRadius: "10px"}}>
            <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A74335" strokeWidth="2.2" strokeLinecap="round" role="img" aria-label="Not added">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M12 7.5v5.5"></path>
                <circle cx="12" cy="16.6" r="0.6" fill="currentColor"></circle>
              </svg>
              <div style={{flex: "1 1 auto", display: "flex", flexDirection: "column", minWidth: "0"}}>
                <span style={{fontSize: "16px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>
                  {"Papa renewal scan.pdf"}
                </span>
                <span style={{fontSize: "15px", color: "#55696D"}}>
                  {"18.4 MB"}
                </span>
              </div>
              <button type="button" aria-label="Remove Papa renewal scan.pdf" style={{width: "44px", height: "44px", border: "0", background: "transparent", color: "#55696D", cursor: "pointer"}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18"></path>
                </svg>
              </button>
            </div>
            <p role="alert" style={{margin: "0 0 0 32px", fontSize: "17px", lineHeight: "1.4", fontWeight: "600", color: "#A74335"}}>
              {"This file is over 15 MB. Try a smaller PDF."}
            </p>
          </li>
        </ul>
        <p style={{margin: "0", fontSize: "15px", lineHeight: "1.45", color: "#55696D"}}>
          <Link href="/onboarding/your-cover">
            {"No policy to hand? Skip for now."}
          </Link>
          {" We will tell you exactly what to ask for."}
        </p>
        <p style={{margin: "0", fontSize: "15px", lineHeight: "1.45", color: "#55696D"}}>
          {"Only add documents you are allowed to share."}
        </p>
      </div>
      <div style={{padding: "10px 20px 20px"}}>
        <Link href="/onboarding/reading" style={{display: "flex", alignItems: "center", justifyContent: "center", height: "56px", borderRadius: "999px", background: "#176F69", color: "#FFFFFF", fontSize: "17px", fontWeight: "600", textDecoration: "none"}}>
          {"Read my documents"}
        </Link>
      </div>
    </div>
    </>
  );
}
