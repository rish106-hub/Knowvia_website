// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";
/* eslint-disable @next/next/no-img-element -- logos keep the design's fixed height with natural width */

import { type Any, css, truthy } from "@/lib/dc";

export function HeroSection({ v }: { v: Any }) {
  return (
    <>
    <section id="top" style={{position: "relative", overflow: "hidden", padding: "clamp(48px,6vw,96px) clamp(20px,5vw,80px) clamp(64px,8vw,112px)", background: "radial-gradient(1200px 600px at 85% 10%,#E3F0EE 0%,rgba(227,240,238,0) 60%),#F3F7F6"}}>
      <svg aria-hidden="true" viewBox="0 0 800 800" style={{position: "absolute", right: "-220px", top: "-160px", width: "900px", height: "900px", opacity: "0.06", pointerEvents: "none"}}>
        <path d="M258 194v412M265 404l274 210M265 404l274-210" fill="none" stroke="#163F42" strokeWidth="40" strokeLinecap="round"></path>
        <circle cx="400" cy="400" r="290" fill="none" stroke="#163F42" strokeWidth="4"></circle>
        <circle cx="400" cy="400" r="240" fill="none" stroke="#163F42" strokeWidth="4"></circle>
        <circle cx="400" cy="400" r="190" fill="none" stroke="#163F42" strokeWidth="4"></circle>
      </svg>
      {" "}
      <div style={{position: "relative", maxWidth: "1200px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "clamp(48px,6vw,96px)", alignItems: "center"}}>
        <div style={{flex: "1.15 1 500px", minWidth: "0", display: "flex", flexDirection: "column", gap: "22px", animation: "kvIn 600ms cubic-bezier(0.165,0.84,0.44,1) both"}}>
          <h1 style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(40px,4.4vw,64px)", lineHeight: "1.05", letterSpacing: "-0.02em", color: "#163F42", maxWidth: "15ch", textWrap: "balance"}}>
            <span style={{backgroundImage: "linear-gradient(#C8E6A0,#C8E6A0)", backgroundRepeat: "no-repeat", backgroundPosition: "0 86%", backgroundSize: "100% 0.26em", animation: "kvMark 800ms cubic-bezier(0.165,0.84,0.44,1) 500ms both"}}>
              {"Health insurance"}
            </span>
            {", read before the hospital does."}
          </h1>
          <p style={{margin: "0", fontSize: "clamp(18px,1.4vw,21px)", lineHeight: "1.5", maxWidth: "40ch", color: "#55696D"}}>
            {"Every policy in your family, read person by person: what is covered, what is unclear, what to do next."}
          </p>
          <div id="hero-form" style={{marginTop: "6px", maxWidth: "540px"}}>
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
                <p id="hero-help" style={{margin: "0", fontSize: "16px", lineHeight: "1.5", color: "#55696D"}}>
                  {"Knowvia is not open yet. One email the day it is. Nothing before."}
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
        <div className="kv-hero-art" role="group" aria-label="Example: what Knowvia shows for one family policy" style={{flex: "1 1 400px", minWidth: "min(100%,320px)", display: "flex", justifyContent: "center"}}>
          <div style={{width: "100%", maxWidth: "440px", background: "#FFFFFF", borderRadius: "24px", padding: "clamp(24px,2.6vw,32px)", boxShadow: "0 0 0 1px #CFDCDA,0 30px 60px rgba(22,62,54,0.14)", display: "flex", flexDirection: "column", animation: "kvIn 700ms cubic-bezier(0.165,0.84,0.44,1) 200ms both"}}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px", paddingBottom: "18px"}}>
              <p style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "24px", lineHeight: "1.2", color: "#163F42"}}>
                {"Your family floater, read"}
              </p>
              <span style={{flex: "0 0 auto", display: "inline-flex", alignItems: "center", height: "26px", padding: "0 10px", borderRadius: "6px", background: "#E6EFEC", color: "#163F42", fontSize: "14px", fontWeight: "600"}}>
                {"Example"}
              </span>
            </div>
            <div style={{display: "flex", gap: "18px", alignItems: "center", padding: "18px 0", borderTop: "1px solid #E6EFEC", animation: "kvIn 420ms cubic-bezier(0.165,0.84,0.44,1) 500ms both"}}>
              <span aria-hidden="true" style={{flex: "0 0 auto", width: "52px", height: "52px", borderRadius: "50%", background: "#C8E6A0", color: "#0F4A3A", display: "flex", alignItems: "center", justifyContent: "center", animation: "kvPop 420ms cubic-bezier(0.165,0.84,0.44,1) 650ms both"}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="5 12.5 10 17 19 7"></polyline>
                </svg>
              </span>
              <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
                <p style={{margin: "0", fontSize: "19px", fontWeight: "600", lineHeight: "1.3", color: "#163F42"}}>
                  {"Every answer shows its page"}
                </p>
                <p style={{margin: "0", fontSize: "16px", lineHeight: "1.45", color: "#55696D"}}>
                  {"Page 2, line 4: sum insured ₹5,00,000"}
                </p>
              </div>
            </div>
            <div style={{display: "flex", gap: "18px", alignItems: "center", padding: "18px 0", borderTop: "1px solid #E6EFEC", animation: "kvIn 420ms cubic-bezier(0.165,0.84,0.44,1) 800ms both"}}>
              <span aria-hidden="true" style={{flex: "0 0 auto", width: "52px", height: "52px", borderRadius: "50%", background: "#C8E6A0", color: "#0F4A3A", display: "flex", alignItems: "center", justifyContent: "center", animation: "kvPop 420ms cubic-bezier(0.165,0.84,0.44,1) 950ms both"}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="5 12.5 10 17 19 7"></polyline>
                </svg>
              </span>
              <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
                <p style={{margin: "0", fontSize: "19px", fontWeight: "600", lineHeight: "1.3", color: "#163F42"}}>
                  {"Gaps are marked, never guessed"}
                </p>
                <p style={{margin: "0", fontSize: "16px", lineHeight: "1.45", color: "#55696D"}}>
                  {"Room-rent limit: "}
                  <span style={{fontWeight: "700", color: "#7A5207"}}>
                    {"Not confirmed"}
                  </span>
                </p>
              </div>
            </div>
            <div style={{display: "flex", gap: "18px", alignItems: "center", padding: "18px 0 4px", borderTop: "1px solid #E6EFEC", animation: "kvIn 420ms cubic-bezier(0.165,0.84,0.44,1) 1100ms both"}}>
              <span aria-hidden="true" style={{flex: "0 0 auto", width: "52px", height: "52px", borderRadius: "50%", background: "#C8E6A0", color: "#0F4A3A", display: "flex", alignItems: "center", justifyContent: "center", animation: "kvPop 420ms cubic-bezier(0.165,0.84,0.44,1) 1250ms both"}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="5 12.5 10 17 19 7"></polyline>
                </svg>
              </span>
              <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
                <p style={{margin: "0", fontSize: "19px", fontWeight: "600", lineHeight: "1.3", color: "#163F42"}}>
                  {"Nothing to buy, nothing sold"}
                </p>
                <p style={{margin: "0", fontSize: "16px", lineHeight: "1.45", color: "#55696D"}}>
                  {"Not an insurer, broker or TPA"}
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
