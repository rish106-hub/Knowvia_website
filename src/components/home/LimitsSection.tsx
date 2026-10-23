// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import { Fragment } from "react";
import { type Any } from "@/lib/dc";

export function LimitsSection({ v }: { v: Any }) {
  return (
    <>
    <section id="promises" aria-labelledby="not-h" style={{background: "#FFFFFF", padding: "clamp(72px,9vw,128px) 0"}}>
      <div className="kv-wrap kv-promise">
        <div className="kv-side">
          <p className="kv-eyebrow kv-reveal" style={{color: "#176F69"}}>
            {"Our promise"}
          </p>
          {" "}
          <h2 id="not-h" className="kv-h2 kv-reveal" style={{color: "#163F42", maxWidth: "11ch"}}>
            {"What we will not do"}
          </h2>
          {" "}
          <p className="kv-lede kv-reveal kv-d120" style={{color: "#55696D", maxWidth: "32ch"}}>
            {"Five lines we will not cross. Hold us to them."}
          </p>
          {" "}
          <p aria-hidden="true" style={{margin: "0", display: "flex", alignItems: "baseline", gap: "10px", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", color: "#A74335"}}>
            <span style={{fontSize: "72px", lineHeight: "1", fontVariantNumeric: "tabular-nums"}}>
              {v.promiseCount}
            </span>
            <span style={{fontSize: "22px", color: "#55696D"}}>
              {"of 5 crossed out"}
            </span>
          </p>
          {" "}
          <p style={{margin: "0", paddingTop: "20px", borderTop: "1px solid #CFDCDA", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontStyle: "italic", fontSize: "clamp(20px,1.7vw,24px)", lineHeight: "1.3", color: "#0F4A3A", maxWidth: "26ch"}}>
            {"That leaves the one job that matters: reading your family's health cover with you, before you need it."}
          </p>
        </div>
        {" "}
        <ol style={{listStyle: "none", margin: "0", padding: "0", borderTop: "1px solid #CFDCDA"}}>
          {(v.promises ?? []).map((p: Any, i1: number) => (
            <Fragment key={i1}>
              <li className={p.cls} data-promise={p.i}>
                <span aria-hidden="true" style={{fontSize: "15px", fontWeight: "700", color: "#176F69", paddingTop: "10px", fontVariantNumeric: "tabular-nums"}}>
                  {p.num}
                </span>
                <p style={{margin: "0"}}>
                  <span className="kv-pl-term">
                    {p.term}
                  </span>
                  <span className="kv-sr">
                    {": we will not do this."}
                  </span>
                </p>
                <p style={{gridColumn: "2", margin: "6px 0 0", fontSize: "18px", lineHeight: "1.5", maxWidth: "46ch"}}>
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
