// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import { Fragment } from "react";
import { type Any, css } from "@/lib/dc";

export function StoriesSection({ v }: { v: Any }) {
  return (
    <>
    <section id="stories" aria-labelledby="stories-h" style={{background: "#FFFFFF", padding: "clamp(72px,9vw,128px) clamp(20px,5vw,80px)"}}>
      <div style={{maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "48px"}}>
        <div style={{display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "16px 48px"}}>
          <h2 id="stories-h" style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(34px,3.6vw,52px)", lineHeight: "1.08", letterSpacing: "-0.015em", color: "#163F42", maxWidth: "14ch", textWrap: "balance"}}>
            {"Four details hid in plain sight."}
          </h2>
          <p style={{margin: "0", fontSize: "clamp(19px,1.46vw,21px)", lineHeight: "1.5", maxWidth: "40ch"}}>
            {"We spoke with more than 50 people across Tier 1, 2 and 3 cities. Each of these was in a health policy the family already had."}
          </p>
        </div>
        <div style={{display: "flex", flexWrap: "wrap", gap: "24px"}}>
          <article className="kv-tile kv-rise" style={{flex: "7 1 540px", background: "#163F42", color: "#FFFFFF", borderRadius: "24px", padding: "clamp(28px,3.4vw,48px)", display: "flex", flexDirection: "column", gap: "22px"}}>
            <p style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(64px,8vw,120px)", lineHeight: "0.95", letterSpacing: "-0.02em", color: "#FFFFFF", fontVariantNumeric: "tabular-nums"}}>
              {v.st.a}
            </p>
            <p style={{margin: "0", fontSize: "clamp(18px,1.5vw,21px)", lineHeight: "1.5", color: "#C9DDD9", maxWidth: "36ch"}}>
              {"A ₹1,200 room choice, made with no information, cost one family "}
              <strong style={{color: "#FFFFFF", fontWeight: "700"}}>
                {"₹80,000"}
              </strong>
              {"."}
            </p>
            <div role="img" aria-label="Bar chart: a ₹1,200 room choice against an ₹80,000 cost" style={{display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px"}}>
              <div style={{display: "flex", alignItems: "center", gap: "14px"}}>
                <span style={{flex: "0 0 120px", fontSize: "15px", color: "#C9DDD9"}}>
                  {"Room choice"}
                </span>
                <span className="kv-grow" style={{display: "block", height: "14px", width: "1.5%", minWidth: "6px", borderRadius: "4px", background: "#C9DDD9"}}></span>
                <span style={{fontSize: "15px", fontWeight: "600"}}>
                  {"₹1,200"}
                </span>
              </div>
              <div style={{display: "flex", alignItems: "center", gap: "14px"}}>
                <span style={{flex: "0 0 120px", fontSize: "15px", color: "#C9DDD9"}}>
                  {"What it cost"}
                </span>
                <span className="kv-grow" style={{display: "block", height: "14px", flex: "1 1 auto", borderRadius: "4px", background: "#E0A02B"}}></span>
                <span style={{fontSize: "15px", fontWeight: "600"}}>
                  {"₹80,000"}
                </span>
              </div>
            </div>
            <p style={{margin: "0", fontSize: "15px", lineHeight: "1.45", color: "#C9DDD9"}}>
              {"A., 26, Gurugram. Recorded conversation, September 2026."}
            </p>
          </article>
          <article className="kv-tile kv-rise" style={{flex: "5 1 380px", background: "#F3F7F6", borderRadius: "24px", padding: "clamp(28px,3vw,40px)", display: "flex", flexDirection: "column", gap: "18px"}}>
            <p style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(52px,5.6vw,84px)", lineHeight: "0.95", letterSpacing: "-0.02em", color: "#163F42", fontVariantNumeric: "tabular-nums"}}>
              {v.st.b}
            </p>
            <p style={{margin: "0", fontSize: "clamp(17px,1.35vw,19px)", lineHeight: "1.55"}}>
              {"A gap neither policy would pay. She found it before paying ₹9,400 for the top-up."}
            </p>
            <div role="img" aria-label="Cover bar: base pays up to ₹8 lakh, nothing pays from ₹8 to ₹10 lakh, the top-up pays after ₹10 lakh" style={{display: "flex", flexDirection: "column", gap: "8px", marginTop: "auto"}}>
              <div style={{display: "flex", height: "40px", borderRadius: "8px", overflow: "hidden"}}>
                <span style={{flex: "8 1 0", background: "#E3F0EE", display: "flex", alignItems: "center", paddingLeft: "10px", fontSize: "14px", fontWeight: "600", color: "#163F42"}}>
                  {"Base"}
                </span>
                <span style={{flex: "2 1 0", background: "repeating-linear-gradient(45deg,#FBF1DD 0 6px,#F3DFB4 6px 12px)", borderLeft: "2px dashed #7A5207", borderRight: "2px dashed #7A5207", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "700", color: "#7A5207"}}>
                  {"Gap"}
                </span>
                <span style={{flex: "10 1 0", background: "#163F42", display: "flex", alignItems: "center", paddingLeft: "10px", fontSize: "14px", fontWeight: "600", color: "#FFFFFF"}}>
                  {"Top-up pays"}
                </span>
              </div>
              <div style={{display: "flex", fontSize: "14px", color: "#55696D"}}>
                <span style={{flex: "8 1 0"}}>
                  {"₹0"}
                </span>
                <span style={{flex: "2 1 0"}}>
                  {"₹8L"}
                </span>
                <span style={{flex: "10 1 0"}}>
                  {"₹10L"}
                </span>
                <span>
                  {"₹20L"}
                </span>
              </div>
            </div>
            <p style={{margin: "0", fontSize: "15px", lineHeight: "1.45", color: "#55696D"}}>
              {"M., 29, Bengaluru. Recorded conversation, September 2026."}
            </p>
          </article>
          <article className="kv-tile kv-rise" style={{flex: "1 1 380px", background: "#CDEBE5", borderRadius: "24px", padding: "clamp(28px,3vw,40px)", display: "flex", flexDirection: "column", gap: "18px"}}>
            <p style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(52px,5.6vw,84px)", lineHeight: "0.95", letterSpacing: "-0.02em", color: "#163F42", fontVariantNumeric: "tabular-nums"}}>
              {v.st.c}
            </p>
            <p style={{margin: "0", fontSize: "clamp(17px,1.35vw,19px)", lineHeight: "1.55"}}>
              {"Spent at the hospital finding a brother's employer cover."}
            </p>
            <div role="img" aria-label="Timeline from 2 a.m. to 9 a.m." style={{display: "flex", flexDirection: "column", gap: "8px"}}>
              <div style={{display: "flex", gap: "4px"}}>
                <span className="kv-grow" style={{flex: "1 1 0", height: "12px", borderRadius: "3px", background: "#163F42"}}></span>
                <span className="kv-grow" style={{flex: "1 1 0", height: "12px", borderRadius: "3px", background: "#163F42"}}></span>
                <span className="kv-grow" style={{flex: "1 1 0", height: "12px", borderRadius: "3px", background: "#163F42"}}></span>
                <span className="kv-grow" style={{flex: "1 1 0", height: "12px", borderRadius: "3px", background: "#163F42"}}></span>
                <span className="kv-grow" style={{flex: "1 1 0", height: "12px", borderRadius: "3px", background: "#163F42"}}></span>
                <span className="kv-grow" style={{flex: "1 1 0", height: "12px", borderRadius: "3px", background: "#163F42"}}></span>
                <span className="kv-grow" style={{flex: "1 1 0", height: "12px", borderRadius: "3px", background: "#163F42"}}></span>
              </div>
              <div style={{display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#55696D"}}>
                <span>
                  {"2 a.m."}
                </span>
                <span>
                  {"9 a.m."}
                </span>
              </div>
            </div>
            <p style={{margin: "0", fontSize: "15px", lineHeight: "1.45", color: "#55696D"}}>
              {"S., 31, Kolkata. Recorded conversation, September 2026."}
            </p>
          </article>
          <article className="kv-tile kv-rise" style={{flex: "1 1 380px", background: "#DDF0DC", borderRadius: "24px", padding: "clamp(28px,3vw,40px)", display: "flex", flexDirection: "column", gap: "18px"}}>
            <p style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(52px,5.6vw,84px)", lineHeight: "0.95", letterSpacing: "-0.02em", color: "#0F4A3A", fontVariantNumeric: "tabular-nums"}}>
              {v.st.d}
            </p>
            <p style={{margin: "0", fontSize: "clamp(17px,1.35vw,19px)", lineHeight: "1.55"}}>
              {"The window to keep cover after leaving a job. No reminder came. It closed."}
            </p>
            <div role="img" aria-label="Seventeen days, the last one closed" style={{display: "flex", flexWrap: "wrap", gap: "5px"}}>
              {(v.days ?? []).map((d: Any, i1: number) => (
                <Fragment key={i1}>
                  <span style={css(d.style)}>
                    {d.label}
                  </span>
                </Fragment>
              ))}
            </div>
            <p style={{margin: "0", fontSize: "15px", lineHeight: "1.45", color: "#55696D"}}>
              {"N., 33, Pune. Recorded conversation, September 2026."}
            </p>
          </article>
          <article className="kv-tile kv-rise" style={{flex: "1 1 380px", background: "#FBF1DD", borderRadius: "24px", padding: "clamp(28px,3vw,40px)", display: "flex", flexDirection: "column", gap: "18px"}}>
            <p style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(52px,5.6vw,84px)", lineHeight: "0.95", letterSpacing: "-0.02em", color: "#163F42", fontVariantNumeric: "tabular-nums"}}>
              {v.st.e}
            </p>
            <p style={{margin: "0", fontSize: "clamp(17px,1.35vw,19px)", lineHeight: "1.55"}}>
              {"policy documents had a detail that did not match what the family believed."}
            </p>
            <div role="img" aria-label="Nineteen documents, seven with a mismatch" style={{display: "flex", flexWrap: "wrap", gap: "6px"}}>
              {(v.docs ?? []).map((d: Any, i2: number) => (
                <Fragment key={i2}>
                  <span style={css(d.style)}></span>
                </Fragment>
              ))}
            </div>
            <p style={{margin: "0", fontSize: "15px", lineHeight: "1.45", color: "#55696D"}}>
              {"Documents families shared with us during this research."}
            </p>
          </article>
        </div>
      </div>
    </section>
    </>
  );
}
