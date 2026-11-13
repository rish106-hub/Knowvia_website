"use client";

import { Fragment } from "react";
import { type Any, truthy } from "@/lib/dc";
import { site } from "@/lib/site";
import "./sb-mid.css";

export function QuestionsSection({ v }: { v: Any }) {
  return (
    <section id="questions" className="sb-faq-sec" aria-labelledby="faq-h">
      <div className="sb-wrap sb-faq">
        <div className="sb-faq-side">
          <p className="sb-eyebrow sb-rv">
            {"Questions"}
          </p>
          <h2 id="faq-h" className="sb-h2 sb-mask">
            {"Questions families "}
            <span className="mk">{"ask us"}</span>
          </h2>
          <div id="ask" className="sb-faq-ask sb-rv">
            <p className="sb-faq-ask-t">{"Still have a question?"}</p>
            <p className="sb-faq-ask-d">{"Write to us. A person replies, not a bot."}</p>
            <a className="sb-btn dk" href={`mailto:${site.contactEmail}`}>
              {"Write to us"}
            </a>
          </div>
        </div>
        <div>
          <div className="sb-tabs" role="group" aria-label="Filter questions by topic">
            {(v.faqTabs ?? []).map((ft: Any, i1: number) => (
              <Fragment key={i1}>
                <button className="sb-tab" type="button" aria-pressed={ft.pressed} onClick={ft.pick}>
                  {ft.label}
                </button>
              </Fragment>
            ))}
          </div>
          <div>
            {(v.faqList ?? []).map((q: Any, i2: number) => (
              <Fragment key={i2}>
                <div className={`sb-qa${truthy(q.open) ? " open" : ""}`}>
                  <h3>
                    <button type="button" onClick={q.toggle} aria-expanded={q.openStr} aria-controls={q.panelId}>
                      <span>{q.question}</span>
                      <span aria-hidden="true" className="sb-pm">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                          <path d="M12 5v14M5 12h14"></path>
                        </svg>
                      </span>
                    </button>
                  </h3>
                  <div id={q.panelId}>
                    {truthy(q.open) && <p className="sb-qa-a">{q.answer}</p>}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
