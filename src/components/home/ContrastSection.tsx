// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import { Fragment } from "react";
import { type Any } from "@/lib/dc";

export function ContrastSection({ v }: { v: Any }) {
  return (
    <>
    <section aria-labelledby="contrast-h" style={{background: "#FFFFFF", padding: "clamp(72px,9vw,128px) clamp(20px,5vw,80px)"}}>
      <div style={{maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(40px,4vw,56px)"}}>
        <div style={{display: "flex", flexDirection: "column", gap: "16px", maxWidth: "720px"}}>
          <h2 id="contrast-h" style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(34px,3.6vw,52px)", lineHeight: "1.08", letterSpacing: "-0.015em", color: "#163F42", maxWidth: "16ch", textWrap: "balance"}}>
            {"Stop finding out at the hospital desk."}
          </h2>
          <p style={{margin: "0", fontSize: "clamp(18px,1.45vw,21px)", lineHeight: "1.5", color: "#55696D"}}>
            {"The same five moments, two ways."}
          </p>
        </div>
        <div className="kv-cmp">
          <div className="kv-cmp-row kv-cmp-head">
            <span className="kv-cmp-moment" aria-hidden="true"></span>
            {" "}
            <div className="kv-cmp-old" style={{display: "flex", flexDirection: "column", gap: "2px", padding: "0 24px 18px 0", alignSelf: "end"}}>
              <span style={{fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "30px", lineHeight: "1.1", color: "#55696D"}}>
                {"2 a.m."}
              </span>
              <p style={{margin: "0", fontSize: "18px", fontWeight: "600", color: "#55696D"}}>
                {"At the hospital desk"}
              </p>
            </div>
            {" "}
            <div className="kv-cmp-new kv-cmp-top" style={{position: "relative", display: "flex", flexDirection: "column", gap: "2px", padding: "40px clamp(24px,2.6vw,36px) 18px", background: "#0F4A3A", borderRadius: "24px 24px 0 0", color: "#FFFFFF"}}>
              <p style={{position: "absolute", top: "-17px", left: "clamp(24px,2.6vw,36px)", margin: "0", display: "inline-flex", alignItems: "center", gap: "10px", height: "34px", padding: "0 16px 0 12px", borderRadius: "999px", background: "#C8E6A0", color: "#0F4A3A", fontSize: "15px", fontWeight: "700", letterSpacing: "0.01em", boxShadow: "0 8px 20px rgba(15,74,58,0.22)"}}>
                <span aria-hidden="true" style={{position: "relative", display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: "#0F4A3A"}}>
                  <span style={{position: "absolute", inset: "0", borderRadius: "50%", background: "#0F4A3A", animation: "kvPulse 1.8s ease-out infinite"}}></span>
                </span>
                {"The better way"}
              </p>
              <span style={{fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "30px", lineHeight: "1.1", color: "#C8E6A0"}}>
                {"Any calm day"}
              </span>
              <p style={{margin: "0", fontSize: "18px", fontWeight: "600", color: "#FFFFFF"}}>
                {"With Knowvia"}
              </p>
            </div>
          </div>
          {" "}
          {(v.ways ?? []).map((r: Any, i1: number) => (
            <Fragment key={i1}>
              <div className="kv-cmp-row kv-rise">
                <p className="kv-cmp-moment" style={{margin: "0", padding: "22px 16px 22px 0", borderTop: "1px solid #CFDCDA", fontSize: "18px", fontWeight: "700", lineHeight: "1.4", color: "#163F42"}}>
                  {r.moment}
                </p>
                {" "}
                <div className="kv-cmp-old" style={{display: "flex", gap: "12px", alignItems: "flex-start", padding: "22px 24px 22px 0", borderTop: "1px solid #CFDCDA"}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7B918E" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" style={{flex: "0 0 auto", marginTop: "4px"}}>
                    <path d="M6 6l12 12M18 6L6 18"></path>
                  </svg>
                  <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5", color: "#55696D"}}>
                    <span className="kv-cmp-tag">
                      {"At the desk: "}
                    </span>
                    {r.old}
                  </p>
                </div>
                {" "}
                <div className="kv-cmp-new" style={{display: "flex", gap: "12px", alignItems: "flex-start", padding: "22px clamp(24px,2.6vw,36px)", background: "#0F4A3A", borderTop: "1px solid rgba(255,255,255,0.14)"}}>
                  <span aria-hidden="true" style={{flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "26px", height: "26px", borderRadius: "50%", background: "#C8E6A0"}}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0F4A3A" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="5 12.5 10 17 19 7"></polyline>
                    </svg>
                  </span>
                  <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5", color: "#FFFFFF"}}>
                    <span className="kv-cmp-tag" style={{color: "#C8E6A0"}}>
                      {"With Knowvia: "}
                    </span>
                    {r.new}
                  </p>
                </div>
              </div>
            </Fragment>
          ))}
          {" "}
          <div className="kv-cmp-row">
            <span className="kv-cmp-moment" aria-hidden="true"></span>
            {" "}
            <span className="kv-cmp-old" aria-hidden="true"></span>
            {" "}
            <div className="kv-cmp-new kv-cmp-end" style={{display: "flex", flexDirection: "column", gap: "18px", padding: "26px clamp(24px,2.6vw,36px) clamp(28px,3vw,36px)", background: "#0F4A3A", borderTop: "1px solid rgba(200,230,160,0.45)", borderRadius: "0 0 24px 24px", boxShadow: "0 34px 60px rgba(15,74,58,0.22)"}}>
              <p style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "clamp(22px,1.9vw,26px)", lineHeight: "1.2", color: "#FFFFFF", maxWidth: "24ch"}}>
                {"Walk in already knowing your limits, your gaps and your next step."}
              </p>
              <div style={{display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px 24px"}}>
                <a className="kv-light" href="#early-list" style={{display: "inline-flex", alignItems: "center", height: "52px", padding: "0 26px", borderRadius: "999px", background: "#FFFFFF", color: "#176F69", fontSize: "17px", fontWeight: "600", textDecoration: "none", whiteSpace: "nowrap"}}>
                  {"Join the early list"}
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
