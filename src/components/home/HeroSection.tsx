// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";
/* eslint-disable @next/next/no-img-element -- logos keep the design's fixed height with natural width */

import { type Any, css, truthy } from "@/lib/dc";

export function HeroSection({ v }: { v: Any }) {
  return (
    <>
    <section id="top" style={{padding: "clamp(40px,6vw,80px) clamp(20px,5vw,80px) clamp(72px,8vw,104px)", background: "radial-gradient(900px 500px at 88% 12%,#E3F0EE 0%,rgba(227,240,238,0) 62%),#F3F7F6"}}>
      <div style={{maxWidth: "1200px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "clamp(40px,5vw,72px)", alignItems: "center"}}>
        <div className="kv-hero-copy" style={{flex: "1 1 500px", display: "flex", flexDirection: "column", gap: "22px"}}>
          <h1 style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(42px,4.7vw,68px)", lineHeight: "1.02", letterSpacing: "-0.02em", color: "#163F42", maxWidth: "13ch"}}>
            {"Know your health cover before you need it."}
          </h1>
          <p style={{margin: "0", fontSize: "clamp(18px,1.45vw,21px)", lineHeight: "1.55", maxWidth: "48ch"}}>
            {"Knowvia reads the health policies your family already has. It shows what is covered, what is unclear, and the page that proves it."}
          </p>
          <div id="hero-form" style={{marginTop: "6px", maxWidth: "560px"}}>
            {truthy(v.hero.showForm) && (
              <>
              <form onSubmit={v.hero.submit} noValidate style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                <label htmlFor="hero-email" style={{fontSize: "15px", fontWeight: "600"}}>
                  {"Email (required)"}
                </label>
                <div style={{display: "flex", flexWrap: "wrap", gap: "12px"}}>
                  <input id="hero-email" name="email" type="email" required autoComplete="email" onChange={v.hero.setEmail} aria-invalid={v.hero.invalid} aria-describedby="hero-error hero-help" style={css(v.hero.inputStyle)} />
                  <button className="kv-btn kv-hero-btn" type="submit" aria-disabled={v.hero.busyStr} style={{height: "56px", padding: "0 30px", border: "0", borderRadius: "999px", background: "#176F69", color: "#FFFFFF", font: "inherit", fontSize: "17px", fontWeight: "600", cursor: "pointer"}}>
                    {v.hero.buttonLabel}
                  </button>
                </div>
                <p id="hero-error" role="alert" style={{margin: "0", color: "#A74335", fontSize: "17px", fontWeight: "600"}}>
                  {v.hero.error}
                </p>
                <p id="hero-help" style={{margin: "0", fontSize: "16px", color: "#55696D"}}>
                  {"Knowvia is not open yet. We will email you the day it is."}
                </p>
              </form>
              </>
            )}
            {" "}
            {truthy(v.hero.showSuccess) && (
              <>
              <div role="status" style={{background: "#FFFFFF", borderRadius: "16px", padding: "24px", border: "1px solid #CFDCDA"}}>
                <p style={{margin: "0", fontSize: "22px", fontWeight: "600"}}>
                  {"You are on the list."}
                </p>
                <p style={{margin: "8px 0 0", fontSize: "17px"}}>
                  {"We will email "}{v.hero.emailShown}{" when Knowvia opens."}
                </p>
              </div>
              </>
            )}
          </div>
          <div style={{marginTop: "20px", display: "flex", alignItems: "center", gap: "12px 20px", opacity: "0.65"}}>
            <span style={{fontSize: "14px", fontWeight: "600"}}>
              {"Supported by"}
            </span>
            <img src="/logos/lightspeed.png" alt="Lightspeed" style={{height: "22px", width: "auto"}} />
            <span aria-hidden="true" style={{width: "1px", height: "24px", background: "#7B918E"}}></span>
            <img src="/logos/insurance-samadhan.png" alt="Insurance Samadhan" style={{height: "27px", width: "auto"}} />
          </div>
        </div>
        <article className="kv-proof-card" aria-label="Example policy proof" style={{flex: "1 1 420px", background: "#FFFFFF", border: "1px solid #CFDCDA", borderRadius: "24px", padding: "clamp(24px,3vw,38px)", boxShadow: "0 24px 60px rgba(22,62,54,0.12)"}}>
          <div style={{display: "flex", justifyContent: "space-between", gap: "16px", paddingBottom: "18px", borderBottom: "1px solid #CFDCDA"}}>
            <p style={{margin: "0", fontSize: "20px", fontWeight: "600"}}>
              {"A top-up quote, checked"}
            </p>
            <span style={{fontSize: "14px", color: "#55696D"}}>
              {"Example"}
            </span>
          </div>
          {" "}
          <div className="kv-proof-row" style={{padding: "20px 0", borderBottom: "1px solid #E6EFEC"}}>
            <strong style={{display: "inline-block", padding: "4px 9px", borderRadius: "6px", background: "#E3F0EE", color: "#163F42"}}>
              {"Known"}
            </strong>
            <p style={{margin: "8px 0 0", fontSize: "18px", lineHeight: "1.5"}}>
              {"Sum insured ₹20,00,000, Super top-up quote, page 1."}
            </p>
          </div>
          {" "}
          <div className="kv-proof-row" style={{padding: "20px 0", borderBottom: "1px solid #E6EFEC"}}>
            <strong style={{display: "inline-block", padding: "4px 9px", borderRadius: "6px", background: "#FBF1DD", color: "#7A5207"}}>
              {"Not confirmed"}
            </strong>
            <p style={{margin: "8px 0 0", fontSize: "18px", lineHeight: "1.5"}}>
              {"Room-rent limit, check the base policy."}
            </p>
          </div>
          {" "}
          <div className="kv-proof-row" style={{padding: "20px 0 0"}}>
            <strong style={{display: "inline-block", padding: "4px 9px", borderRadius: "6px", background: "#163F42", color: "#FFFFFF"}}>
              {"Next"}
            </strong>
            <p style={{margin: "8px 0 0", fontSize: "18px", lineHeight: "1.5", fontWeight: "600"}}>
              {"Ask about the ₹2,00,000 gap before paying."}
            </p>
          </div>
        </article>
      </div>
    </section>
    </>
  );
}
