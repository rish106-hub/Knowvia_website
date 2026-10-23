// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import { Fragment } from "react";
import { type Any } from "@/lib/dc";

export function HouseholdControl({ v }: { v: Any }) {
  return (
    <>
    <section id="privacy" aria-labelledby="privacy-h" style={{background: "#E3F0EE", padding: "clamp(64px,8vw,112px) 0"}}>
      <div className="kv-wrap">
        <div className="kv-headrow">
          <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
            <p className="kv-eyebrow kv-reveal" style={{color: "#176F69"}}>
              {"Family sharing"}
            </p>
            <h2 id="privacy-h" className="kv-h2 kv-reveal" style={{color: "#163F42", maxWidth: "18ch"}}>
              {"Each person decides what family sees."}
            </h2>
          </div>
          {" "}
          <p className="kv-lede kv-reveal kv-d120" style={{color: "#55696D", maxWidth: "38ch"}}>
            {"Share the cover amount. Keep medical details to yourself. Flip a switch and watch what your brother sees change."}
          </p>
        </div>
        {" "}
        <div className="kv-privgrid">
          <div className="kv-tile kv-reveal" style={{background: "#FFFFFF", minHeight: "0"}}>
            <div>
              <p style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "26px", color: "#163F42"}}>
                {"What you share"}
              </p>
              <p style={{margin: "2px 0 0", fontSize: "15px", color: "#55696D"}}>
                {"Change it whenever you like."}
              </p>
            </div>
            {" "}
            <div>
              {(v.priv.rows ?? []).map((pr: Any, i1: number) => (
                <Fragment key={i1}>
                  <div className="kv-sw">
                    <span id={pr.id} style={{fontSize: "18px", fontWeight: "600"}}>
                      {pr.label}
                      <span style={{display: "block", fontWeight: "400", fontSize: "14px", color: "#55696D"}}>
                        {pr.hint}
                      </span>
                    </span>
                    <button className="kv-switch" type="button" role="switch" aria-checked={pr.onStr} aria-labelledby={pr.id} onClick={pr.toggle}>
                      <span></span>
                    </button>
                  </div>
                </Fragment>
              ))}
            </div>
            {" "}
            <p style={{margin: "auto 0 0", paddingTop: "16px", borderTop: "1px solid #CFDCDA", fontSize: "15px", lineHeight: "1.55", color: "#1A3034"}}>
              {"Every adult controls their own record. "}
              <strong style={{fontWeight: "700"}}>
                {"Medical details are never shared by default."}
              </strong>
            </p>
          </div>
          {" "}
          <div className="kv-tile kv-reveal kv-d120" aria-live="polite" style={{background: "#176F69", color: "#FFFFFF", minHeight: "0"}}>
            <svg className="kv-rings" aria-hidden="true" viewBox="0 0 800 800" style={{right: "-320px", top: "-320px", width: "700px", height: "700px", opacity: "0.12"}}>
              <circle cx="400" cy="400" r="290" fill="none" stroke="#C8E6A0" strokeWidth="3"></circle>
              <circle cx="400" cy="400" r="240" fill="none" stroke="#C8E6A0" strokeWidth="3"></circle>
              <circle cx="400" cy="400" r="190" fill="none" stroke="#C8E6A0" strokeWidth="3"></circle>
            </svg>
            {" "}
            <div style={{position: "relative", display: "flex", alignItems: "center", gap: "14px"}}>
              <span aria-hidden="true" style={{flex: "0 0 auto", width: "48px", height: "48px", borderRadius: "50%", background: "#FBF1DD", color: "#7A5207", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "700"}}>
                {"Bro"}
              </span>
              <div>
                <p style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "26px"}}>
                  {"What your brother sees"}
                </p>
                <p style={{margin: "2px 0 0", fontSize: "15px", color: "#DDF0DC"}}>
                  {"Only what you chose to share."}
                </p>
              </div>
            </div>
            {" "}
            <div style={{position: "relative"}}>
              {(v.priv.rows ?? []).map((pf: Any, i2: number) => (
                <Fragment key={i2}>
                  <div className="kv-field">
                    <b>
                      {pf.label}
                    </b>
                    <span className={pf.valCls}>
                      {pf.shown}
                    </span>
                  </div>
                </Fragment>
              ))}
            </div>
            {" "}
            <p style={{position: "relative", margin: "auto 0 0", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.2)", fontSize: "15px", color: "#DDF0DC"}}>
              {v.priv.lock}
            </p>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
