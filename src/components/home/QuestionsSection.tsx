// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import { Fragment } from "react";
import { type Any, css, truthy } from "@/lib/dc";
import { site } from "@/lib/site";

export function QuestionsSection({ v }: { v: Any }) {
  return (
    <>
    <section id="questions" aria-labelledby="faq-h" style={{padding: "clamp(72px,9vw,128px) clamp(20px,5vw,80px)"}}>
      <div style={{maxWidth: "1200px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "32px 72px"}}>
        <div style={{flex: "1 1 280px", display: "flex", flexDirection: "column", gap: "28px", alignSelf: "flex-start"}}>
          <h2 id="faq-h" style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(34px,3.6vw,52px)", lineHeight: "1.08", letterSpacing: "-0.015em", color: "#163F42", maxWidth: "12ch"}}>
            {"Questions families ask us"}
          </h2>
          <div id="ask" style={{background: "#0F4A3A", color: "#FFFFFF", borderRadius: "20px", padding: "24px", display: "flex", flexDirection: "column", gap: "12px", maxWidth: "340px", scrollMarginTop: "96px"}}>
            <p style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "26px", lineHeight: "1.15"}}>
              {"Still have a question?"}
            </p>
            <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5", color: "#DDF0DC"}}>
              {"Write to us. A person replies, not a bot."}
            </p>
            <a className="kv-light" href={`mailto:${site.contactEmail}`} style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", height: "44px", padding: "0 18px", borderRadius: "999px", background: "#FFFFFF", color: "#176F69", fontSize: "16px", fontWeight: "700", textDecoration: "none"}}>
              {"Write to us"}
            </a>
          </div>
        </div>
        <div style={{flex: "2 1 560px", display: "flex", flexDirection: "column", gap: "12px"}}>
          {(v.faqs ?? []).map((q: Any, i1: number) => (
            <Fragment key={i1}>
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
    </section>
    </>
  );
}
