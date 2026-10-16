// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";
/* eslint-disable @next/next/no-img-element -- logos keep the design's fixed height with natural width */

import { Fragment } from "react";
import { type Any, css } from "@/lib/dc";

export function IndustrySection({ v }: { v: Any }) {
  return (
    <>
    <section id="industry" aria-labelledby="industry-h" style={{position: "relative", overflow: "hidden", background: "#0F4A3A", color: "#FFFFFF", padding: "clamp(72px,9vw,128px) 0"}}>
      <svg aria-hidden="true" viewBox="0 0 800 800" style={{position: "absolute", right: "-240px", top: "-200px", width: "820px", height: "820px", opacity: "0.08"}}>
        <circle cx="400" cy="400" r="290" fill="none" stroke="#A8DCCB" strokeWidth="3"></circle>
        <circle cx="400" cy="400" r="240" fill="none" stroke="#A8DCCB" strokeWidth="3"></circle>
        <circle cx="400" cy="400" r="190" fill="none" stroke="#A8DCCB" strokeWidth="3"></circle>
      </svg>
      {" "}
      <div style={{position: "relative", maxWidth: "1200px", margin: "0 auto 48px", padding: "0 clamp(20px,5vw,80px)", display: "flex", flexDirection: "column", gap: "16px"}}>
        <h2 id="industry-h" style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(34px,3.6vw,52px)", lineHeight: "1.08", letterSpacing: "-0.015em", color: "#FFFFFF", maxWidth: "18ch", textWrap: "balance"}}>
          {"This keeps happening to families."}
        </h2>
        <p style={{margin: "0", fontSize: "clamp(18px,1.45vw,21px)", lineHeight: "1.5", color: "#DDF0DC", maxWidth: "52ch"}}>
          {"Knowvia cannot overrule an insurer. "}
          <strong style={{fontWeight: "700", color: "#C8E6A0"}}>
            {"It changes the part you control:"}
          </strong>
          {" knowing your cover, and its rules, before the desk does."}
        </p>
      </div>
      {" "}
      <div style={{position: "relative"}}>
        <div id="stats-track" className="kv-hscroll" tabIndex={0} role="region" aria-label="Industry numbers. Scroll sideways for more." style={{display: "flex", gap: "20px", overflowX: "auto", scrollSnapType: "x mandatory", scrollPaddingLeft: "max(clamp(20px,5vw,80px),calc((100% - 1200px) / 2))", padding: "4px max(clamp(20px,5vw,80px),calc((100% - 1200px) / 2)) 24px", WebkitOverflowScrolling: "touch"}}>
          <article className="kv-tile" style={{scrollSnapAlign: "start", flex: "0 0 auto", width: "min(400px,84vw)", boxSizing: "border-box", borderRadius: "24px", padding: "clamp(24px,2.6vw,36px)", display: "flex", flexDirection: "column", gap: "14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(168,220,203,0.32)"}}>
            <div role="img" aria-label="Ten people, four highlighted" style={{height: "88px", display: "flex", alignItems: "flex-end", gap: "6px"}}>
              {(v.people ?? []).map((pp: Any, i1: number) => (
                <Fragment key={i1}>
                  <svg width="28" height="37" viewBox="0 0 34 44" aria-hidden="true" style={css(pp.style)}>
                    <circle cx="17" cy="10" r="8" fill={pp.fill}></circle>
                    <path d="M3 43c0-9 6-16 14-16s14 7 14 16z" fill={pp.fill}></path>
                  </svg>
                </Fragment>
              ))}
            </div>
            <p style={{margin: "8px 0 0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(48px,4.4vw,66px)", lineHeight: "1", letterSpacing: "-0.03em", color: "#C8E6A0", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap"}}>
              {v.n.claims}
            </p>
            <p style={{margin: "0", fontSize: "18px", lineHeight: "1.5", color: "#FFFFFF"}}>
              {"of people who claimed say it was "}
              <strong style={{fontWeight: "700"}}>
                {"rejected or only partly paid"}
              </strong>
              {", for reasons they found invalid."}
            </p>
            <p style={{margin: "auto 0 0", paddingTop: "16px", borderTop: "1px solid rgba(168,220,203,0.28)", fontSize: "14px", lineHeight: "1.45", color: "#A8DCCB"}}>
              <strong style={{fontWeight: "700", color: "#FFFFFF"}}>
                {"Source: LocalCircles."}
              </strong>
              {" National survey of claims made 2023 to 2025, 18,989 responses: 15% rejected, 29% partly paid. Published 7 March 2026."}
            </p>
          </article>
          <article className="kv-tile" style={{scrollSnapAlign: "start", flex: "0 0 auto", width: "min(400px,84vw)", boxSizing: "border-box", borderRadius: "24px", padding: "clamp(24px,2.6vw,36px)", display: "flex", flexDirection: "column", gap: "14px", background: "#DDF0DC", color: "#0F4A3A"}}>
            <div role="img" aria-label="Split: ₹15,100 crore disallowed, ₹10,937 crore repudiated" style={{height: "88px", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "8px"}}>
              <div style={{display: "flex", height: "16px", borderRadius: "5px", overflow: "hidden"}}>
                <span className="kv-grow" style={{flex: "15100 1 0", background: "#0F4A3A"}}></span>
                <span className="kv-grow" style={{flex: "10937 1 0", background: "#2E6B4A", opacity: "0.55"}}></span>
              </div>
              <div style={{display: "flex", justifyContent: "space-between", gap: "8px", fontSize: "14px", color: "#2E6B4A", fontWeight: "600"}}>
                <span>
                  {"₹15,100 cr disallowed"}
                </span>
                <span>
                  {"₹10,937 cr repudiated"}
                </span>
              </div>
            </div>
            <p style={{margin: "8px 0 0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(48px,4.4vw,66px)", lineHeight: "1", letterSpacing: "-0.03em", color: "#0F4A3A", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap"}}>
              {v.n.crore}
            </p>
            <p style={{margin: "0", fontSize: "18px", lineHeight: "1.5", color: "#1A3034"}}>
              {"of health insurance claims were rejected or disallowed by insurers in a single year, 2023-24."}
            </p>
            <p style={{margin: "auto 0 0", paddingTop: "16px", borderTop: "1px solid rgba(15,74,58,0.18)", fontSize: "14px", lineHeight: "1.45", color: "#2E6B4A"}}>
              <strong style={{fontWeight: "700", color: "#0F4A3A"}}>
                {"Source: Lok Sabha, using IRDAI data."}
              </strong>
              {" Reply by the Minister of State for Finance. Reported 7 February 2025."}
            </p>
          </article>
          <article className="kv-tile" style={{scrollSnapAlign: "start", flex: "0 0 auto", width: "min(400px,84vw)", boxSizing: "border-box", borderRadius: "24px", padding: "clamp(24px,2.6vw,36px)", display: "flex", flexDirection: "column", gap: "14px", background: "#CDEBE5", color: "#163F42"}}>
            <div role="img" aria-label="Bar chart: the 3 hour rule against waits of up to 48 hours" style={{height: "88px", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "12px"}}>
              <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                <span style={{flex: "0 0 96px", fontSize: "14px", fontWeight: "600"}}>
                  {"The rule"}
                </span>
                <span className="kv-grow" style={{display: "block", height: "14px", width: "6.25%", minWidth: "8px", borderRadius: "4px", background: "#163F42"}}></span>
                <span style={{fontSize: "14px", fontWeight: "600"}}>
                  {"3 h"}
                </span>
              </div>
              <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                <span style={{flex: "0 0 96px", fontSize: "14px", fontWeight: "600"}}>
                  {"Families saw"}
                </span>
                <span style={{flex: "1 1 auto", display: "flex", height: "14px", borderRadius: "4px", overflow: "hidden"}}>
                  <span className="kv-grow" style={{display: "block", width: "12.5%", background: "#7B918E"}}></span>
                  <span className="kv-grow" style={{display: "block", flex: "1 1 auto", background: "#1D8A80"}}></span>
                </span>
                <span style={{fontSize: "14px", fontWeight: "600"}}>
                  {"48 h"}
                </span>
              </div>
            </div>
            <p style={{margin: "8px 0 0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(48px,4.4vw,66px)", lineHeight: "1", letterSpacing: "-0.03em", color: "#163F42", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap"}}>
              {v.n.hours}
            </p>
            <p style={{margin: "0", fontSize: "18px", lineHeight: "1.5", color: "#1A3034"}}>
              {"is the longest wait families reported for approval and discharge. The rule for discharge is 3 hours."}
            </p>
            <p style={{margin: "auto 0 0", paddingTop: "16px", borderTop: "1px solid rgba(15,74,58,0.18)", fontSize: "14px", lineHeight: "1.45", color: "#2E6B4A"}}>
              <strong style={{fontWeight: "700", color: "#163F42"}}>
                {"Source: LocalCircles and IRDAI."}
              </strong>
              {" Survey of 18,119 responses, 7 March 2026. 5 in 10 claimants waited 6 to 48 hours."}
            </p>
          </article>
          <article className="kv-tile" style={{scrollSnapAlign: "start", flex: "0 0 auto", width: "min(400px,84vw)", boxSizing: "border-box", borderRadius: "24px", padding: "clamp(24px,2.6vw,36px)", display: "flex", flexDirection: "column", gap: "14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(168,220,203,0.32)"}}>
            <div role="img" aria-label="Grid of 100 squares, 43 filled" style={{height: "88px", display: "flex", alignItems: "flex-end"}}>
              <div style={{width: "100%", display: "grid", gridTemplateColumns: "repeat(25,minmax(0,1fr))", gap: "3px"}}>
                {(v.grid ?? []).map((g: Any, i2: number) => (
                  <Fragment key={i2}>
                    <span style={css(g.style)}></span>
                  </Fragment>
                ))}
              </div>
            </div>
            <p style={{margin: "8px 0 0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(48px,4.4vw,66px)", lineHeight: "1", letterSpacing: "-0.03em", color: "#A8DCCB", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap"}}>
              {v.n.oop}
            </p>
            <p style={{margin: "0", fontSize: "18px", lineHeight: "1.5", color: "#FFFFFF"}}>
              {"of what India spends on health comes straight out of people's own pockets."}
            </p>
            <p style={{margin: "auto 0 0", paddingTop: "16px", borderTop: "1px solid rgba(168,220,203,0.28)", fontSize: "14px", lineHeight: "1.45", color: "#A8DCCB"}}>
              <strong style={{fontWeight: "700", color: "#FFFFFF"}}>
                {"Source: Ministry of Health and Family Welfare."}
              </strong>
              {" National Health Accounts 2022-23: out-of-pocket spending was 43.4% of total health expenditure."}
            </p>
          </article>
          <div aria-hidden="true" style={{flex: "0 0 1px"}}></div>
        </div>
        {" "}
        <div style={{maxWidth: "1200px", margin: "8px auto 0", padding: "0 clamp(20px,5vw,80px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px"}}>
          <div aria-hidden="true" style={{flex: "1 1 auto", maxWidth: "320px", height: "3px", borderRadius: "3px", background: "rgba(168,220,203,0.25)", overflow: "hidden"}}>
            <span style={css(v.statBarStyle)}></span>
          </div>
          <div style={{display: "flex", gap: "10px"}}>
            <button type="button" onClick={v.statPrev} aria-label="Previous number" style={{width: "48px", height: "48px", borderRadius: "50%", border: "1px solid rgba(168,220,203,0.6)", background: "transparent", color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 6l-6 6 6 6"></path>
              </svg>
            </button>
            <button type="button" onClick={v.statNext} aria-label="Next number" style={{width: "48px", height: "48px", borderRadius: "50%", border: "0", background: "#C8E6A0", color: "#0F4A3A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 6l6 6-6 6"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
      {" "}
      <div style={{position: "relative", maxWidth: "1200px", margin: "48px auto 0", padding: "0 clamp(20px,5vw,80px)"}}>
        <div style={{borderTop: "1px solid rgba(168,220,203,0.28)", paddingTop: "24px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "18px 40px"}}>
          <p style={{margin: "0", flex: "0 0 auto", fontSize: "15px", fontWeight: "600", color: "#DDF0DC"}}>
            {"Where these numbers come from"}
          </p>
          <ul aria-label="Data sources" style={{flex: "1 1 560px", listStyle: "none", margin: "0", padding: "0", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "14px 28px"}}>
            <li>
              <a className="kv-src" href="https://www.moneylife.in/article/health-insurance-claims-worth-rs2603765-crore-rejected-by-insurers-in-fy2324-govt/76282.html" style={{display: "block", borderRadius: "10px", padding: "4px"}}>
                <img className="kv-srclogo" src="/logos/lok-sabha.png" alt="Lok Sabha, Parliament of India" style={{display: "block", height: "40px", width: "auto", filter: "brightness(0) invert(1)", opacity: "0.9"}} />
              </a>
            </li>
            <li>
              <a className="kv-src" href="https://www.moneylife.in/article/health-insurance-claims-worth-rs2603765-crore-rejected-by-insurers-in-fy2324-govt/76282.html" style={{display: "block", borderRadius: "10px", padding: "4px"}}>
                <img className="kv-srclogo" src="/logos/ministry-of-finance.png" alt="Ministry of Finance, Government of India" style={{display: "block", height: "40px", width: "auto", filter: "brightness(0) invert(1)", opacity: "0.9"}} />
              </a>
            </li>
            <li>
              <a className="kv-src" href="https://www.moneylife.in/article/health-insurance-claims-worth-rs2603765-crore-rejected-by-insurers-in-fy2324-govt/76282.html" style={{display: "block", borderRadius: "10px", padding: "4px"}}>
                <img className="kv-srclogo" src="/logos/irdai.png" alt="Insurance Regulatory and Development Authority of India (IRDAI)" style={{display: "block", height: "34px", width: "auto", filter: "brightness(0) invert(1)", opacity: "0.9"}} />
              </a>
            </li>
            <li>
              <a className="kv-src" href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2265816&lang=1&reg=3" style={{display: "block", borderRadius: "10px", padding: "4px"}}>
                <img className="kv-srclogo" src="/logos/ministry-of-health.png" alt="Ministry of Health and Family Welfare, Government of India" style={{display: "block", height: "38px", width: "auto", filter: "brightness(0) invert(1)", opacity: "0.9"}} />
              </a>
            </li>
            <li>
              <a className="kv-src" href="https://www.localcircles.com/a/press/page/health-insurance-claim-survey" style={{display: "block", borderRadius: "10px", padding: "4px"}}>
                <img className="kv-srclogo" src="/logos/localcircles.png" alt="LocalCircles" style={{display: "block", height: "28px", width: "auto", filter: "brightness(0) invert(1)", opacity: "0.9"}} />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
    </>
  );
}
