// Generated from the approved Claude Design artboard O7-Matrix-Desktop.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import Link from "next/link";
import { useDcModel } from "@/lib/use-dc-model";
import { Component as Model } from "./o7-matrix-desktop-model";

export function OnboardingCoverDesktop() {
  useDcModel(Model, {});
  return (
    <>
    <div style={{width: "100%", height: "auto", boxSizing: "border-box", background: "#F3F7F6", fontFamily: "var(--font-body), system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif", color: "#1A3034", display: "flex", flexDirection: "column", minHeight: "100dvh", fontSize: "16px", lineHeight: "normal"}}>
      <header style={{height: "72px", padding: "0 120px", borderBottom: "1px solid #CFDCDA", display: "flex", alignItems: "center", justifyContent: "space-between"}}>
        <div style={{display: "flex", alignItems: "center", gap: "10px", color: "#163F42"}}>
          <svg width="32" height="32" viewBox="0 0 800 800" aria-hidden="true">
            <rect width="800" height="800" rx="144" fill="#163F42"></rect>
            <path d="M258 194v412M265 404l274 210" fill="none" stroke="#F3F7F6" strokeWidth="58" strokeLinecap="round"></path>
            <path d="M265 404l274-210" fill="none" stroke="#E0A02B" strokeWidth="58" strokeLinecap="round"></path>
            <path d="M557 150l46 46-46 46-46-46z" fill="#E0A02B"></path>
          </svg>
          <span style={{fontSize: "22px", fontWeight: "600"}}>
            {"Knowvia"}
          </span>
        </div>
        <div style={{display: "flex", alignItems: "center", gap: "16px"}}>
          <span style={{display: "inline-flex", alignItems: "center", height: "28px", padding: "0 10px", borderRadius: "6px", background: "#E6EFEC", color: "#163F42", fontSize: "15px", fontWeight: "600"}}>
            {"Example"}
          </span>
          <Link href="/onboarding/add-policies" style={{display: "inline-flex", alignItems: "center", height: "44px", padding: "0 20px", borderRadius: "999px", border: "2px solid #176F69", color: "#176F69", fontSize: "16px", fontWeight: "600", textDecoration: "none"}}>
            {"Add a policy"}
          </Link>
        </div>
      </header>
      <main style={{padding: "40px 120px", display: "flex", flexDirection: "column", gap: "24px"}}>
        <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
          <h1 style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "44px", lineHeight: "1.12", letterSpacing: "-0.01em", color: "#163F42"}}>
            {"Your family's cover"}
          </h1>
          <p style={{margin: "0", fontSize: "15px", color: "#55696D"}}>
            {"Read from 2 documents, 13 October 2026"}
          </p>
        </div>
        <table style={{width: "100%", borderCollapse: "separate", borderSpacing: "0", background: "#FFFFFF", border: "1px solid #CFDCDA", borderRadius: "16px", overflow: "hidden", fontSize: "18px", lineHeight: "1.45"}}>
          <thead>
            <tr style={{textAlign: "left", background: "#E6EFEC"}}>
              <th scope="col" style={{padding: "12px 20px", fontSize: "15px", fontWeight: "600", color: "#163F42", width: "130px"}}>
                {"Person"}
              </th>
              <th scope="col" style={{padding: "12px 20px", fontSize: "15px", fontWeight: "600", color: "#163F42", width: "190px"}}>
                {"Policies"}
              </th>
              <th scope="col" style={{padding: "12px 20px", fontSize: "15px", fontWeight: "600", color: "#163F42"}}>
                {"Known"}
              </th>
              <th scope="col" style={{padding: "12px 20px", fontSize: "15px", fontWeight: "600", color: "#163F42"}}>
                {"Not confirmed"}
              </th>
              <th scope="col" style={{padding: "12px 20px", fontSize: "15px", fontWeight: "600", color: "#163F42"}}>
                {"Next"}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr style={{verticalAlign: "top"}}>
              <th scope="row" style={{padding: "16px 20px", textAlign: "left", borderTop: "1px solid #CFDCDA"}}>
                <span style={{display: "block", fontWeight: "600", color: "#163F42"}}>
                  {"You"}
                </span>
                <span style={{fontSize: "15px", fontWeight: "400", color: "#55696D"}}>
                  {"33"}
                </span>
              </th>
              <td style={{padding: "16px 20px", borderTop: "1px solid #CFDCDA"}}>
                {"Employer group policy"}
              </td>
              <td style={{padding: "16px 20px", borderTop: "1px solid #CFDCDA"}}>
                <span style={{display: "flex", gap: "8px", alignItems: "flex-start"}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#163F42" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Known" style={{flex: "0 0 auto", marginTop: "4px"}}>
                    <polyline points="5 12.5 10 17 19 7"></polyline>
                  </svg>
                  <span>
                    {"Sum insured ₹5,00,000"}
                    <span style={{display: "block", fontSize: "15px", color: "#55696D"}}>
                      {"Employer schedule, page 2"}
                    </span>
                  </span>
                </span>
              </td>
              <td style={{padding: "16px 20px", borderTop: "1px solid #CFDCDA"}}>
                <span style={{display: "inline-flex", gap: "8px", alignItems: "center", padding: "4px 10px", borderRadius: "6px", background: "#FBF1DD", border: "1.5px dashed #7A5207", color: "#7A5207", fontWeight: "600", fontSize: "17px"}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9"></circle>
                    <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-0.7 0.3-1 0.8-1 1.5v0.4"></path>
                    <circle cx="12" cy="17" r="0.6" fill="currentColor"></circle>
                  </svg>
                  {"Room-rent limit"}
                </span>
              </td>
              <td style={{padding: "16px 20px", borderTop: "1px solid #CFDCDA"}}>
                <span style={{display: "flex", gap: "8px", alignItems: "flex-start"}}>
                  <span aria-hidden="true" style={{flex: "0 0 auto", marginTop: "6px", width: "12px", height: "12px", borderRadius: "50%", background: "#E0A02B"}}></span>
                  <span>
                    <span style={{display: "block", fontWeight: "600", color: "#163F42"}}>
                      {"Ask HR for the full benefits booklet"}
                    </span>
                    <span style={{display: "block", fontSize: "15px", color: "#55696D"}}>
                      {"You, this week"}
                    </span>
                  </span>
                </span>
                <button type="button" style={{minHeight: "44px", padding: "0 4px", marginLeft: "16px", border: "0", background: "transparent", font: "inherit", fontSize: "17px", fontWeight: "600", color: "#176F69", textDecoration: "underline", textUnderlineOffset: "0.2em", cursor: "pointer"}}>
                  {"Why?"}
                </button>
              </td>
            </tr>
            <tr style={{verticalAlign: "top"}}>
              <th scope="row" style={{padding: "16px 20px", textAlign: "left", borderTop: "1px solid #CFDCDA"}}>
                <span style={{display: "block", fontWeight: "600", color: "#163F42"}}>
                  {"Maa"}
                </span>
                <span style={{fontSize: "15px", fontWeight: "400", color: "#55696D"}}>
                  {"58"}
                </span>
              </th>
              <td style={{padding: "16px 20px", borderTop: "1px solid #CFDCDA"}}>
                {"Covered on your employer policy"}
              </td>
              <td style={{padding: "16px 20px", borderTop: "1px solid #CFDCDA"}}>
                <span style={{display: "flex", gap: "8px", alignItems: "flex-start"}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#163F42" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Known" style={{flex: "0 0 auto", marginTop: "4px"}}>
                    <polyline points="5 12.5 10 17 19 7"></polyline>
                  </svg>
                  <span>
                    {"Enrolled as a dependant"}
                    <span style={{display: "block", fontSize: "15px", color: "#55696D"}}>
                      {"Employer member list, page 4"}
                    </span>
                  </span>
                </span>
              </td>
              <td style={{padding: "16px 20px", borderTop: "1px solid #CFDCDA"}}>
                <span style={{display: "inline-flex", gap: "8px", alignItems: "center", padding: "4px 10px", borderRadius: "6px", background: "#FBF1DD", border: "1.5px dashed #7A5207", color: "#7A5207", fontWeight: "600", fontSize: "17px"}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9"></circle>
                    <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-0.7 0.3-1 0.8-1 1.5v0.4"></path>
                    <circle cx="12" cy="17" r="0.6" fill="currentColor"></circle>
                  </svg>
                  {"What happens if you change jobs"}
                </span>
              </td>
              <td style={{padding: "16px 20px", borderTop: "1px solid #CFDCDA"}}>
                <span style={{display: "flex", gap: "8px", alignItems: "flex-start"}}>
                  <span aria-hidden="true" style={{flex: "0 0 auto", marginTop: "6px", width: "12px", height: "12px", borderRadius: "50%", background: "#E0A02B"}}></span>
                  <span>
                    <span style={{display: "block", fontWeight: "600", color: "#163F42"}}>
                      {"Note the date your cover would end"}
                    </span>
                    <span style={{display: "block", fontSize: "15px", color: "#55696D"}}>
                      {"You, before any job change"}
                    </span>
                  </span>
                </span>
                <button type="button" style={{minHeight: "44px", padding: "0 4px", marginLeft: "16px", border: "0", background: "transparent", font: "inherit", fontSize: "17px", fontWeight: "600", color: "#176F69", textDecoration: "underline", textUnderlineOffset: "0.2em", cursor: "pointer"}}>
                  {"Why?"}
                </button>
              </td>
            </tr>
            <tr style={{verticalAlign: "top"}}>
              <th scope="row" style={{padding: "16px 20px", textAlign: "left", borderTop: "1px solid #CFDCDA"}}>
                <span style={{display: "block", fontWeight: "600", color: "#163F42"}}>
                  {"Papa"}
                </span>
                <span style={{fontSize: "15px", fontWeight: "400", color: "#55696D"}}>
                  {"61"}
                </span>
              </th>
              <td style={{padding: "16px 20px", borderTop: "1px solid #CFDCDA"}}>
                {"Family floater"}
              </td>
              <td style={{padding: "16px 20px", borderTop: "1px solid #CFDCDA"}}>
                <span style={{display: "flex", gap: "8px", alignItems: "flex-start"}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#163F42" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Known" style={{flex: "0 0 auto", marginTop: "4px"}}>
                    <polyline points="5 12.5 10 17 19 7"></polyline>
                  </svg>
                  <span>
                    {"Floater cover ₹3,00,000"}
                    <span style={{display: "block", fontSize: "15px", color: "#55696D"}}>
                      {"Floater schedule, page 1"}
                    </span>
                  </span>
                </span>
              </td>
              <td style={{padding: "16px 20px", borderTop: "1px solid #CFDCDA"}}>
                <span style={{display: "inline-flex", gap: "8px", alignItems: "center", padding: "4px 10px", borderRadius: "6px", background: "#FBF1DD", border: "1.5px dashed #7A5207", color: "#7A5207", fontWeight: "600", fontSize: "17px"}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9"></circle>
                    <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-0.7 0.3-1 0.8-1 1.5v0.4"></path>
                    <circle cx="12" cy="17" r="0.6" fill="currentColor"></circle>
                  </svg>
                  {"Renewal date"}
                </span>
              </td>
              <td style={{padding: "16px 20px", borderTop: "1px solid #CFDCDA"}}>
                <span style={{display: "flex", gap: "8px", alignItems: "flex-start"}}>
                  <span aria-hidden="true" style={{flex: "0 0 auto", marginTop: "6px", width: "12px", height: "12px", borderRadius: "50%", background: "#E0A02B"}}></span>
                  <span>
                    <span style={{display: "block", fontWeight: "600", color: "#163F42"}}>
                      {"Ask Papa for his renewal notice"}
                    </span>
                    <span style={{display: "block", fontSize: "15px", color: "#55696D"}}>
                      {"You, this week"}
                    </span>
                  </span>
                </span>
              </td>
            </tr>
            <tr style={{verticalAlign: "top"}}>
              <th scope="row" style={{padding: "16px 20px", textAlign: "left", borderTop: "1px solid #CFDCDA"}}>
                <span style={{display: "block", fontWeight: "600", color: "#163F42"}}>
                  {"Brother"}
                </span>
                <span style={{fontSize: "15px", fontWeight: "400", color: "#55696D"}}>
                  {"24"}
                </span>
              </th>
              <td style={{padding: "16px 20px", borderTop: "1px solid #CFDCDA"}}>
                {"On Papa's floater"}
              </td>
              <td style={{padding: "16px 20px", borderTop: "1px solid #CFDCDA"}}>
                <span style={{display: "flex", gap: "8px", alignItems: "flex-start"}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#163F42" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Known" style={{flex: "0 0 auto", marginTop: "4px"}}>
                    <polyline points="5 12.5 10 17 19 7"></polyline>
                  </svg>
                  <span>
                    {"Enrolled"}
                    <span style={{display: "block", fontSize: "15px", color: "#55696D"}}>
                      {"Floater schedule, page 1"}
                    </span>
                  </span>
                </span>
              </td>
              <td style={{padding: "16px 20px", borderTop: "1px solid #CFDCDA"}}>
                <span style={{display: "inline-flex", gap: "8px", alignItems: "center", padding: "4px 10px", borderRadius: "6px", background: "#FBF1DD", border: "1.5px dashed #7A5207", color: "#7A5207", fontWeight: "600", fontSize: "17px"}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9"></circle>
                    <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-0.7 0.3-1 0.8-1 1.5v0.4"></path>
                    <circle cx="12" cy="17" r="0.6" fill="currentColor"></circle>
                  </svg>
                  {"Schedule and your answer disagree"}
                </span>
                <span style={{display: "block", marginTop: "6px"}}>
                  {"Date of birth: 2001 on the schedule, 2002 from you"}
                </span>
              </td>
              <td style={{padding: "16px 20px", borderTop: "1px solid #CFDCDA"}}>
                <span style={{display: "flex", gap: "8px", alignItems: "flex-start"}}>
                  <span aria-hidden="true" style={{flex: "0 0 auto", marginTop: "6px", width: "12px", height: "12px", borderRadius: "50%", background: "#E0A02B"}}></span>
                  <span>
                    <span style={{display: "block", fontWeight: "600", color: "#163F42"}}>
                      {"Ask the insurer to correct the date of birth"}
                    </span>
                    <span style={{display: "block", fontSize: "15px", color: "#55696D"}}>
                      {"Papa, before the renewal"}
                    </span>
                  </span>
                </span>
                <button type="button" style={{minHeight: "44px", padding: "0 4px", marginLeft: "16px", border: "0", background: "transparent", font: "inherit", fontSize: "17px", fontWeight: "600", color: "#176F69", textDecoration: "underline", textUnderlineOffset: "0.2em", cursor: "pointer"}}>
                  {"Why?"}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p style={{margin: "0", fontSize: "17px", lineHeight: "1.45", color: "#55696D"}}>
          {"Every Known fact links to its page. Nothing here confirms a claim; only your insurer decides that."}
        </p>
      </main>
    </div>
    </>
  );
}
