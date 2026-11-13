// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import { Fragment } from "react";
import { type Any, css, truthy } from "@/lib/dc";
import { site } from "@/lib/site";

export function QuestionsSection({ v }: { v: Any }) {
  return (
    <>
    <section id="questions" aria-labelledby="faq-h" style={{background: "#F3F7F6", padding: "clamp(72px,9vw,128px) 0"}}>
      <div className="kv-wrap kv-faq">
        <div className="kv-side">
          <p className="kv-eyebrow kv-reveal" style={{color: "#176F69"}}>
            {"Questions"}
          </p>
          {" "}
          <h2 id="faq-h" className="kv-h2 kv-reveal" style={{color: "#163F42", maxWidth: "12ch"}}>
            {"Questions families ask us"}
          </h2>
          {" "}
          <div id="ask" style={{marginTop: "8px", paddingTop: "24px", borderTop: "1px solid #CFDCDA", display: "flex", flexDirection: "column", gap: "12px", maxWidth: "340px", scrollMarginTop: "96px"}}>
            <p style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "26px", lineHeight: "1.15", color: "#163F42"}}>
              {"Still have a question?"}
            </p>
            <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5", color: "#55696D"}}>
              {"Write to us. A person replies, not a bot."}
            </p>
            <a className="kv-btn" href={`mailto:${site.contactEmail}`} style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", height: "48px", padding: "0 22px", borderRadius: "999px", background: "#176F69", color: "#FFFFFF", fontSize: "16px", fontWeight: "700", textDecoration: "none"}}>
              {"Write to us"}
            </a>
          </div>
        </div>
        {" "}
        <div>
          <div className="kv-tabs" role="group" aria-label="Filter questions by topic">
            {(v.faqTabs ?? []).map((ft: Any, i1: number) => (
              <Fragment key={i1}>
                <button className="kv-tab" type="button" aria-pressed={ft.pressed} onClick={ft.pick}>
                  {ft.label}
                </button>
              </Fragment>
            ))}
          </div>
          {" "}
          <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
            {(v.faqList ?? []).map((q: Any, i2: number) => (
              <Fragment key={i2}>
                <div style={css(q.boxStyle)}>
                  <h3 style={{margin: "0"}}>
                    <button type="button" onClick={q.toggle} aria-expanded={q.openStr} aria-controls={q.panelId} style={{width: "100%", minHeight: "72px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "24px", padding: "18px 24px", border: "0", background: "transparent", textAlign: "left", font: "inherit", fontSize: "clamp(19px,1.5vw,22px)", fontWeight: "600", lineHeight: "1.3", color: "#163F42", cursor: "pointer"}}>
                      <span>
                        {q.question}
                      </span>
                      <span aria-hidden="true" style={css(q.iconStyle)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                          <path d="M12 5v14M5 12h14"></path>
                        </svg>
                      </span>
                    </button>
                  </h3>
                  {" "}
                  <div id={q.panelId}>
                    {truthy(q.open) && (
                      <>
                      <p style={{margin: "0", padding: "0 24px 24px", fontSize: "clamp(17px,1.35vw,19px)", lineHeight: "1.6", maxWidth: "62ch", animation: "kvIn 240ms cubic-bezier(0.165,0.84,0.44,1) both"}}>
                        {q.answer}
                      </p>
                      </>
                    )}
                  </div>
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
