// Generated from the approved Claude Design artboard Main.dc.html, then restyled for the Sunbeam theme.
"use client";

import { type CSSProperties, Fragment } from "react";
import { type Any } from "@/lib/dc";
import "./sb-story.css";

export function ContrastSection({ v }: { v: Any }) {
  return (
    <>
    <section id="desk" aria-labelledby="contrast-h" className="sb-desk">
      <div className="sb-wrap">
        <div className="sb-head">
          <h2 id="contrast-h" className="sb-h2 sb-mask" style={{maxWidth: "16ch"}}>
            {"Stop finding out at the "}<span className="mk">{"hospital desk."}</span>
          </h2>
          {" "}
          <p className="sb-lede sb-rv" style={{"--d": "120ms", maxWidth: "32ch"} as CSSProperties}>
            {"The same five moments, two ways. One of them happens at 2 a.m."}
          </p>
        </div>
        <div className="kv-cmp sb-cmp">
          <div className="kv-cmp-row kv-cmp-head">
            <span className="kv-cmp-moment" aria-hidden="true"></span>
            {" "}
            <div className="kv-cmp-old sb-cmp-oldhead">
              <span className="sb-cmp-when">
                {"2 a.m."}
              </span>
              <p>
                {"At the hospital desk"}
              </p>
            </div>
            {" "}
            <div className="kv-cmp-new kv-cmp-top sb-cmp-newhead">
              <p className="sb-cmp-badge">
                <span className="kv-pdot" aria-hidden="true"></span>
                {"The better way"}
              </p>
              <span className="sb-cmp-when">
                {"Any calm day"}
              </span>
              <p>
                {"With Knowvia"}
              </p>
            </div>
          </div>
          {" "}
          {(v.ways ?? []).map((r: Any, i1: number) => (
            <Fragment key={i1}>
              <div className="kv-cmp-row sb-rv" style={{"--d": `${i1 * 70}ms`} as CSSProperties}>
                <p className="kv-cmp-moment sb-cmp-moment">
                  {r.moment}
                </p>
                {" "}
                <div className="kv-cmp-old sb-cmp-old">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18"></path>
                  </svg>
                  <p>
                    <span className="kv-cmp-tag">
                      {"At the desk: "}
                    </span>
                    <span className="kv-strike">
                      {r.old}
                    </span>
                  </p>
                </div>
                {" "}
                <div className="kv-cmp-new sb-cmp-new">
                  <span className="sb-cmp-tick" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="5 12.5 10 17 19 7"></polyline>
                    </svg>
                  </span>
                  <p>
                    <span className="kv-cmp-tag sb-cmp-newtag">
                      {"With Knowvia: "}
                    </span>
                    {r.new}
                  </p>
                </div>
              </div>
            </Fragment>
          ))}
          {" "}
          <div className="kv-cmp-row">
            <span className="kv-cmp-moment" aria-hidden="true"></span>
            {" "}
            <span className="kv-cmp-old" aria-hidden="true"></span>
            {" "}
            <div className="kv-cmp-new kv-cmp-end sb-cmp-end">
              <p>
                {"Walk in already knowing your limits, your gaps and your next step."}
              </p>
              <a className="sb-btn" href="#early-list">
                {"Join the early list"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
