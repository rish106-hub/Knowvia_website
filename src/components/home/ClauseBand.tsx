// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import { Fragment } from "react";
import { type Any, css } from "@/lib/dc";

export function ClauseBand({ v }: { v: Any }) {
  return (
    <>
    <section id="clauses" aria-labelledby="terms-h" style={{background: "#DDF0DC", padding: "clamp(72px,9vw,128px) 0"}}>
      <div className="kv-hs" data-hs="">
        <div className="kv-hs-pin">
          <div className="kv-hs-track" data-hs-track="">
            <div className="kv-hs-intro">
              <p className="kv-eyebrow" style={{color: "#2E6B4A"}}>
                {"The fine print"}
              </p>
              {" "}
              <p className="kv-h2" style={{color: "#0F4A3A"}}>
                {"Six words decide your bill."}
              </p>
              {" "}
              <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5", color: "#1A3034", maxWidth: "28ch"}}>
                {"Each one, in plain words, with how a policy might word it. Keep scrolling."}
              </p>
            </div>
            {" "}
            {(v.hsCards ?? []).map((hc: Any, i1: number) => (
              <Fragment key={i1}>
                <article className="kv-hs-card" style={css(hc.style)}>
                  <p className="kv-hs-num" style={{margin: "0"}}>
                    <span>
                      {hc.n}{" / 06"}
                    </span>
                    <span aria-hidden="true">
                      {"→"}
                    </span>
                  </p>
                  {" "}
                  <h3 className="kv-hs-name">
                    {hc.name}
                  </h3>
                  {" "}
                  <p className="kv-hs-def">
                    {hc.def}
                  </p>
                  {" "}
                  <p className="kv-hs-quote">
                    <span>
                      {"How a policy might word it"}
                    </span>
                    {hc.ex}
                  </p>
                </article>
              </Fragment>
            ))}
          </div>
          {" "}
          <div style={{padding: "0 var(--kv-edge)"}}>
            <div className="kv-hs-bar" aria-hidden="true">
              <i data-hs-bar=""></i>
            </div>
          </div>
        </div>
      </div>
      {" "}
      <div className="kv-wrap">
        <div className="kv-headrow">
          <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
            <p className="kv-eyebrow kv-reveal" style={{color: "#2E6B4A"}}>
              {"Built only for health cover"}
            </p>
            <h2 id="terms-h" className="kv-h2 kv-reveal" style={{color: "#0F4A3A", maxWidth: "16ch"}}>
              {"Every clause that decides your bill."}
            </h2>
          </div>
          {" "}
          <p className="kv-lede kv-reveal kv-d120" style={{color: "#1A3034", maxWidth: "34ch"}}>
            {"Twelve terms decide most claims. Tap one for plain words, the way Knowvia will explain it."}
          </p>
        </div>
        {" "}
        <div className="kv-cgrid">
          <ul className="kv-clauses" aria-label="Health insurance terms Knowvia explains">
            {(v.clauses ?? []).map((t: Any, i2: number) => (
              <Fragment key={i2}>
                <li>
                  <button className="kv-clause" type="button" aria-pressed={t.pressed} onClick={t.pick} style={css(t.style)}>
                    <span aria-hidden="true" style={css(t.markStyle)}></span>
                    {t.label}
                  </button>
                </li>
              </Fragment>
            ))}
          </ul>
          {" "}
          <div className="kv-dict" aria-live="polite">
            <svg className="kv-rings" aria-hidden="true" viewBox="0 0 800 800" style={{right: "-300px", bottom: "-300px", width: "700px", height: "700px", opacity: "0.1"}}>
              <circle cx="400" cy="400" r="290" fill="none" stroke="#C8E6A0" strokeWidth="3"></circle>
              <circle cx="400" cy="400" r="240" fill="none" stroke="#C8E6A0" strokeWidth="3"></circle>
              <circle cx="400" cy="400" r="190" fill="none" stroke="#C8E6A0" strokeWidth="3"></circle>
            </svg>
            {" "}
            <div style={{position: "relative", display: "flex", flexDirection: "column", gap: "22px"}}>
              <p className="kv-eyebrow kv-reveal" style={{color: "#A8DCCB"}}>
                {"In plain words"}
              </p>
              <p style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "clamp(40px,4.4vw,64px)", lineHeight: "1", letterSpacing: "-0.02em", color: "#C8E6A0"}}>
                {v.term.name}
              </p>
              <p style={{margin: "0", fontSize: "clamp(19px,1.6vw,23px)", lineHeight: "1.45", maxWidth: "34ch"}}>
                {v.term.def}
              </p>
              <div style={{borderLeft: "3px solid #C8E6A0", padding: "6px 0 6px 16px", maxWidth: "40ch"}}>
                <p style={{margin: "0", fontSize: "12px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "#A8DCCB"}}>
                  {"How a policy might word it"}
                </p>
                <p style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontStyle: "italic", fontSize: "18px", color: "#DDF0DC"}}>
                  {v.term.ex}
                </p>
              </div>
            </div>
            {" "}
            <div style={{position: "relative", display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", color: "#A8DCCB"}}>
              <button className="kv-round" type="button" onClick={v.term.prev} aria-label="Previous term">
                {"←"}
              </button>
              <button className="kv-round" type="button" onClick={v.term.next} aria-label="Next term">
                {"→"}
              </button>
              <span>
                {v.term.pos}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
