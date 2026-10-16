// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import { Fragment } from "react";
import { type Any } from "@/lib/dc";

export function LimitsSection({ v }: { v: Any }) {
  return (
    <>
    <section id="promises" aria-labelledby="not-h" style={{background: "#FFFFFF", padding: "clamp(72px,8vw,112px) clamp(20px,5vw,80px)"}}>
      <div style={{maxWidth: "1200px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "40px 80px", alignItems: "flex-start"}}>
        <div style={{flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "16px", maxWidth: "400px"}}>
          <h2 id="not-h" style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(34px,3.6vw,52px)", lineHeight: "1.08", letterSpacing: "-0.015em", color: "#163F42", maxWidth: "11ch"}}>
            {"What we will not do"}
          </h2>
          <p style={{margin: "0", fontSize: "clamp(17px,1.35vw,19px)", lineHeight: "1.55", color: "#55696D", maxWidth: "32ch"}}>
            {"Five lines we will not cross. Hold us to them."}
          </p>
          <p style={{margin: "12px 0 0", paddingTop: "20px", borderTop: "1px solid #CFDCDA", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontStyle: "italic", fontSize: "clamp(20px,1.7vw,24px)", lineHeight: "1.3", color: "#0F4A3A", maxWidth: "26ch"}}>
            {"That leaves the one job that matters: reading your family's health cover with you, before you need it."}
          </p>
        </div>
        <ol style={{flex: "1.5 1 560px", listStyle: "none", margin: "0", padding: "0", borderBottom: "1px solid #CFDCDA"}}>
          {(v.promises ?? []).map((p: Any, i1: number) => (
            <Fragment key={i1}>
              <li className="kv-refuse" style={{display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "6px 28px", padding: "20px 0", borderTop: "1px solid #CFDCDA"}}>
                <span aria-hidden="true" style={{flex: "0 0 32px", fontSize: "14px", fontWeight: "600", color: "#55696D", fontVariantNumeric: "tabular-nums"}}>
                  {p.num}
                </span>
                <p style={{flex: "1 1 220px", margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(24px,2.2vw,30px)", lineHeight: "1.15", letterSpacing: "-0.01em"}}>
                  <span className="kv-strike kv-strike-text" style={{color: "#55696D", transition: "color 240ms ease-out"}}>
                    {p.term}
                  </span>
                  <span style={{position: "absolute", left: "-9999px"}}>
                    {": we will not do this."}
                  </span>
                </p>
                <p style={{flex: "1.3 1 260px", margin: "0", fontSize: "17px", lineHeight: "1.55", color: "#1A3034"}}>
                  {p.text}
                </p>
              </li>
            </Fragment>
          ))}
        </ol>
      </div>
    </section>
    </>
  );
}
