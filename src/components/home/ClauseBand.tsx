// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import { Fragment } from "react";
import { type Any, css } from "@/lib/dc";

export function ClauseBand({ v }: { v: Any }) {
  return (
    <>
    <section aria-labelledby="terms-h" style={{background: "#DDF0DC", padding: "clamp(64px,8vw,112px) clamp(20px,5vw,80px)", overflow: "hidden"}}>
      <div style={{maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(32px,4vw,48px)"}}>
        <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
          <h2 id="terms-h" style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(34px,3.6vw,52px)", lineHeight: "1.08", letterSpacing: "-0.015em", color: "#0F4A3A", maxWidth: "20ch", textWrap: "balance"}}>
            {"Every clause that decides your bill."}
          </h2>
          <p style={{margin: "0", fontSize: "clamp(18px,1.45vw,21px)", lineHeight: "1.5", maxWidth: "44ch", color: "#1A3034"}}>
            {"Built only for health cover. We explain each of these in plain words, with the page it sits on."}
          </p>
        </div>
        <ul aria-label="Health insurance terms Knowvia explains" style={{listStyle: "none", margin: "0", padding: "8px 0", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px 14px", maxWidth: "1080px"}}>
          {(v.clauses ?? []).map((t: Any, i1: number) => (
            <Fragment key={i1}>
              <li className="kv-clause" style={css(t.style)}>
                <span aria-hidden="true" style={css(t.markStyle)}></span>
                {t.label}
              </li>
            </Fragment>
          ))}
        </ul>
      </div>
    </section>
    </>
  );
}
