// Hand-written, not generated from the design artboard: edit this file directly.
"use client";

import { EnvelopeSimple, LinkedinLogo, XLogo } from "@phosphor-icons/react";
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import "./sb-research.css";

/* eslint-disable @next/next/no-img-element -- fixed-size founder photo */

const LINKEDIN_URL = "https://www.linkedin.com/in/rishav-dewan/";
const X_URL = "https://x.com/RishavAtKnowvia";
const FOUNDER_EMAIL = "rishavdewan10@gmail.com";

const RESEARCH_HASHES = ["#research", "#industry", "#stories", "#promises"];

/**
 * Collapsed "View our research" band near the foot of the page. It holds the
 * "This keeps happening to families" numbers, the "Four details hid in plain sight"
 * stories and the promises, so the first screens after the hero go straight to the video.
 * The sections stay in the DOM while closed, so the landing model can still find them.
 */
export function ResearchSegment({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openRef = useRef(false);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    const openForHash = () => {
      const hash = window.location.hash;
      if (!RESEARCH_HASHES.includes(hash)) return;
      const wasOpen = openRef.current;
      setOpen(true);
      // The body animates open, so wait for it before scrolling to the target.
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView(), wasOpen || reduce ? 30 : 760);
    };
    openForHash();
    window.addEventListener("hashchange", openForHash);
    return () => window.removeEventListener("hashchange", openForHash);
  }, []);

  return (
    <>
      <section id="research" aria-labelledby="research-h" className="sb-research on-dark">
        <div className="sb-wrap">
          <div className="sb-rs-grid">
            <figure className="sb-rs-photo sb-rv">
              <div className="sb-rs-frame">
                <img src="/founder/rishav-dewan.jpg" alt="Rishav Dewan, who is building Knowvia" width={600} height={600} loading="lazy" decoding="async" />
              </div>
              <figcaption className="sb-rs-name">{"Rishav Dewan"}</figcaption>
            </figure>
            <div className="sb-rs-copy">
              <p className="sb-eyebrow sb-rv">{"Our research"}</p>
              <h2 id="research-h" className="sb-h2 sb-mask">
                {"Why we "}
                <span className="mk">{"built this."}</span>
              </h2>
              <p className="sb-lede sb-rv" style={{ "--d": "120ms" } as CSSProperties}>
                {"Four numbers on claims, four details from real family policies, and what we will not do."}
              </p>
              <button
                className="sb-btn sb-rs-toggle"
                type="button"
                aria-expanded={open}
                aria-controls="research-body"
                onClick={() => setOpen((o) => !o)}
              >
                {open ? "Hide our research" : "View our research"}
              </button>
            </div>
            <div className="sb-rs-connect sb-rv" style={{ "--d": "200ms" } as CSSProperties}>
              <p className="sb-rs-connect-label">{"Connect with me"}</p>
              <div className="sb-rs-links">
                <a className="sb-rs-link" href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
                  <LinkedinLogo size={20} weight="fill" aria-hidden="true" />
                  {"LinkedIn"}
                </a>
                <a className="sb-rs-link" href={X_URL} target="_blank" rel="noopener noreferrer" aria-label="Follow Rishav on X">
                  <XLogo size={18} weight="fill" aria-hidden="true" />
                  {"X"}
                </a>
                <a className="sb-rs-link" href={`mailto:${FOUNDER_EMAIL}`}>
                  <EnvelopeSimple size={20} weight="fill" aria-hidden="true" />
                  {"Email"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div id="research-body" className={`sb-rbody${open ? " open" : ""}`} aria-hidden={!open} inert={!open}>
        <div className="sb-rbody-in">{children}</div>
      </div>
    </>
  );
}
