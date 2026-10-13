// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import { Fragment } from "react";
import { type Any } from "@/lib/dc";

export function ClauseBand({ v }: { v: Any }) {
  return (
    <>
    <section aria-labelledby="terms-h" style={{background: "#DDF0DC", padding: "clamp(48px,6vw,72px) 0", overflow: "hidden"}}>
      <div style={{maxWidth: "1200px", margin: "0 auto clamp(24px,3vw,36px)", padding: "0 clamp(20px,5vw,80px)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "16px 48px"}}>
        <h2 id="terms-h" style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(30px,3vw,42px)", lineHeight: "1.12", letterSpacing: "-0.01em", color: "#0F4A3A", maxWidth: "18ch"}}>
          {"Every clause that decides your bill."}
        </h2>
        <p style={{margin: "0", fontSize: "clamp(17px,1.35vw,19px)", lineHeight: "1.6", maxWidth: "44ch", color: "#1A3034"}}>
          {"Built only for health cover. We explain each of these in plain words, with the page it sits on."}
        </p>
      </div>
      {" "}
      <div className="kv-marquee-wrap" style={{overflow: "hidden"}}>
        <ul className="kv-marquee" style={{listStyle: "none", margin: "0", padding: "0"}}>
          {(v.termsLoop ?? []).map((t: Any, i1: number) => (
            <Fragment key={i1}>
              <li className={t.cls} aria-hidden={t.hidden} style={{display: "flex", alignItems: "center", gap: "22px", paddingRight: "22px", flex: "0 0 auto"}}>
                <span style={{fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "clamp(26px,2.6vw,38px)", lineHeight: "1.2", color: "#0F4A3A", whiteSpace: "nowrap"}}>
                  {t.label}
                </span>
                <svg width="12" height="12" viewBox="0 0 800 800" aria-hidden="true">
                  <path d="M400 80l320 320-320 320-320-320z" fill="#2E6B4A"></path>
                </svg>
              </li>
            </Fragment>
          ))}
        </ul>
      </div>
    </section>
    </>
  );
}
