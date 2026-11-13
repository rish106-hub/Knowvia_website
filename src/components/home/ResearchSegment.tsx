// Hand-written, not generated from the design artboard: edit this file directly.
"use client";

import { EnvelopeSimple, LinkedinLogo, XLogo } from "@phosphor-icons/react";
import { type ReactNode, useEffect, useState } from "react";
import "./research-founder.css";

const LINKEDIN_URL = "https://www.linkedin.com/in/rishav-dewan/";
const X_URL = "https://x.com/RishavAtKnowvia";
const FOUNDER_EMAIL = "rishavdewan10@gmail.com";

const RESEARCH_HASHES = ["#research", "#industry", "#stories", "#privacy", "#promises"];

/**
 * Collapsed "View our research" band near the foot of the page. It holds the
 * "This keeps happening to families" numbers, the "Four details hid in plain sight"
 * stories and the "Each person decides what family sees" privacy controls and the "What we will not do" promises, so the first screens after the hero go straight to the video.
 * The sections stay in the DOM while closed, so the landing model can still find them.
 */
export function ResearchSegment({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openForHash = () => {
      const hash = window.location.hash;
      if (!RESEARCH_HASHES.includes(hash)) return;
      setOpen(true);
      // The target is display:none until the state update lands, so scroll on the next frame.
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
    };
    openForHash();
    window.addEventListener("hashchange", openForHash);
    return () => window.removeEventListener("hashchange", openForHash);
  }, []);

  return (
    <>
      <section id="research" aria-labelledby="research-h" style={{background: "#0F4A3A", color: "#FFFFFF", padding: "clamp(56px,6vw,88px) 0"}}>
        <div className="kv-wrap">
          <div className="kv-rs-grid">
            <div className="kv-rs-copy">
              <p className="kv-eyebrow kv-reveal" style={{color: "#C8E6A0"}}>
                {"Our research"}
              </p>
              <h2 id="research-h" className="kv-h2 kv-reveal" style={{color: "#FFFFFF", maxWidth: "18ch"}}>
                {"Why we built this."}
              </h2>
              <p className="kv-lede kv-reveal kv-d120" style={{color: "#DDF0DC", maxWidth: "46ch"}}>
                {"Four numbers on claims, four details from real family policies, how each person controls what family sees, and what we will not do."}
              </p>
            </div>
            <figure className="kv-rs-photo">
              <div className="kv-rs-avatar">
                <img src="/founder/rishav-dewan.jpg" alt="Rishav Dewan, who is building Knowvia" width={600} height={600} loading="lazy" decoding="async" />
              </div>
              <figcaption className="kv-rs-name">{"Rishav Dewan"}</figcaption>
            </figure>
            <div className="kv-rs-cta">
              <button
                className="kv-btn"
                type="button"
                aria-expanded={open}
                aria-controls="research-body"
                onClick={() => setOpen((o) => !o)}
                style={{height: "56px", padding: "0 30px", border: "0", borderRadius: "999px", background: "#C8E6A0", color: "#0F4A3A", font: "inherit", fontSize: "17px", fontWeight: "600", cursor: "pointer"}}
              >
                {open ? "Hide our research" : "View our research"}
              </button>
            </div>
            <div className="kv-rs-connect">
              <p className="kv-eyebrow kv-rs-connect-label">{"Connect with me"}</p>
              <div className="kv-rs-links">
                <a className="kv-rs-link" href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
                  <LinkedinLogo size={22} weight="fill" aria-hidden="true" />
                  {"LinkedIn"}
                </a>
                <a className="kv-rs-link" href={X_URL} target="_blank" rel="noopener noreferrer" aria-label="Follow Rishav on X">
                  <XLogo size={20} weight="fill" aria-hidden="true" />
                  {"X"}
                </a>
                <a className="kv-rs-link" href={`mailto:${FOUNDER_EMAIL}`}>
                  <EnvelopeSimple size={22} weight="fill" aria-hidden="true" />
                  {"Email"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div id="research-body" hidden={!open}>
        {children}
      </div>
    </>
  );
}
