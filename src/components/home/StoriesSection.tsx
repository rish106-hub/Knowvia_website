"use client";

import type { CSSProperties } from "react";
import { type Any, css } from "@/lib/dc";
import "./sb-research.css";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export function StoriesSection({ v }: { v: Any }) {
  return (
    <section id="stories" aria-labelledby="stories-h" className="sb-sto-sec">
      <div className="sb-wrap">
        <div className="sb-head">
          <div className="sb-head-col">
          <p className="sb-eyebrow sb-rv">{"Real stories · recorded September 2026"}</p>
          <h2 id="stories-h" className="sb-h2 sb-mask">
            {"Four details hid "}
            <span className="mk">{"in plain sight."}</span>
          </h2>
          </div>
          <p className="sb-lede sb-rv" style={d(120)}>
            {"We spoke with more than 50 people across Tier 1, 2 and 3 cities. Each detail was in a health policy the family already had."}
          </p>
        </div>
        <div className="sb-stories">
          <article className="sb-sto clay sb-rv" data-story="0" style={d(0)}>
            <div className={v.hs.p0} style={{ display: "contents" }}>
              <p className="sb-sto-title">{"The room choice"}</p>
              <p className="sb-sto-who">{"A., 26, Gurugram"}</p>
              <div className="sb-sto-vis" role="img" aria-label="Bar chart: a ₹1,200 room choice against an ₹80,000 cost">
                <div className="sb-brow">
                  <span className="sb-bl">{"Room choice"}</span>
                  <span className="kv-bar sb-bar" style={{ width: "1.5%", minWidth: "6px", background: "var(--forest)" }}></span>
                  <b>{"₹1,200"}</b>
                </div>
                <div className="sb-brow">
                  <span className="sb-bl">{"What it cost"}</span>
                  <span className="kv-bar sb-bar" style={{ flex: "1 1 auto", background: "var(--clay)" }}></span>
                  <b>{"₹80,000"}</b>
                </div>
              </div>
              <p className="sb-sto-big mk">{v.st.a}</p>
              <p className="sb-sto-text">{"A ₹1,200 room choice, made with no information, cost one family this much."}</p>
              <p className="sb-sto-pwho">{"A., 26, Gurugram. Recorded conversation, September 2026."}</p>
            </div>
          </article>
          <article className="sb-sto sky sb-rv" data-story="1" style={d(80)}>
            <div className={v.hs.p1} style={{ display: "contents" }}>
              <p className="sb-sto-title">{"The cover gap"}</p>
              <p className="sb-sto-who">{"M., 29, Bengaluru"}</p>
              <div className="sb-sto-vis" role="img" aria-label="Cover bar: base pays up to ₹8 lakh, nothing pays from ₹8 to ₹10 lakh, the top-up pays after ₹10 lakh">
                <div className="sb-gapbar">
                  <span style={{ flex: "8 1 0", background: "var(--forest)" }}>{"Base"}</span>
                  <span className="sb-gapy" style={{ flex: "3 1 0" }}>{"Gap"}</span>
                  <span style={{ flex: "9 1 0", background: "var(--sky)" }}>{"Top-up"}</span>
                </div>
                <div className="sb-gapaxis">
                  <span style={{ flex: "8 1 0" }}>{"₹0"}</span>
                  <span style={{ flex: "3 1 0" }}>{"₹8L"}</span>
                  <span style={{ flex: "9 1 0" }}>{"₹10L"}</span>
                </div>
              </div>
              <p className="sb-sto-big mk">{v.st.b}</p>
              <p className="sb-sto-text">{"A gap neither policy would pay. She found it before paying ₹9,400 for the top-up."}</p>
              <p className="sb-sto-pwho">{"M., 29, Bengaluru. Recorded conversation, September 2026."}</p>
            </div>
          </article>
          <article className="sb-sto plum sb-rv" data-story="2" style={d(160)}>
            <div className={v.hs.p2} style={{ display: "contents" }}>
              <p className="sb-sto-title">{"The 2 a.m. search"}</p>
              <p className="sb-sto-who">{"S., 31, Kolkata"}</p>
              <div className="sb-sto-vis" role="img" aria-label="Timeline from 2 a.m. to 9 a.m.">
                <div className="sb-hours">
                  {(v.hours ?? []).map((h: Any, i: number) => (
                    <span key={i} className="kv-hour" style={css(h)}></span>
                  ))}
                </div>
                <div className="sb-gapaxis">
                  <span>{"2 a.m."}</span>
                  <span style={{ marginLeft: "auto" }}>{"9 a.m."}</span>
                </div>
              </div>
              <p className="sb-sto-big mk">{v.st.c}</p>
              <p className="sb-sto-text">{"Spent at the hospital finding a brother's employer cover."}</p>
              <p className="sb-sto-pwho">{"S., 31, Kolkata. Recorded conversation, September 2026."}</p>
            </div>
          </article>
          <article className="sb-sto white sb-rv" data-story="3" style={d(240)}>
            <div className={v.hs.p3} style={{ display: "contents" }}>
              <p className="sb-sto-title">{"The closed window"}</p>
              <p className="sb-sto-who">{"N., 33, Pune"}</p>
              <div className="sb-sto-vis" role="img" aria-label="Seventeen days, the last one closed">
                <div className="sb-days">
                  {(v.days ?? []).map((dy: Any, i: number) => (
                    <span key={i} className={dy.cls} style={css(dy.style)}>
                      {dy.label}
                    </span>
                  ))}
                </div>
              </div>
              <p className="sb-sto-big mk">{v.st.d}</p>
              <p className="sb-sto-text">{"The window to keep cover after leaving a job. No reminder came. It closed."}</p>
              <p className="sb-sto-pwho">{"N., 33, Pune. Recorded conversation, September 2026."}</p>
            </div>
          </article>
        </div>
        <article className="sb-docs-card sb-rv">
          <div className="sb-docs-copy">
            <p className="sb-sto-title">{"The documents"}</p>
            <p className="sb-sto-who">{"19 shared with us"}</p>
            <p className="sb-sto-big mk">{v.st.e}</p>
            <p className="sb-sto-text">{"documents families shared with us had a detail that did not match what the family believed."}</p>
            <a className="sb-btn" href="#early-list">{"Check yours first"}</a>
          </div>
          <div className="sb-docs" role="img" aria-label="Nineteen documents, seven with a mismatch">
            {(v.docs ?? []).map((dc: Any, i: number) => (
              <i key={i} className={String(dc.style).includes("dashed") ? "y" : ""} style={{ transitionDelay: `${i * 40}ms` }}></i>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
