// Generated from the approved Claude Design artboard Main.dc.html, then restyled for the Sunbeam theme.
"use client";

import { type CSSProperties, Fragment } from "react";
import { type Any } from "@/lib/dc";
import "./sb-research.css";

export function LimitsSection({ v }: { v: Any }) {
  return (
    <>
    <section id="promises" aria-labelledby="not-h" className="sb-prom">
      <div className="sb-wrap kv-promise">
        <div className="kv-side">
          <p className="sb-eyebrow sb-rv">
            {"Our promise"}
          </p>
          {" "}
          <h2 id="not-h" className="sb-h2 sb-mask" style={{maxWidth: "11ch"}}>
            {"What we "}<span className="mk">{"will not do"}</span>
          </h2>
          {" "}
          <p className="sb-lede sb-rv" style={{"--d": "120ms", maxWidth: "32ch"} as CSSProperties}>
            {"Five lines we will not cross. Hold us to them."}
          </p>
          {" "}
          <p aria-hidden="true" className="sb-prom-count">
            <span className="sb-prom-n">
              {v.promiseCount}
            </span>
            <span className="sb-prom-of">
              {"of 5 crossed out"}
            </span>
          </p>
          {" "}
          <p className="sb-prom-close">
            {"That leaves the one job that matters: reading your family's health cover with you, before you need it."}
          </p>
        </div>
        {" "}
        <ol className="sb-plist">
          {(v.promises ?? []).map((p: Any, i1: number) => (
            <Fragment key={i1}>
              <li className={p.cls} data-promise={p.i}>
                <span aria-hidden="true" className="sb-pl-num">
                  {p.num}
                </span>
                <p>
                  <span className="kv-pl-term">
                    {p.term}
                  </span>
                  <span className="kv-sr">
                    {": we will not do this."}
                  </span>
                </p>
                <p className="sb-pl-text">
                  {p.text}
                </p>
              </li>
            </Fragment>
          ))}
        </ol>
      </div>
    </section>
    </>
  );
}
