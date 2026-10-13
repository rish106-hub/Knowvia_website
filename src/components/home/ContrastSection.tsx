// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import { Fragment } from "react";
import { type Any } from "@/lib/dc";

export function ContrastSection({ v }: { v: Any }) {
  return (
    <>
    <section aria-labelledby="contrast-h" style={{background: "#FFFFFF", padding: "clamp(72px,9vw,128px) clamp(20px,5vw,80px)"}}>
      <div style={{maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "48px"}}>
        <div style={{display: "flex", flexDirection: "column", gap: "16px", maxWidth: "720px"}}>
          <h2 id="contrast-h" style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(34px,3.6vw,52px)", lineHeight: "1.08", letterSpacing: "-0.015em", color: "#163F42", maxWidth: "16ch", textWrap: "balance"}}>
            {"Stop finding out at the hospital desk."}
          </h2>
          <p style={{margin: "0", fontSize: "clamp(19px,1.46vw,21px)", lineHeight: "1.5"}}>
            {"The same five moments, two ways."}
          </p>
        </div>
        <div style={{display: "flex", flexWrap: "wrap", gap: "24px"}}>
          <div className="kv-rise" style={{flex: "1 1 440px", background: "#F3F7F6", borderRadius: "24px", padding: "clamp(24px,3vw,40px)", display: "flex", flexDirection: "column", gap: "6px"}}>
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "12px"}}>
              <p style={{margin: "0", fontSize: "22px", fontWeight: "600", color: "#55696D"}}>
                {"At the hospital desk"}
              </p>
              <span style={{fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "32px", color: "#55696D"}}>
                {"2 a.m."}
              </span>
            </div>
            {(v.oldWay ?? []).map((r: Any, i1: number) => (
              <Fragment key={i1}>
                <div style={{display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 0", borderTop: "1px solid #CFDCDA"}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#55696D" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" style={{flex: "0 0 auto", marginTop: "4px"}}>
                    <path d="M6 6l12 12M18 6L6 18"></path>
                  </svg>
                  <p style={{margin: "0", fontSize: "clamp(17px,1.35vw,19px)", lineHeight: "1.5", color: "#55696D"}}>
                    <span style={{fontWeight: "600"}}>
                      {r.moment}{"."}
                    </span>
                    {" "}{r.text}
                  </p>
                </div>
              </Fragment>
            ))}
          </div>
          <div className="kv-rise kv-win" style={{flex: "1 1 440px", position: "relative", top: "-20px", background: "#0F4A3A", color: "#FFFFFF", borderRadius: "28px", padding: "clamp(28px,3.2vw,44px)", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "0 0 0 1px rgba(200,230,160,0.35),0 34px 80px rgba(15,74,58,0.34),0 10px 24px rgba(15,74,58,0.18)"}}>
            <p style={{position: "absolute", top: "-17px", left: "clamp(28px,3.2vw,44px)", margin: "0", display: "inline-flex", alignItems: "center", gap: "10px", height: "34px", padding: "0 16px 0 12px", borderRadius: "999px", background: "#C8E6A0", color: "#0F4A3A", fontSize: "15px", fontWeight: "700", letterSpacing: "0.01em", boxShadow: "0 8px 20px rgba(15,74,58,0.22)"}}>
              <span aria-hidden="true" style={{position: "relative", display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: "#0F4A3A"}}>
                <span style={{position: "absolute", inset: "0", borderRadius: "50%", background: "#0F4A3A", animation: "kvPulse 1.8s ease-out infinite"}}></span>
              </span>
              {"The better way"}
            </p>
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", margin: "8px 0 12px"}}>
              <p style={{margin: "0", fontSize: "22px", fontWeight: "600", color: "#FFFFFF"}}>
                {"With Knowvia"}
              </p>
              <span style={{fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "32px", color: "#C8E6A0"}}>
                {"Any calm day"}
              </span>
            </div>
            {(v.newWay ?? []).map((r: Any, i2: number) => (
              <Fragment key={i2}>
                <div style={{display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.16)"}}>
                  <span aria-hidden="true" style={{flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "26px", height: "26px", marginTop: "1px", borderRadius: "50%", background: "#C8E6A0"}}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0F4A3A" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="5 12.5 10 17 19 7"></polyline>
                    </svg>
                  </span>
                  <p style={{margin: "0", fontSize: "clamp(17px,1.35vw,19px)", lineHeight: "1.5", color: "#E6F2EE"}}>
                    <span style={{fontWeight: "600", color: "#FFFFFF"}}>
                      {r.moment}{"."}
                    </span>
                    {" "}{r.text}
                  </p>
                </div>
              </Fragment>
            ))}
            <div style={{marginTop: "14px", paddingTop: "24px", borderTop: "1px solid rgba(200,230,160,0.45)", display: "flex", flexDirection: "column", gap: "18px"}}>
              <p style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "clamp(24px,2vw,28px)", lineHeight: "1.2", color: "#FFFFFF", maxWidth: "24ch"}}>
                {"Walk in already knowing your limits, your gaps and your next step."}
              </p>
              <div style={{display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px 24px"}}>
                <a className="kv-light" href="#early-list" style={{display: "inline-flex", alignItems: "center", height: "52px", padding: "0 26px", borderRadius: "999px", background: "#FFFFFF", color: "#176F69", fontSize: "17px", fontWeight: "600", textDecoration: "none", whiteSpace: "nowrap"}}>
                  {"Join the early list"}
                </a>
                <a className="kv-light-link" href="#partners" style={{fontSize: "16px", fontWeight: "600", color: "#FFFFFF", textUnderlineOffset: "4px"}}>
                  {"Run an HR or insurance platform? Partner with us"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
