// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import { type Any, css, truthy } from "@/lib/dc";

export function HouseholdControl({ v }: { v: Any }) {
  return (
    <>
    <section id="privacy" aria-labelledby="privacy-h" style={{position: "relative", overflow: "hidden", background: "#163F42", color: "#FFFFFF", padding: "clamp(72px,9vw,128px) clamp(20px,5vw,80px)"}}>
      <svg aria-hidden="true" viewBox="0 0 800 800" style={{position: "absolute", left: "-200px", bottom: "-260px", width: "760px", height: "760px", opacity: "0.08"}}>
        <circle cx="400" cy="400" r="290" fill="none" stroke="#C9DDD9" strokeWidth="3"></circle>
        <circle cx="400" cy="400" r="240" fill="none" stroke="#C9DDD9" strokeWidth="3"></circle>
        <circle cx="400" cy="400" r="190" fill="none" stroke="#C9DDD9" strokeWidth="3"></circle>
        <path d="M258 194v412M265 404l274 210M265 404l274-210" fill="none" stroke="#C9DDD9" strokeWidth="30" strokeLinecap="round"></path>
      </svg>
      {" "}
      <div style={{position: "relative", maxWidth: "1200px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "48px 72px", alignItems: "center"}}>
        <div style={{flex: "1 1 420px", display: "flex", flexDirection: "column", gap: "20px"}}>
          <h2 id="privacy-h" style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(34px,3.6vw,52px)", lineHeight: "1.08", letterSpacing: "-0.015em", color: "#FFFFFF", maxWidth: "14ch", textWrap: "balance"}}>
            {"Each person decides what family sees."}
          </h2>
          <p style={{margin: "0", fontSize: "clamp(19px,1.46vw,21px)", lineHeight: "1.5", color: "#C9DDD9", maxWidth: "44ch"}}>
            {"Share the cover amount with your family. Keep medical details to yourself. Change it whenever you like."}
          </p>
          <p style={{margin: "0", fontSize: "clamp(17px,1.35vw,19px)", lineHeight: "1.6", color: "#FFFFFF", maxWidth: "44ch"}}>
            {"Every adult controls their own record. "}
            <strong style={{fontWeight: "700"}}>
              {"Medical details are never shared by default."}
            </strong>
          </p>
        </div>
        <div style={{flex: "1 1 440px", background: "#FFFFFF", color: "#1A3034", borderRadius: "24px", padding: "clamp(24px,2.6vw,36px)", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 30px 60px rgba(0,0,0,0.25)"}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px"}}>
            <span style={{display: "inline-flex", alignItems: "center", height: "28px", padding: "0 10px", borderRadius: "6px", background: "#E6EFEC", color: "#163F42", fontSize: "15px", fontWeight: "600"}}>
              {"Example"}
            </span>
          </div>
          <div role="group" aria-label="Seen by" style={{display: "flex", padding: "4px", background: "#E6EFEC", borderRadius: "12px", gap: "4px"}}>
            <button type="button" onClick={v.viewYou} aria-pressed={v.isYouStr} style={css(v.segYouStyle)}>
              {"You"}
            </button>
            <button type="button" onClick={v.viewFamily} aria-pressed={v.isFamilyStr} style={css(v.segFamilyStyle)}>
              {"Your brother"}
            </button>
          </div>
          {truthy(v.isYou) && (
            <>
            <div style={{display: "flex", flexDirection: "column", gap: "6px"}}>
              <div style={{display: "flex", alignItems: "center", gap: "12px", animation: "kvSlideL 420ms cubic-bezier(0.165,0.84,0.44,1) both"}}>
                <span aria-hidden="true" style={{width: "40px", height: "40px", borderRadius: "50%", background: "#DDF0DC", color: "#0F4A3A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px", fontWeight: "700"}}>
                  {"You"}
                </span>
                <div>
                  <p style={{margin: "0", fontSize: "22px", fontWeight: "600", lineHeight: "1.3", color: "#163F42"}}>
                    {"What you see"}
                  </p>
                  <p style={{margin: "0", fontSize: "15px", color: "#2E6B4A", fontWeight: "600"}}>
                    {"Full access. It is your own record."}
                  </p>
                </div>
              </div>
              <dl style={{margin: "0", display: "flex", flexDirection: "column"}}>
                <div style={{display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "4px 16px", padding: "14px 0", borderBottom: "1px solid #CFDCDA", animation: "kvSlideL 420ms cubic-bezier(0.165,0.84,0.44,1) 80ms both"}}>
                  <dt style={{fontSize: "15px", fontWeight: "600", letterSpacing: "0.01em", color: "#55696D"}}>
                    {"Cover amount"}
                  </dt>
                  <dd style={{margin: "0", fontSize: "18px", lineHeight: "1.5"}}>
                    {"₹5,00,000 floater"}
                  </dd>
                </div>
                <div style={{display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "4px 16px", padding: "14px 0", borderBottom: "1px solid #CFDCDA", animation: "kvSlideL 420ms cubic-bezier(0.165,0.84,0.44,1) 160ms both"}}>
                  <dt style={{fontSize: "15px", fontWeight: "600", letterSpacing: "0.01em", color: "#55696D"}}>
                    {"Policy details"}
                  </dt>
                  <dd style={{margin: "0", fontSize: "18px", lineHeight: "1.5"}}>
                    {"Policy number, TPA, hospital desk contact"}
                  </dd>
                </div>
                <div style={{display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "4px 16px", padding: "14px 0", animation: "kvSlideL 420ms cubic-bezier(0.165,0.84,0.44,1) 240ms both"}}>
                  <dt style={{fontSize: "15px", fontWeight: "600", letterSpacing: "0.01em", color: "#55696D"}}>
                    {"Medical details"}
                  </dt>
                  <dd style={{margin: "0", fontSize: "18px", lineHeight: "1.5", display: "flex", alignItems: "center", gap: "8px"}}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2E6B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="5" y="11" width="14" height="9" rx="2"></rect>
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" style={{transformOrigin: "16px 11px", animation: "kvUnlock 600ms cubic-bezier(0.165,0.84,0.44,1) 420ms both"}}></path>
                    </svg>
                    <span style={{animation: "kvReveal 700ms cubic-bezier(0.165,0.84,0.44,1) 700ms both"}}>
                      {"Declared conditions, as on your proposal form"}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
            </>
          )}
          {truthy(v.isFamily) && (
            <>
            <div style={{display: "flex", flexDirection: "column", gap: "6px"}}>
              <div style={{display: "flex", alignItems: "center", gap: "12px", animation: "kvSlideR 420ms cubic-bezier(0.165,0.84,0.44,1) both"}}>
                <span aria-hidden="true" style={{width: "40px", height: "40px", borderRadius: "50%", background: "#CDEBE5", color: "#163F42", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: "700"}}>
                  {"Bro"}
                </span>
                <div>
                  <p style={{margin: "0", fontSize: "22px", fontWeight: "600", lineHeight: "1.3", color: "#163F42"}}>
                    {"What your brother sees"}
                  </p>
                  <p style={{margin: "0", fontSize: "15px", color: "#55696D", fontWeight: "600"}}>
                    {"Only what you chose to share."}
                  </p>
                </div>
              </div>
              <dl style={{margin: "0", display: "flex", flexDirection: "column"}}>
                <div style={{display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "4px 16px", padding: "14px 0", borderBottom: "1px solid #CFDCDA", animation: "kvSlideR 420ms cubic-bezier(0.165,0.84,0.44,1) 80ms both"}}>
                  <dt style={{fontSize: "15px", fontWeight: "600", letterSpacing: "0.01em", color: "#55696D"}}>
                    {"Cover amount"}
                  </dt>
                  <dd style={{margin: "0", fontSize: "18px", lineHeight: "1.5"}}>
                    {"₹5,00,000 floater"}
                  </dd>
                </div>
                <div style={{display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "4px 16px", padding: "14px 0", borderBottom: "1px solid #CFDCDA", animation: "kvSlideR 420ms cubic-bezier(0.165,0.84,0.44,1) 160ms both"}}>
                  <dt style={{fontSize: "15px", fontWeight: "600", letterSpacing: "0.01em", color: "#55696D"}}>
                    {"Policy details"}
                  </dt>
                  <dd style={{margin: "0", fontSize: "18px", lineHeight: "1.5"}}>
                    {"Policy number, TPA, hospital desk contact"}
                  </dd>
                </div>
                <div style={{display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "4px 16px", padding: "14px 0", animation: "kvSlideR 420ms cubic-bezier(0.165,0.84,0.44,1) 240ms both"}}>
                  <dt style={{fontSize: "15px", fontWeight: "600", letterSpacing: "0.01em", color: "#55696D"}}>
                    {"Medical details"}
                  </dt>
                  <dd style={{margin: "0", fontSize: "18px", lineHeight: "1.5", display: "flex", alignItems: "center", gap: "10px"}}>
                    <span style={{position: "relative", display: "inline-block"}}>
                      <span aria-hidden="true" style={{color: "#1A3034"}}>
                        {"Declared conditions"}
                      </span>
                      <span aria-hidden="true" style={{position: "absolute", left: "-4px", right: "-4px", top: "2px", bottom: "2px", borderRadius: "4px", background: "#163F42", transformOrigin: "left", animation: "kvRedact 520ms cubic-bezier(0.165,0.84,0.44,1) 450ms both"}}></span>
                    </span>
                    <span style={{display: "inline-flex", alignItems: "center", gap: "6px", color: "#55696D", fontWeight: "600", animation: "kvIn 360ms cubic-bezier(0.165,0.84,0.44,1) 1000ms both"}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{animation: "kvShake 400ms ease-in-out 1150ms both"}}>
                        <rect x="5" y="11" width="14" height="9" rx="2"></rect>
                        <path d="M8 11V8a4 4 0 0 1 8 0v3"></path>
                      </svg>
                      {"Not shared"}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
            </>
          )}
          <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5", color: "#55696D"}}>
            {"You can also set emergency access in advance, for a moment you cannot speak for yourself."}
          </p>
        </div>
      </div>
    </section>
    </>
  );
}
