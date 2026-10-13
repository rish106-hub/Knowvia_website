// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";
/* eslint-disable @next/next/no-img-element -- logos keep the design's fixed height with natural width */

import { type Any, css, truthy } from "@/lib/dc";

export function HeroSection({ v }: { v: Any }) {
  return (
    <>
    <section id="top" style={{position: "relative", overflow: "hidden", padding: "clamp(40px,6vw,88px) clamp(20px,5vw,80px) clamp(80px,9vw,128px)", background: "radial-gradient(1200px 600px at 85% 10%,#E3F0EE 0%,rgba(227,240,238,0) 60%),#F3F7F6"}}>
      <svg aria-hidden="true" viewBox="0 0 800 800" style={{position: "absolute", right: "-220px", top: "-160px", width: "900px", height: "900px", opacity: "0.06", pointerEvents: "none"}}>
        <path d="M258 194v412M265 404l274 210M265 404l274-210" fill="none" stroke="#163F42" strokeWidth="40" strokeLinecap="round"></path>
        <circle cx="400" cy="400" r="290" fill="none" stroke="#163F42" strokeWidth="4"></circle>
        <circle cx="400" cy="400" r="240" fill="none" stroke="#163F42" strokeWidth="4"></circle>
        <circle cx="400" cy="400" r="190" fill="none" stroke="#163F42" strokeWidth="4"></circle>
      </svg>
      {" "}
      <div style={{position: "relative", maxWidth: "1200px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "clamp(48px,5vw,64px)", alignItems: "center"}}>
        <div style={{flex: "1 1 500px", minWidth: "0", display: "flex", flexDirection: "column", gap: "24px", animation: "kvIn 600ms cubic-bezier(0.165,0.84,0.44,1) both"}}>
          <h1 style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(44px,5.4vw,78px)", lineHeight: "1.02", letterSpacing: "-0.02em", color: "#163F42", maxWidth: "13ch"}}>
            <span style={{backgroundImage: "linear-gradient(#C8E6A0,#C8E6A0)", backgroundRepeat: "no-repeat", backgroundPosition: "0 86%", backgroundSize: "100% 0.26em", animation: "kvMark 800ms cubic-bezier(0.165,0.84,0.44,1) 500ms both"}}>
              {"Health insurance"}
            </span>
            {", read before the hospital does."}
          </h1>
          <p style={{margin: "0", fontSize: "clamp(19px,1.5vw,22px)", lineHeight: "1.5", maxWidth: "46ch", color: "#1A3034"}}>
            {"Knowvia reads every health policy in your family: employer, personal and parents'. See what is covered, what is unclear, and what to do next."}
          </p>
          <ul aria-label="Health policies Knowvia reads" style={{listStyle: "none", margin: "4px 0 0", padding: "0", display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "6px"}}>
            <li style={{display: "flex", alignItems: "center", height: "40px", padding: "0 16px", borderRadius: "12px 12px 4px 4px", background: "#E3F0EE", borderBottom: "3px solid #163F42", fontSize: "15px", fontWeight: "600", color: "#163F42", transform: "translateY(0)", animation: "kvIn 500ms cubic-bezier(0.165,0.84,0.44,1) 700ms both"}}>
              {"Employer group cover"}
            </li>
            <li style={{display: "flex", alignItems: "center", height: "40px", padding: "0 16px", borderRadius: "12px 12px 4px 4px", background: "#DDF0DC", borderBottom: "3px solid #2E6B4A", fontSize: "15px", fontWeight: "600", color: "#0F4A3A", animation: "kvIn 500ms cubic-bezier(0.165,0.84,0.44,1) 800ms both"}}>
              {"Family floater"}
            </li>
            <li style={{display: "flex", alignItems: "center", height: "40px", padding: "0 16px", borderRadius: "12px 12px 4px 4px", background: "#CDEBE5", borderBottom: "3px solid #163F42", fontSize: "15px", fontWeight: "600", color: "#163F42", animation: "kvIn 500ms cubic-bezier(0.165,0.84,0.44,1) 900ms both"}}>
              {"Parents' policy"}
            </li>
            <li style={{display: "flex", alignItems: "center", height: "40px", padding: "0 16px", borderRadius: "12px 12px 4px 4px", background: "#FBF1DD", borderBottom: "3px solid #7A5207", fontSize: "15px", fontWeight: "600", color: "#7A5207", animation: "kvIn 500ms cubic-bezier(0.165,0.84,0.44,1) 1000ms both"}}>
              {"Super top-up"}
            </li>
          </ul>
          <div id="hero-form" style={{marginTop: "8px", maxWidth: "560px"}}>
            {truthy(v.hero.showForm) && (
              <>
              <form onSubmit={v.hero.submit} noValidate style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                <label htmlFor="hero-email" style={{fontSize: "15px", fontWeight: "600", letterSpacing: "0.01em", color: "#1A3034"}}>
                  {"Email"}
                </label>
                <div style={{display: "flex", flexWrap: "wrap", gap: "12px"}}>
                  <input id="hero-email" name="email" type="email" autoComplete="email" onChange={v.hero.setEmail} aria-invalid={v.hero.invalid} aria-describedby="hero-error hero-help" style={css(v.hero.inputStyle)} />
                  <button className="kv-btn kv-hero-btn" type="submit" aria-disabled={v.hero.busyStr} style={{flex: "0 0 auto", height: "56px", padding: "0 30px", border: "0", borderRadius: "999px", background: "#176F69", color: "#FFFFFF", font: "inherit", fontSize: "17px", fontWeight: "600", letterSpacing: "0.005em", whiteSpace: "nowrap", cursor: "pointer"}}>
                    {v.hero.buttonLabel}
                  </button>
                </div>
                {truthy(v.hero.busy) && (
                  <>
                  <div aria-hidden="true" style={{height: "3px", borderRadius: "3px", background: "linear-gradient(90deg,#E6EFEC,#176F69,#E6EFEC)", backgroundSize: "200% 100%", animation: "kvLoad 1.2s linear infinite"}}></div>
                  </>
                )}
                <p id="hero-error" role="alert" style={{margin: "0", color: "#A74335", fontSize: "17px", lineHeight: "1.45", fontWeight: "600"}}>
                  {v.hero.error}
                </p>
                <p id="hero-help" style={{margin: "0", fontSize: "clamp(17px,1.35vw,19px)", lineHeight: "1.5", color: "#55696D"}}>
                  {"Knowvia is not open yet. We will email you the day it is."}
                </p>
              </form>
              </>
            )}
            {" "}
            {truthy(v.hero.showSuccess) && (
              <>
              <div role="status" style={{background: "#FFFFFF", borderRadius: "16px", padding: "24px 28px", border: "1px solid #CFDCDA", animation: "kvIn 420ms cubic-bezier(0.165,0.84,0.44,1) both", display: "flex", flexDirection: "column", gap: "8px"}}>
                <p style={{margin: "0", fontSize: "22px", fontWeight: "600", lineHeight: "1.3", color: "#163F42"}}>
                  {"You are on the list."}
                </p>
                <p style={{margin: "0", fontSize: "17px", lineHeight: "1.6"}}>
                  {"We will email "}{v.hero.emailShown}{" when Knowvia opens. While you wait, find your policy schedule and your employer's benefits booklet."}
                </p>
              </div>
              </>
            )}
            {" "}
            <div style={{marginTop: "28px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px 24px"}}>
              <span style={{fontSize: "15px", fontWeight: "600", color: "#55696D"}}>
                {"Supported by"}
              </span>
              <img src="/logos/lightspeed.png" alt="Lightspeed" style={{height: "26px", width: "auto", display: "block"}} />
              <span aria-hidden="true" style={{width: "1px", height: "28px", background: "#CFDCDA"}}></span>
              <img src="/logos/insurance-samadhan.png" alt="Insurance Samadhan" style={{height: "32px", width: "auto", display: "block"}} />
            </div>
          </div>
        </div>
        <div className="kv-hero-art kv-overhang" role="group" aria-label="Example: Knowvia reading a health top-up quote" style={{flex: "1 1 480px", minWidth: "min(100%,330px)", position: "relative", minHeight: "600px"}}>
          <div aria-hidden="true" style={{position: "absolute", right: "0", top: "0", width: "min(78%,380px)", background: "#FFFFFF", borderRadius: "18px", padding: "26px 26px 30px", boxShadow: "0 30px 60px rgba(22,62,54,0.14)", transform: "rotate(3deg)", animation: "kvPage 700ms cubic-bezier(0.165,0.84,0.44,1) 100ms both", display: "flex", flexDirection: "column", gap: "14px"}}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "baseline"}}>
              <span style={{fontSize: "13px", fontWeight: "700", letterSpacing: "0.02em", color: "#55696D"}}>
                {"SUPER TOP-UP QUOTE"}
              </span>
              <span style={{fontSize: "13px", color: "#55696D"}}>
                {"Page 1 of 6"}
              </span>
            </div>
            <span style={{display: "block", height: "10px", width: "70%", borderRadius: "4px", background: "#E6EFEC"}}></span>
            <div style={{display: "flex", justifyContent: "space-between", fontSize: "16px", padding: "8px 0", borderBottom: "1px solid #E6EFEC"}}>
              <span style={{color: "#55696D"}}>
                {"Sum insured"}
              </span>
              <span style={{fontWeight: "600"}}>
                {"₹20,00,000"}
              </span>
            </div>
            <div style={{display: "flex", justifyContent: "space-between", fontSize: "16px", padding: "8px 6px", margin: "0 -6px", borderRadius: "6px", backgroundImage: "linear-gradient(#F6D38A,#F6D38A)", backgroundRepeat: "no-repeat", backgroundSize: "100% 100%", animation: "kvHighlight 700ms cubic-bezier(0.165,0.84,0.44,1) 900ms both"}}>
              <span style={{color: "#1A3034"}}>
                {"Deductible"}
              </span>
              <span style={{fontWeight: "700", color: "#163F42"}}>
                {"₹10,00,000"}
              </span>
            </div>
            <div style={{display: "flex", justifyContent: "space-between", fontSize: "16px", padding: "8px 0", borderBottom: "1px solid #E6EFEC"}}>
              <span style={{color: "#55696D"}}>
                {"Annual premium"}
              </span>
              <span style={{fontWeight: "600"}}>
                {"₹9,400"}
              </span>
            </div>
            <span style={{display: "block", height: "8px", width: "92%", borderRadius: "4px", background: "#E6EFEC"}}></span>
            <span style={{display: "block", height: "8px", width: "84%", borderRadius: "4px", background: "#E6EFEC"}}></span>
            <span style={{display: "block", height: "8px", width: "60%", borderRadius: "4px", background: "#E6EFEC"}}></span>
          </div>
          {" "}
          <div style={{position: "absolute", left: "0", bottom: "0", width: "min(92%,420px)", background: "#FFFFFF", borderRadius: "24px", padding: "24px 26px", boxShadow: "0 18px 50px rgba(22,62,54,0.16)", display: "flex", flexDirection: "column", gap: "16px", animation: "kvIn 600ms cubic-bezier(0.165,0.84,0.44,1) 300ms both"}}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px"}}>
              <span style={{display: "inline-flex", alignItems: "center", height: "26px", padding: "0 10px", borderRadius: "6px", background: "#E6EFEC", color: "#163F42", fontSize: "14px", fontWeight: "600"}}>
                {"Example"}
              </span>
              <span style={{fontSize: "15px", color: "#55696D"}}>
                {"2 documents read"}
              </span>
            </div>
            <p style={{margin: "0", fontSize: "20px", fontWeight: "600", lineHeight: "1.3", color: "#163F42"}}>
              {"A top-up quote, read before paying"}
            </p>
            <div style={{position: "relative", paddingLeft: "32px", display: "flex", flexDirection: "column", gap: "14px"}}>
              <div aria-hidden="true" style={{position: "absolute", left: "7px", top: "8px", bottom: "18px", width: "2px", background: "#163F42", transformOrigin: "top", animation: "kvLine 1500ms cubic-bezier(0.165,0.84,0.44,1) 700ms both"}}></div>
              <div style={{position: "relative", display: "flex", flexDirection: "column", gap: "4px", animation: "kvIn 420ms cubic-bezier(0.165,0.84,0.44,1) 800ms both"}}>
                <span aria-hidden="true" style={{position: "absolute", left: "-30px", top: "6px", width: "12px", height: "12px", borderRadius: "50%", background: "#FFFFFF", border: "2px solid #163F42", boxSizing: "border-box"}}></span>
                <span style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px", height: "26px", padding: "0 9px", borderRadius: "6px", background: "#E3F0EE", color: "#163F42", fontSize: "14px", fontWeight: "600"}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="5 12.5 10 17 19 7"></polyline>
                  </svg>
                  {"Known"}
                </span>
                <p style={{margin: "0", fontSize: "18px", lineHeight: "1.45"}}>
                  {"Your base cover is ₹8,00,000"}
                </p>
              </div>
              <div style={{position: "relative", display: "flex", flexDirection: "column", gap: "4px", animation: "kvIn 420ms cubic-bezier(0.165,0.84,0.44,1) 1100ms both"}}>
                <span aria-hidden="true" style={{position: "absolute", left: "-30px", top: "6px", width: "12px", height: "12px", borderRadius: "50%", background: "#FFFFFF", border: "2px solid #163F42", boxSizing: "border-box"}}></span>
                <span style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px", height: "26px", padding: "0 9px", borderRadius: "6px", background: "#E3F0EE", color: "#163F42", fontSize: "14px", fontWeight: "600"}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="5 12.5 10 17 19 7"></polyline>
                  </svg>
                  {"Known"}
                </span>
                <p style={{margin: "0", fontSize: "18px", lineHeight: "1.45"}}>
                  {"The top-up pays only after ₹10,00,000"}
                </p>
              </div>
              <div style={{position: "relative", display: "flex", flexDirection: "column", gap: "4px", animation: "kvIn 420ms cubic-bezier(0.165,0.84,0.44,1) 1400ms both"}}>
                <span aria-hidden="true" style={{position: "absolute", left: "-30px", top: "6px", width: "12px", height: "12px", borderRadius: "50%", background: "#FFFFFF", border: "2px dashed #7A5207", boxSizing: "border-box"}}></span>
                <span style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px", height: "26px", padding: "0 9px", borderRadius: "6px", background: "#FBF1DD", color: "#7A5207", border: "1.5px dashed #7A5207", boxSizing: "border-box", fontSize: "14px", fontWeight: "600"}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9"></circle>
                    <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-0.7 0.3-1 0.8-1 1.5v0.4"></path>
                  </svg>
                  {"Not confirmed"}
                </span>
                <p style={{margin: "0", fontSize: "18px", lineHeight: "1.45"}}>
                  {"Room-rent limit in your base policy"}
                </p>
              </div>
              <div style={{position: "relative", display: "flex", flexDirection: "column", gap: "4px", animation: "kvIn 420ms cubic-bezier(0.165,0.84,0.44,1) 1700ms both"}}>
                <span aria-hidden="true" style={{position: "absolute", left: "-33px", top: "4px", width: "16px", height: "16px", borderRadius: "50%", background: "#E0A02B", boxShadow: "0 0 0 4px #FFFFFF", animation: "kvDrop 400ms cubic-bezier(0.165,0.84,0.44,1) 2000ms both"}}></span>
                <span style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px", height: "26px", padding: "0 9px", borderRadius: "6px", background: "#163F42", color: "#FFFFFF", fontSize: "14px", fontWeight: "600"}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14"></path>
                    <path d="M13 6l6 6-6 6"></path>
                  </svg>
                  {"Next"}
                </span>
                <p style={{margin: "0", fontSize: "18px", lineHeight: "1.45", fontWeight: "600", color: "#163F42"}}>
                  {"Before you pay ₹9,400, ask about the ₹2,00,000 gap."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
