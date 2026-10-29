// Generated from the approved Claude Design artboard Main.dc.html, then hand-edited: the animated film player is replaced by the silent demo video. Regenerating from the artboard would restore the film.
"use client";

import { Fragment } from "react";
import { type Any, css } from "@/lib/dc";

export function HowItWorksSection({ v }: { v: Any }) {
  return (
    <>
    <section id="how" aria-labelledby="how-h" style={{background: "#F3F7F6", padding: "clamp(72px,9vw,128px) 0"}}>
      <div className="kv-film">
        <div>
          <div className="kv-player kv-rise">
            <video
              controls
              muted
              playsInline
              preload="metadata"
              poster="/demo/knowvia-demo-poster.png"
              aria-label="Silent walkthrough of Knowvia on a synthetic family and policy: add a policy, give consent, and see what the document says."
              style={{display: "block", width: "100%", height: "auto", aspectRatio: "16 / 10", background: "#163F42"}}
            >
              <source src="/demo/knowvia-demo.webm" type="video/webm" />
              {"Your browser cannot play this video."}
            </video>
          </div>
          <p style={{margin: "12px 0 0", padding: "0 18px 0 max(18px,var(--kv-edge))", fontSize: "14px", lineHeight: "1.5", color: "#55696D"}}>
            {"Synthetic demo. The family, insurer and policy are made up."}
          </p>
        </div>
        {" "}
        <div style={{display: "flex", flexDirection: "column", gap: "28px"}}>
          <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
            <p className="kv-eyebrow kv-reveal" style={{color: "#176F69"}}>
              {"Watch it work · 33 seconds"}
            </p>
            <h2 id="how-h" className="kv-h2 kv-reveal" style={{color: "#163F42", maxWidth: "14ch"}}>
              {"See three answers for every person."}
            </h2>
            <p className="kv-lede kv-reveal kv-d120" style={{color: "#55696D", maxWidth: "40ch"}}>
              {"When Knowvia opens, add the health policies you already have. It reads them person by person, and shows its working."}
            </p>
          </div>
          <div style={{display: "flex", flexDirection: "column", borderTop: "1px solid #CFDCDA"}}>
            {(v.film.chaps ?? []).map((ch: Any, i2: number) => (
              <Fragment key={i2}>
                <div className="kv-chap" style={{cursor: "default"}}>
                  <span style={css(ch.numStyle)}>
                    {ch.n}
                  </span>
                  <span>
                    <strong style={{display: "block", fontSize: "19px"}}>
                      {ch.title}
                    </strong>
                    <span style={{display: "block", fontSize: "15px", lineHeight: "1.45", marginTop: "2px"}}>
                      {ch.text}
                    </span>
                  </span>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
