// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import { Fragment } from "react";
import { type Any, css } from "@/lib/dc";

export function StoriesSection({ v }: { v: Any }) {
  return (
    <>
    <section id="stories" aria-labelledby="stories-h" style={{background: "#FFFFFF", padding: "clamp(64px,8vw,112px) 0"}}>
      <div className="kv-wrap">
        <div className="kv-headrow">
          <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
            <p className="kv-eyebrow kv-reveal" style={{color: "#176F69"}}>
              {"Real stories · recorded September 2026"}
            </p>
            <h2 id="stories-h" className="kv-h2 kv-reveal" style={{color: "#163F42", maxWidth: "16ch"}}>
              {"Four details hid in plain sight."}
            </h2>
          </div>
          {" "}
          <p className="kv-lede kv-reveal kv-d120" style={{color: "#55696D", maxWidth: "40ch"}}>
            {"We spoke with more than 50 people across Tier 1, 2 and 3 cities. Each detail was in a health policy the family already had."}
          </p>
        </div>
        {" "}
        <div className="kv-bento">
          <article className="kv-tile kv-reveal kv-span4 kv-d0" data-story="0" style={{background: "#163F42", color: "#FFFFFF"}}>
            <div className={v.hs.p0} style={{display: "contents"}}>
              <div className="kv-tile-top">
                <b>
                  {"The room choice"}
                </b>
                <span style={{opacity: "0.8"}}>
                  {"A., 26, Gurugram"}
                </span>
              </div>
              {" "}
              <div className="kv-tile-chart" role="img" aria-label="Bar chart: a ₹1,200 room choice against an ₹80,000 cost">
                <div style={{display: "flex", alignItems: "center", gap: "14px", fontSize: "15px"}}>
                  <span style={{flex: "0 0 110px", color: "#C9DDD9"}}>
                    {"Room choice"}
                  </span>
                  <span className="kv-bar" style={{height: "16px", width: "1.5%", minWidth: "6px", borderRadius: "4px", background: "#C9DDD9"}}></span>
                  <b>
                    {"₹1,200"}
                  </b>
                </div>
                {" "}
                <div style={{display: "flex", alignItems: "center", gap: "14px", fontSize: "15px"}}>
                  <span style={{flex: "0 0 110px", color: "#C9DDD9"}}>
                    {"What it cost"}
                  </span>
                  <span className="kv-bar" style={{height: "16px", flex: "1 1 auto", borderRadius: "4px", background: "#E0A02B"}}></span>
                  <b>
                    {"₹80,000"}
                  </b>
                </div>
              </div>
              {" "}
              <p className="kv-pnum">
                {v.st.a}
              </p>
              {" "}
              <p className="kv-ptext">
                {"A ₹1,200 room choice, made with no information, cost one family this much."}
              </p>
              {" "}
              <p className="kv-pwho">
                {"A., 26, Gurugram. Recorded conversation, September 2026."}
              </p>
            </div>
          </article>
          {" "}
          <article className="kv-tile kv-reveal kv-span2 kv-d80" data-story="1" style={{background: "#F3F7F6", color: "#163F42"}}>
            <div className={v.hs.p1} style={{display: "contents"}}>
              <div className="kv-tile-top">
                <b>
                  {"The cover gap"}
                </b>
                <span style={{opacity: "0.8"}}>
                  {"M., 29, Bengaluru"}
                </span>
              </div>
              {" "}
              <div className="kv-tile-chart" role="img" aria-label="Cover bar: base pays up to ₹8 lakh, nothing pays from ₹8 to ₹10 lakh, the top-up pays after ₹10 lakh">
                <div style={{display: "flex", height: "40px", borderRadius: "8px", overflow: "hidden"}}>
                  <span style={{flex: "8 1 0", background: "#E3F0EE", display: "flex", alignItems: "center", paddingLeft: "10px", fontSize: "13px", fontWeight: "600"}}>
                    {"Base"}
                  </span>
                  <span style={{flex: "3 1 0", background: "repeating-linear-gradient(45deg,#FBF1DD 0 6px,#F3DFB4 6px 12px)", borderLeft: "2px dashed #7A5207", borderRight: "2px dashed #7A5207", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", color: "#7A5207"}}>
                    {"Gap"}
                  </span>
                  <span style={{flex: "9 1 0", background: "#163F42", display: "flex", alignItems: "center", paddingLeft: "10px", fontSize: "13px", fontWeight: "600", color: "#FFFFFF"}}>
                    {"Top-up"}
                  </span>
                </div>
                {" "}
                <div style={{display: "flex", fontSize: "13px", color: "#55696D"}}>
                  <span style={{flex: "8 1 0"}}>
                    {"₹0"}
                  </span>
                  <span style={{flex: "3 1 0"}}>
                    {"₹8L"}
                  </span>
                  <span style={{flex: "9 1 0"}}>
                    {"₹10L"}
                  </span>
                </div>
              </div>
              {" "}
              <p className="kv-pnum">
                {v.st.b}
              </p>
              {" "}
              <p className="kv-ptext">
                {"A gap neither policy would pay. She found it before paying ₹9,400 for the top-up."}
              </p>
              {" "}
              <p className="kv-pwho">
                {"M., 29, Bengaluru. Recorded conversation, September 2026."}
              </p>
            </div>
          </article>
          {" "}
          <article className="kv-tile kv-reveal kv-span2 kv-d0" data-story="2" style={{background: "#CDEBE5", color: "#163F42"}}>
            <div className={v.hs.p2} style={{display: "contents"}}>
              <div className="kv-tile-top">
                <b>
                  {"The 2 a.m. search"}
                </b>
                <span style={{opacity: "0.8"}}>
                  {"S., 31, Kolkata"}
                </span>
              </div>
              {" "}
              <div className="kv-tile-chart" role="img" aria-label="Timeline from 2 a.m. to 9 a.m.">
                <div style={{display: "flex", gap: "5px"}}>
                  {(v.hours ?? []).map((h: Any, i1: number) => (
                    <Fragment key={i1}>
                      <span className="kv-hour" style={css(h)}></span>
                    </Fragment>
                  ))}
                </div>
                {" "}
                <div style={{display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#2E6B4A"}}>
                  <span>
                    {"2 a.m."}
                  </span>
                  <span>
                    {"9 a.m."}
                  </span>
                </div>
              </div>
              {" "}
              <p className="kv-pnum">
                {v.st.c}
              </p>
              {" "}
              <p className="kv-ptext">
                {"Spent at the hospital finding a brother's employer cover."}
              </p>
              {" "}
              <p className="kv-pwho">
                {"S., 31, Kolkata. Recorded conversation, September 2026."}
              </p>
            </div>
          </article>
          {" "}
          <article className="kv-tile kv-reveal kv-span2 kv-d80" data-story="3" style={{background: "#DDF0DC", color: "#0F4A3A"}}>
            <div className={v.hs.p3} style={{display: "contents"}}>
              <div className="kv-tile-top">
                <b>
                  {"The closed window"}
                </b>
                <span style={{opacity: "0.8"}}>
                  {"N., 33, Pune"}
                </span>
              </div>
              {" "}
              <div className="kv-tile-chart" role="img" aria-label="Seventeen days, the last one closed">
                <div style={{display: "flex", flexWrap: "wrap", gap: "5px"}}>
                  {(v.days ?? []).map((d: Any, i2: number) => (
                    <Fragment key={i2}>
                      <span className={d.cls} style={css(d.style)}>
                        {d.label}
                      </span>
                    </Fragment>
                  ))}
                </div>
              </div>
              {" "}
              <p className="kv-pnum">
                {v.st.d}
              </p>
              {" "}
              <p className="kv-ptext">
                {"The window to keep cover after leaving a job. No reminder came. It closed."}
              </p>
              {" "}
              <p className="kv-pwho">
                {"N., 33, Pune. Recorded conversation, September 2026."}
              </p>
            </div>
          </article>
          {" "}
          <article className="kv-tile kv-reveal kv-span2 kv-d160" style={{background: "#FBF1DD", color: "#1A3034"}}>
            <div className="kv-tile-top">
              <b style={{color: "#7A5207"}}>
                {"The documents"}
              </b>
              <span style={{opacity: "0.8"}}>
                {"19 shared with us"}
              </span>
            </div>
            {" "}
            <div className="kv-tile-chart" role="img" aria-label="Nineteen documents, seven with a mismatch">
              <div style={{display: "flex", flexWrap: "wrap", gap: "5px"}}>
                {(v.docs ?? []).map((dc: Any, i3: number) => (
                  <Fragment key={i3}>
                    <span style={css(dc.style)}></span>
                  </Fragment>
                ))}
              </div>
            </div>
            {" "}
            <p className="kv-pnum" style={{color: "#7A5207"}}>
              {v.st.e}
            </p>
            {" "}
            <p className="kv-ptext">
              {"documents families shared with us had a detail that did not match what the family believed."}
            </p>
            {" "}
            <a className="kv-btn" href="#early-list" style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", height: "48px", padding: "0 22px", borderRadius: "999px", background: "#0F4A3A", color: "#FFFFFF", fontSize: "16px", fontWeight: "600", textDecoration: "none"}}>
              {"Check yours first"}
            </a>
          </article>
        </div>
      </div>
    </section>
    </>
  );
}
